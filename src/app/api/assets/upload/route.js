// src/app/api/assets/upload/route.js
// POST /api/assets/upload
// Receives a file (multipart/form-data), uploads it to Supabase Storage
// using the service role key (server-side only), and returns the public URL.
// The admin client then calls POST /api/assets/[assetId]/documents to save metadata.

import { getCurrentSession } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase';

// Allowed file types for asset documents
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const BUCKET = 'asset-documents';

export async function POST(req) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const assetId = formData.get('assetId');

    if (!file || !assetId) {
      return Response.json({ error: 'Missing file or assetId' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: `File type not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Build a unique storage path: assets/{assetId}/{timestamp}-{sanitized-filename}
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `assets/${assetId}/${Date.now()}-${sanitizedName}`;

    // Convert file to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const supabaseServer = getSupabaseServerClient();

    const { data, error } = await supabaseServer.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return Response.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabaseServer.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return Response.json({
      success: true,
      url: urlData.publicUrl,
      filename: file.name,
      storagePath,
    });
  } catch (error) {
    console.error('POST /api/assets/upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}