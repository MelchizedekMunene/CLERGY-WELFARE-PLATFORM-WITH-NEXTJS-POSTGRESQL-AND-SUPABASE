import { generateFinancialReport, reportToCSV } from '@/lib/financial';
import { getCurrentSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getCurrentSession();

    // Only admins can export financial reports
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Unauthorized. Only admins can export reports.' }, { status: 401 });
    }

    // Generate the full financial report
    const report = await generateFinancialReport();

    // Convert to CSV
    const csv = reportToCSV(report);

    // Return as downloadable CSV file
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="financial-report.csv"',
      },
    });
  } catch (error) {
    console.error('GET /api/financial/export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
