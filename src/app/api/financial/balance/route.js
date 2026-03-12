// app/api/financial/balance/route.js
// Returns the outstanding balance for the current member (or a specific member
// for admins) broken down by contribution type.
//
// GET /api/financial/balance
// GET /api/financial/balance?memberId=xxx   (admin only)
// GET /api/financial/balance?type=MONTHLY_CONTRIBUTION  (single type)

import { getMemberBalanceByType } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

const CONTRIBUTION_TYPES = ['MONTHLY_CONTRIBUTION', 'SOCIAL_WELFARE', 'SPECIAL'];

export async function GET(req) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedMemberId = url.searchParams.get('memberId');
    const type = url.searchParams.get('type'); // optional: single type query

    // Determine which user's balance to fetch
    let targetUserId = session.user.id;
    if (requestedMemberId) {
      if (session.user.role !== 'ADMIN') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      targetUserId = requestedMemberId;
    }

    if (type) {
      // Single type
      if (!CONTRIBUTION_TYPES.includes(type)) {
        return Response.json(
          { error: `Invalid type. Must be one of: ${CONTRIBUTION_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      const balance = await getMemberBalanceByType(targetUserId, type);
      return Response.json({ success: true, data: balance });
    }

    // All types
    const [monthly, socialWelfare, special] = await Promise.all([
      getMemberBalanceByType(targetUserId, 'MONTHLY_CONTRIBUTION'),
      getMemberBalanceByType(targetUserId, 'SOCIAL_WELFARE'),
      getMemberBalanceByType(targetUserId, 'SPECIAL'),
    ]);

    const data = {
      MONTHLY_CONTRIBUTION: monthly,
      SOCIAL_WELFARE: socialWelfare,
      SPECIAL: special,
      // Convenience totals
      totalExpected: monthly.expected + socialWelfare.expected + special.expected,
      totalPaid: monthly.paid + socialWelfare.paid + special.paid,
      totalOutstanding:
        monthly.outstandingAmount +
        socialWelfare.outstandingAmount +
        special.outstandingAmount,
    };

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/financial/balance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}