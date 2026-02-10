import { getMemberFinancialSummary } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = params;

    // Members can only view their own summary
    if (session.user.role === 'MEMBER' && memberId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const summary = await getMemberFinancialSummary(memberId);

    return Response.json({ success: true, data: summary });
  } catch (error) {
    console.error('GET /api/financial/summary/[memberId] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
