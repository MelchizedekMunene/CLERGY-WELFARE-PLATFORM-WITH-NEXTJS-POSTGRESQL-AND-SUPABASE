// src/app/api/events/route.js
// GET  /api/events         - list events (admins see all, members see published only)
// POST /api/events         - admin creates an event

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type');   // optional: MEETING | PROJECT | SOCIAL
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where = {};

    // Members only see published events
    if (session.user.role === 'MEMBER') {
      where.is_published = true;
    }

    // Optional filter by event type
    if (type && ['MEETING', 'PROJECT', 'SOCIAL'].includes(type)) {
      where.event_type = type;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { event_date: 'asc' },
      skip: offset,
      take: limit,
      include: {
        createdBy: {
          select: { id: true, full_name: true },
        },
      },
    });

    return Response.json({ success: true, data: events });
  } catch (error) {
    console.error('GET /api/events error:', error);
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
    const { title, description, event_date, location, event_type, is_published } = body;

    // Validate required fields
    if (!title || !event_date) {
      return Response.json(
        { error: 'Missing required fields: title, event_date' },
        { status: 400 }
      );
    }

    // Validate event_type if provided
    if (event_type && !['MEETING', 'PROJECT', 'SOCIAL'].includes(event_type)) {
      return Response.json(
        { error: 'Invalid event_type. Must be MEETING, PROJECT, or SOCIAL' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        event_date: new Date(event_date),
        location: location || null,
        event_type: event_type || null,
        is_published: is_published !== undefined ? is_published : true,
        created_by: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, full_name: true },
        },
      },
    });

    return Response.json(
      { success: true, data: event, message: 'Event created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/events error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}