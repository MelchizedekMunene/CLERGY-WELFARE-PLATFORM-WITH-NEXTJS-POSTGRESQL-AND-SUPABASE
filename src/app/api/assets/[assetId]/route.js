// src/app/api/assets/[assetId]/route.js
// PATCH  /api/assets/[assetId]  - update asset details (admin only)
// DELETE /api/assets/[assetId]  - delete asset and all its documents (admin only)

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function PATCH(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { assetId } = await params;
    const body = await req.json();

    const existing = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!existing) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const updateData = {};
    if (body.name !== undefined)           updateData.name = body.name;
    if (body.description !== undefined)    updateData.description = body.description;
    if (body.purchase_date !== undefined)  updateData.purchase_date = body.purchase_date ? new Date(body.purchase_date) : null;
    if (body.purchase_price !== undefined) updateData.purchase_price = body.purchase_price ? parseFloat(body.purchase_price) : null;
    if (body.current_value !== undefined)  updateData.current_value = body.current_value ? parseFloat(body.current_value) : null;

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        createdBy: { select: { id: true, full_name: true } },
        documents: {
          include: { uploadedBy: { select: { id: true, full_name: true } } },
          orderBy: { created_at: 'desc' },
        },
        investments: true,
      },
    });

    return Response.json({ success: true, data: updated, message: 'Asset updated successfully' });
  } catch (error) {
    console.error('PATCH /api/assets/[assetId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { assetId } = await params;

    const existing = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { documents: true },
    });

    if (!existing) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete files from Supabase Storage before removing DB records
    if (existing.documents.length > 0) {
      const supabaseServer = getSupabaseServerClient();
      const filePaths = existing.documents
        .map(doc => {
          // Extract the storage path from the full URL
          // URL format: .../storage/v1/object/public/asset-documents/{path}
          try {
            const url = new URL(doc.url);
            const parts = url.pathname.split('/asset-documents/');
            return parts[1] || null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (filePaths.length > 0) {
        await supabaseServer.storage.from('asset-documents').remove(filePaths);
      }
    }

    // Cascade delete handles documents in DB via Prisma schema onDelete: Cascade
    await prisma.asset.delete({ where: { id: assetId } });

    return Response.json({ success: true, message: 'Asset and all documents deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/assets/[assetId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}