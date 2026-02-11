import { prisma } from '@/lib/prisma';
import { updateContribution, deleteContribution } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contributionId } = params;
    const body = await req.json();

    // Check if contribution exists
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return Response.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // Members can only update their own contributions, admins can update any
    if (session.user.role === 'MEMBER' && contribution.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await updateContribution(contributionId, body);

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
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { contributionId } = params;

    // Check if contribution exists
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