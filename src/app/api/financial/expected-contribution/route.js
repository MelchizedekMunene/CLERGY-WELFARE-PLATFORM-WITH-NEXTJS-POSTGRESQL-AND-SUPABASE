import { prisma } from '@/lib/prisma';
import { setExpectedContribution, setExpectedContributionsForMultipleMembers, getMemberExpectedContributions } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const memberId = url.searchParams.get('memberId');

    if (memberId) {
      // Get expected contributions for a specific member
      const expected = await getMemberExpectedContributions(memberId);
      return Response.json({ success: true, data: expected });
    } else if (session.user.role === 'ADMIN') {
      // Get all expected contributions (admin only)
      const allExpected = await prisma.expectedContribution.findMany({
        where: {
          OR: [
            { effective_until: null },
            { effective_until: { gte: new Date() } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          setBy: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
      return Response.json({ success: true, data: allExpected });
    } else {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (error) {
    console.error('GET /api/financial/expected-contributions error:', error);
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
    const {
      memberIds, // Array of member IDs for bulk setting
      memberId,  // Single member ID
      contribution_type,
      expected_amount,
      effective_from,
      effective_until,
      notes,
    } = body;

    // Validate required fields
    if (!contribution_type || !expected_amount || !effective_from) {
      return Response.json(
        { error: 'Missing required fields: contribution_type, expected_amount, effective_from' },
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

    const data = {
      contribution_type,
      expected_amount,
      effective_from,
      effective_until,
      notes,
    };

    let result;

    // Check if bulk setting (multiple members)
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      result = await setExpectedContributionsForMultipleMembers(
        memberIds,
        data,
        session.user.id
      );
      return Response.json(
        {
          success: true,
          data: result,
          message: `Expected contribution set for ${memberIds.length} member(s)`,
        },
        { status: 201 }
      );
    } else if (memberId) {
      // Single member
      result = await setExpectedContribution(memberId, data, session.user.id);
      return Response.json(
        {
          success: true,
          data: result,
          message: 'Expected contribution set successfully',
        },
        { status: 201 }
      );
    } else {
      return Response.json(
        { error: 'Must provide either memberId or memberIds' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('POST /api/financial/expected-contributions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}