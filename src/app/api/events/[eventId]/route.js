// src/app/api/events/[eventId]/route.js
// PATCH  /api/events/[eventId]  - admin edits an event
// DELETE /api/events/[eventId]  - admin deletes an event

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await req.json();

    // Check event exists
    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate event_type if provided
    if (body.event_type && !['MEETING', 'PROJECT', 'SOCIAL'].includes(body.event_type)) {
      return Response.json(
        { error: 'Invalid event_type. Must be MEETING, PROJECT, or SOCIAL' },
        { status: 400 }
      );
    }

    // Build update payload — only include defined fields
    const updateData = {};
    if (body.title !== undefined)        updateData.title = body.title;
    if (body.description !== undefined)  updateData.description = body.description;
    if (body.event_date !== undefined)   updateData.event_date = new Date(body.event_date);
    if (body.location !== undefined)     updateData.location = body.location;
    if (body.event_type !== undefined)   updateData.event_type = body.event_type;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, full_name: true },
        },
      },
    });

    return Response.json({
      success: true,
      data: updated,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('PATCH /api/events/[eventId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { eventId } = await params;

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.event.delete({ where: { id: eventId } });

    return Response.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/events/[eventId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}