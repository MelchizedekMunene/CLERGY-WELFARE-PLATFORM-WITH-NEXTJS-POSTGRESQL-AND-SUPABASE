// src/app/api/events/upcoming/route.js
// GET /api/events/upcoming
// Returns the next N published events from today onwards.
// Used by the member dashboard UpcomingEventsWidget.

import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');

    const events = await prisma.event.findMany({
      where: {
        is_published: true,
        event_date: {
          gte: new Date(), // from now onwards
        },
      },
      orderBy: { event_date: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        event_date: true,
        location: true,
        event_type: true,
      },
    });

    return Response.json({ success: true, data: events });
  } catch (error) {
    console.error('GET /api/events/upcoming error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}