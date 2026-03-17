// src/app/api/assets/[assetId]/documents/[documentId]/route.js
// DELETE /api/assets/[assetId]/documents/[documentId]
// Deletes the document record from DB and removes the file from Supabase Storage

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function DELETE(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { assetId, documentId } = await params;

    const document = await prisma.assetDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.asset_id !== assetId) {
      return Response.json({ error: 'Document does not belong to this asset' }, { status: 400 });
    }

    // Remove from Supabase Storage
    try {
      const supabaseServer = getSupabaseServerClient();
      const url = new URL(document.url);
      const parts = url.pathname.split('/asset-documents/');
      if (parts[1]) {
        await supabaseServer.storage.from('asset-documents').remove([parts[1]]);
      }
    } catch (storageError) {
      // Log but don't fail — DB record should still be removed
      console.error('Storage deletion error (non-fatal):', storageError);
    }

    // Remove DB record
    await prisma.assetDocument.delete({ where: { id: documentId } });

    return Response.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/assets/[assetId]/documents/[documentId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}