import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req, { params }) {
  const { id } = params; // asset id
  try {
    const session = await getCurrentSession();
    const canSeeSensitive = session?.user?.role === 'ADMIN';

    const docs = await prisma.assetDocument.findMany({
      where: {
        asset_id: id,
        ...(canSeeSensitive ? {} : { is_sensitive: false }),
      },
      select: {
        id: true,
        filename: true,
        url: true,
        is_sensitive: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return new Response(JSON.stringify(docs), { status: 200 });
  } catch (error) {
    console.error('GET /api/assets/[id]/documents error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  } finally {
    try { await prisma.$disconnect(); } catch {};
  }
}

// Simple JSON-based document creation (no file upload). Admins only.
export async function POST(req, { params }) {
  const { id } = params; // asset id
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const body = await req.json();
    const { filename, url, is_sensitive = true } = body;
    if (!filename || !url) return new Response(JSON.stringify({ error: 'filename and url required' }), { status: 400 });

    const doc = await prisma.assetDocument.create({
      data: {
        asset_id: id,
        filename,
        url,
        uploaded_by: session.user.id,
        is_sensitive,
      },
    });

    return new Response(JSON.stringify(doc), { status: 201 });
  } catch (error) {
    console.error('POST /api/assets/[id]/documents error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  } finally {
    try { await prisma.$disconnect(); } catch {};
  }
}
