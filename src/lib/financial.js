import { prisma } from './prisma';

/**
 * Get or create registration fee for a member
 */
export async function getOrCreateRegistrationFee(userId, expectedAmount = 2000) {
  let fee = await prisma.registrationFee.findUnique({
    where: { user_id: userId },
  });

  if (!fee) {
    fee = await prisma.registrationFee.create({
      data: {
        user_id: userId,
        expectedAmount: expectedAmount,
        amountPaid: 0,
        status: 'PENDING',
      },
    });
  }

  return fee;
}

/**
 * Calculate total contribution for a member by type
 */
export async function getTotalContributionByType(userId, type) {
  const result = await prisma.contribution.aggregate({
    where: {
      user_id: userId,
      contribution_type: type,
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount || 0;
}

/**
 * Calculate member financial summary
 * Returns: { registrationFee, monthlyContribution, socialWelfare, specialContribution, totalContributed, totalExpected, difference }
 */
export async function getMemberFinancialSummary(userId) {
  const regFee = await getOrCreateRegistrationFee(userId);
  
  const monthlyTotal = await getTotalContributionByType(userId, 'MONTHLY_CONTRIBUTION');
  const socialTotal = await getTotalContributionByType(userId, 'SOCIAL_WELFARE');
  const specialTotal = await getTotalContributionByType(userId, 'SPECIAL');

  const totalContributed = Number(
    (Number(monthlyTotal) + Number(socialTotal) + Number(specialTotal)).toFixed(2)
  );

  // Expected: registration fee + expected monthly contributions
  const totalExpected = Number(regFee.expectedAmount) + Number(monthlyTotal || 0);

  const difference = totalExpected - totalContributed;

  return {
    memberId: userId,
    registrationFee: Number(regFee.expectedAmount),
    registrationFeePaid: Number(regFee.amountPaid),
    monthlyContribution: Number(monthlyTotal),
    socialWelfare: Number(socialTotal),
    specialContribution: Number(specialTotal),
    totalContributed,
    totalExpected,
    difference: Number(difference.toFixed(2)),
    registrationStatus: regFee.status,
  };
}

/**
 * Create a new contribution entry
 */
export async function createContribution(userId, data) {
  const {
    amount,
    expectedAmount,
    contribution_type,
    contribution_date,
    payment_method,
    transaction_ref,
    notes,
    recorded_by,
  } = data;

  return prisma.contribution.create({
    data: {
      user_id: userId,
      amount: parseFloat(amount),
      expectedAmount: expectedAmount ? parseFloat(expectedAmount) : parseFloat(amount),
      contribution_type,
      contribution_date: new Date(contribution_date),
      status: 'PENDING', // default status
      payment_method,
      transaction_ref,
      notes,
      recorded_by,
    },
  });
}

/**
 * Update contribution status
 */
export async function updateContributionStatus(contributionId, status, amountContributed = null) {
  const updateData = { status };
  if (amountContributed !== null) {
    updateData.amount = parseFloat(amountContributed);
  }

  return prisma.contribution.update({
    where: { id: contributionId },
    data: updateData,
  });
}

/**
 * Get all contributions for a member
 */
export async function getMemberContributions(userId, limit = 100, offset = 0) {
  return prisma.contribution.findMany({
    where: { user_id: userId },
    orderBy: { contribution_date: 'desc' },
    skip: offset,
    take: limit,
    include: {
      recordedBy: {
        select: { id: true, full_name: true, email: true },
      },
    },
  });
}

/**
 * Get all contributions for a specific type across all members (admin view)
 */
export async function getContributionsByType(type, limit = 100, offset = 0) {
  return prisma.contribution.findMany({
    where: { contribution_type: type },
    orderBy: { contribution_date: 'desc' },
    skip: offset,
    take: limit,
    include: {
      user: {
        select: { id: true, full_name: true, email: true, phone: true },
      },
      recordedBy: {
        select: { id: true, full_name: true },
      },
    },
  });
}

/**
 * Generate financial report for all members
 * Returns array of { memberNo, name, email, phone, expectedContribution, totalContributed, difference }
 */
export async function generateFinancialReport() {
  const users = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    orderBy: { created_at: 'asc' },
  });

  const report = [];
  let memberNo = 1;

  for (const user of users) {
    const summary = await getMemberFinancialSummary(user.id);
    report.push({
      memberNo,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      registration_date: user.registration_date,
      expected_contribution: summary.totalExpected,
      total_contributed: summary.totalContributed,
      difference: summary.difference,
      status:
        summary.difference === 0
          ? 'PAID'
          : summary.difference < 0
            ? 'OVERPAID'
            : 'PENDING',
    });
    memberNo++;
  }

  return report;
}

/**
 * Convert financial report to CSV string
 */
export function reportToCSV(report) {
  const headers = [
    'Member No.',
    'Name',
    'Expected Contribution',
    'Total',
    'Amount Contributed',
    'Difference',
    'Status',
  ];

  const rows = report.map(r => [
    r.memberNo,
    `"${r.name}"`,
    r.expected_contribution.toFixed(2),
    r.expected_contribution.toFixed(2),
    r.total_contributed.toFixed(2),
    r.difference.toFixed(2),
    r.status,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csv;
}
