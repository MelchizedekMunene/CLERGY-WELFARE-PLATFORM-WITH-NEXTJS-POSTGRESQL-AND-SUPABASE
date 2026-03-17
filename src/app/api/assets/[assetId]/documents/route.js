// src/app/api/assets/[assetId]/documents/route.js
// GET  /api/assets/[assetId]/documents  - list documents for an asset
// POST /api/assets/[assetId]/documents  - save document metadata after upload (admin only)

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId } = await params;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const documents = await prisma.assetDocument.findMany({
      where: { asset_id: assetId },
      orderBy: { created_at: 'desc' },
      include: {
        uploadedBy: { select: { id: true, full_name: true } },
      },
    });

    // Option B: members see all docs but sensitive ones have null URL
    let result = documents;
    if (session.user.role === 'MEMBER') {
      result = documents.map(doc => ({
        ...doc,
        url: doc.is_sensitive ? null : doc.url,
      }));
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/assets/[assetId]/documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { assetId } = await params;
    const body = await req.json();
    const { filename, url, is_sensitive } = body;

    if (!filename || !url) {
      return Response.json(
        { error: 'Missing required fields: filename, url' },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const document = await prisma.assetDocument.create({
      data: {
        asset_id: assetId,
        filename,
        url,
        is_sensitive: is_sensitive !== undefined ? Boolean(is_sensitive) : true,
        uploaded_by: session.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, full_name: true } },
      },
    });

    return Response.json(
      { success: true, data: document, message: 'Document saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/assets/[assetId]/documents error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}