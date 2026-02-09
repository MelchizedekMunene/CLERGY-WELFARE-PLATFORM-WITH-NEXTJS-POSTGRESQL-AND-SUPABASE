import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id) return new Response(JSON.stringify({ error: 'Asset id is required' }), { status: 400 });
  try {
    const session = await getCurrentSession();

    // If admin, include all documents; members only non-sensitive
    const includeDocs = session?.user?.role === 'ADMIN';

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        documents: includeDocs
          ? true
          : { where: { is_sensitive: false } },
        investments: {
          select: { id: true, total_amount: true, acquired_at: true },
        },
      },
    });

    if (!asset) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    return new Response(JSON.stringify(asset), { status: 200 });
  } catch (error) {
    console.error('GET /api/assets/[id] error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  if (!id) return new Response(JSON.stringify({ error: 'Asset id is required' }), { status: 400 });
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    await prisma.asset.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/assets/[id] error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
