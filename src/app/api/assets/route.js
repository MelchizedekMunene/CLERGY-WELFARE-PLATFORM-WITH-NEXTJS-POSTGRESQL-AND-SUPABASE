// src/app/api/assets/route.js
// GET  /api/assets  - list all assets (authenticated users)
// POST /api/assets  - create a new asset (admin only)

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await prisma.asset.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        createdBy: {
          select: { id: true, full_name: true },
        },
        documents: {
          select: {
            id: true,
            filename: true,
            url: true,
            is_sensitive: true,
            created_at: true,
            uploadedBy: {
              select: { id: true, full_name: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        investments: {
          select: {
            id: true,
            total_amount: true,
            acquired_at: true,
          },
        },
      },
    });

    // For members, strip sensitive document URLs but keep the record visible (Option B)
    let result = assets;
    if (session.user.role === 'MEMBER') {
      result = assets.map(asset => ({
        ...asset,
        documents: asset.documents.map(doc => ({
          ...doc,
          url: doc.is_sensitive ? null : doc.url,  // null URL = restricted
        })),
      }));
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/assets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, purchase_date, purchase_price, current_value } = body;

    if (!name) {
      return Response.json({ error: 'Asset name is required' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        description: description || null,
        purchase_date: purchase_date ? new Date(purchase_date) : null,
        purchase_price: purchase_price ? parseFloat(purchase_price) : null,
        current_value: current_value ? parseFloat(current_value) : null,
        created_by: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, full_name: true } },
        documents: true,
        investments: true,
      },
    });

    return Response.json(
      { success: true, data: asset, message: 'Asset created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/assets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}