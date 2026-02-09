import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        purchase_date: true,
        purchase_price: true,
        current_value: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return new Response(JSON.stringify(assets), { status: 200 });
  } catch (error) {
    console.error('GET /api/assets error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const body = await req.json();
    const { name, description, purchase_date, purchase_price } = body;
    if (!name) return new Response(JSON.stringify({ error: 'Name required' }), { status: 400 });

    const asset = await prisma.asset.create({
      data: {
        name,
        description,
        purchase_date: purchase_date ? new Date(purchase_date) : null,
        purchase_price: purchase_price ?? null,
        created_by: session.user.id,
      },
    });

    return new Response(JSON.stringify(asset), { status: 201 });
  } catch (error) {
    console.error('POST /api/assets error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
