import { prisma } from '@/lib/prisma';
import { createContribution, getMemberContributions, getContributionsByType, getMemberFinancialSummary } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // MONTHLY_CONTRIBUTION, SOCIAL_WELFARE, SPECIAL
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let contributions;

    if (session.user.role === 'MEMBER') {
      // Members can only see their own contributions
      contributions = await getMemberContributions(session.user.id, limit, offset);
    } else if (session.user.role === 'ADMIN') {
      // Admins can see all contributions, optionally filtered by type
      if (type) {
        contributions = await getContributionsByType(type, limit, offset);
      } else {
        contributions = await prisma.contribution.findMany({
          orderBy: { contribution_date: 'desc' },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
              },
            },
            recordedBy: {
              select: { id: true, full_name: true },
            },
          },
        });
      }
    } else {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json({ success: true, data: contributions });
  } catch (error) {
    console.error('GET /api/financial/contributions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      expectedAmount,
      contribution_type, // MONTHLY_CONTRIBUTION, SOCIAL_WELFARE, SPECIAL
      contribution_date,
      payment_method,
      transaction_ref,
      notes,
      memberId, // for admin adding contributions on behalf
    } = body;

    // Validate required fields
    if (amount === undefined || amount === null || !contribution_type || !contribution_date) {
      return Response.json(
        { error: 'Missing required fields: amount, contribution_type, contribution_date' },
        { status: 400 }
      );
    }

    // Validate contribution type
    if (!['MONTHLY_CONTRIBUTION', 'SOCIAL_WELFARE', 'SPECIAL'].includes(contribution_type)) {
      return Response.json(
        { error: 'Invalid contribution_type. Must be MONTHLY_CONTRIBUTION, SOCIAL_WELFARE, or SPECIAL' },
        { status: 400 }
      );
    }

    let targetUserId = session.user.id;

    // Only admins can record contributions for other members
    if (memberId && session.user.role === 'ADMIN') {
      targetUserId = memberId;
    } else if (memberId && session.user.role !== 'ADMIN') {
      return Response.json(
        { error: 'Only admins can record contributions for other members' },
        { status: 403 }
      );
    }

    const contribution = await createContribution(targetUserId, {
      amount,
      expectedAmount,
      contribution_type,
      contribution_date,
      payment_method,
      transaction_ref,
      notes,
      recorded_by: session.user.role === 'ADMIN' ? session.user.id : null,
    });

    return Response.json(
      { success: true, data: contribution, message: 'Contribution recorded successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/financial/contributions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
