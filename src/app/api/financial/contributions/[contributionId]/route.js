import { prisma } from '@/lib/prisma';
import { updateContribution, deleteContribution } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contributionId } = await params;
    const body = await req.json();

    // Check if contribution exists
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return Response.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // Members can only update their own contributions
    if (session.user.role === 'MEMBER' && contribution.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // FIXED (Bug #4): Members must never be able to update sensitive fields.
    // Previously the full body was passed to updateContribution with no field
    // restrictions, meaning a member could POST { status: "PAID" } and mark
    // their own contribution as paid without actually paying.
    //
    // Members can only update: notes (and nothing else).
    // Admins can update:       amount, expectedAmount, status, notes.
    let allowedBody;
    if (session.user.role === 'ADMIN') {
      allowedBody = {
        amount:         body.amount,
        expectedAmount: body.expectedAmount,
        status:         body.status,
        notes:          body.notes,
      };
    } else {
      // MEMBER: only notes are editable
      allowedBody = {
        notes: body.notes,
      };

      // Explicitly reject any attempt to modify restricted fields
      const restrictedFields = ['status', 'amount', 'expectedAmount', 'recorded_by'];
      const attempted = restrictedFields.filter(f => body[f] !== undefined);
      if (attempted.length > 0) {
        return Response.json(
          { error: `Members cannot update: ${attempted.join(', ')}` },
          { status: 403 }
        );
      }
    }

    const updated = await updateContribution(contributionId, allowedBody);

    return Response.json({
      success: true,
      data: updated,
      message: 'Contribution updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/financial/contributions/[contributionId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getCurrentSession();

    // FIXED: Return 403 (Forbidden) not 401 (Unauthorized) for authenticated non-admins.
    // 401 = not logged in. 403 = logged in but not allowed.
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { contributionId } = await params;

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return Response.json({ error: 'Contribution not found' }, { status: 404 });
    }

    await deleteContribution(contributionId);

    return Response.json({
      success: true,
      message: 'Contribution deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/financial/contributions/[contributionId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}