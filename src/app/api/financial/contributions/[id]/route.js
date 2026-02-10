import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, full_name: true, email: true, phone: true },
        },
        recordedBy: {
          select: { id: true, full_name: true },
        },
      },
    });

    if (!contribution) {
      return Response.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // Members can only view their own contributions
    if (session.user.role === 'MEMBER' && contribution.user_id !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json({ success: true, data: contribution });
  } catch (error) {
    console.error('GET /api/financial/contributions/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized. Only admins can edit contributions.' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { amount, status, notes, payment_method, transaction_ref } = body;

    // Fetch existing contribution to verify it exists
    const existing = await prisma.contribution.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // Build update data
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (transaction_ref !== undefined) updateData.transaction_ref = transaction_ref;

    const updated = await prisma.contribution.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, full_name: true } },
      },
    });

    return Response.json({ success: true, data: updated, message: 'Contribution updated' });
  } catch (error) {
    console.error('PATCH /api/financial/contributions/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized. Only admins can delete contributions.' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.contribution.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Contribution not found' }, { status: 404 });
    }

    await prisma.contribution.delete({ where: { id } });

    return Response.json({ success: true, message: 'Contribution deleted' });
  } catch (error) {
    console.error('DELETE /api/financial/contributions/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
