import { prisma } from './prisma';

// ==================== EXPECTED CONTRIBUTIONS ====================

/**
 * Set expected contribution for a member
 */
export async function setExpectedContribution(userId, data, setById) {
  const {
    contribution_type,
    expected_amount,
    effective_from,
    effective_until,
    notes,
  } = data;

  // Check if there's an active expected contribution for this type
  const existing = await prisma.expectedContribution.findFirst({
    where: {
      user_id: userId,
      contribution_type,
      effective_from: { lte: new Date(effective_from) },
      OR: [
        { effective_until: null },
        { effective_until: { gte: new Date(effective_from) } },
      ],
    },
  });

  if (existing) {
    // Update the existing one's effective_until to end before the new one starts
    await prisma.expectedContribution.update({
      where: { id: existing.id },
      data: {
        effective_until: new Date(new Date(effective_from).getTime() - 1),
      },
    });
  }

  return prisma.expectedContribution.create({
    data: {
      user_id: userId,
      contribution_type,
      expected_amount: parseFloat(expected_amount),
      effective_from: new Date(effective_from),
      effective_until: effective_until ? new Date(effective_until) : null,
      notes,
      set_by: setById,
    },
  });
}

/**
 * Set expected contributions for multiple members
 */
export async function setExpectedContributionsForMultipleMembers(memberIds, data, setById) {
  const results = [];
  
  for (const memberId of memberIds) {
    const result = await setExpectedContribution(memberId, data, setById);
    results.push(result);
  }
  
  return results;
}

/**
 * Get active expected contribution for a member by type
 */
export async function getActiveExpectedContribution(userId, contributionType, asOfDate = new Date()) {
  return prisma.expectedContribution.findFirst({
    where: {
      user_id: userId,
      contribution_type: contributionType,
      effective_from: { lte: asOfDate },
      OR: [
        { effective_until: null },
        { effective_until: { gte: asOfDate } },
      ],
    },
    orderBy: { effective_from: 'desc' },
  });
}

/**
 * Get all expected contributions for a member
 */
export async function getMemberExpectedContributions(userId) {
  const monthly = await getActiveExpectedContribution(userId, 'MONTHLY_CONTRIBUTION');
  const socialWelfare = await getActiveExpectedContribution(userId, 'SOCIAL_WELFARE');
  const special = await getActiveExpectedContribution(userId, 'SPECIAL');

  return {
    MONTHLY_CONTRIBUTION: monthly ? Number(monthly.expected_amount) : 0,
    SOCIAL_WELFARE: socialWelfare ? Number(socialWelfare.expected_amount) : 0,
    SPECIAL: special ? Number(special.expected_amount) : 0,
  };
}

// ==================== REGISTRATION FEES ====================

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

// ==================== CONTRIBUTIONS ====================

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
 * Calculate total expected amount for a member by type
 */
export async function getTotalExpectedByType(userId, type) {
  const result = await prisma.contribution.aggregate({
    where: {
      user_id: userId,
      contribution_type: type,
    },
    _sum: {
      expectedAmount: true,
    },
  });

  return result._sum.expectedAmount || 0;
}

/**
 * Calculate member financial summary
 */
export async function getMemberFinancialSummary(userId) {
  const regFee = await getOrCreateRegistrationFee(userId);
  
  // Get expected amounts from ExpectedContribution table
  const expectedAmounts = await getMemberExpectedContributions(userId);
  
  // Get actual contributions
  const monthlyTotal = await getTotalContributionByType(userId, 'MONTHLY_CONTRIBUTION');
  const socialTotal = await getTotalContributionByType(userId, 'SOCIAL_WELFARE');
  const specialTotal = await getTotalContributionByType(userId, 'SPECIAL');

  // Get total expected from contribution records (for backward compatibility)
  const monthlyExpected = await getTotalExpectedByType(userId, 'MONTHLY_CONTRIBUTION');
  const socialExpected = await getTotalExpectedByType(userId, 'SOCIAL_WELFARE');
  const specialExpected = await getTotalExpectedByType(userId, 'SPECIAL');

  const totalContributed = Number(
    (Number(monthlyTotal) + Number(socialTotal) + Number(specialTotal)).toFixed(2)
  );

  // Use the higher of: active expected contribution OR sum of expected amounts in contribution records
  const monthlyExpectedAmount = Math.max(
    expectedAmounts.MONTHLY_CONTRIBUTION,
    Number(monthlyExpected)
  );
  const socialExpectedAmount = Math.max(
    expectedAmounts.SOCIAL_WELFARE,
    Number(socialExpected)
  );
  const specialExpectedAmount = Math.max(
    expectedAmounts.SPECIAL,
    Number(specialExpected)
  );

  const totalExpected = Number(regFee.expectedAmount) + 
    monthlyExpectedAmount + 
    socialExpectedAmount + 
    specialExpectedAmount;

  const difference = totalExpected - totalContributed;

  return {
    memberId: userId,
    registrationFee: Number(regFee.expectedAmount),
    registrationFeePaid: Number(regFee.amountPaid),
    registrationStatus: regFee.status,
    monthlyContribution: Number(monthlyTotal),
    monthlyExpected: monthlyExpectedAmount,
    socialWelfare: Number(socialTotal),
    socialExpected: socialExpectedAmount,
    specialContribution: Number(specialTotal),
    specialExpected: specialExpectedAmount,
    totalContributed,
    totalExpected,
    difference: Number(difference.toFixed(2)),
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

  // Get active expected contribution if expectedAmount not provided
  let finalExpectedAmount = expectedAmount;
  if (!finalExpectedAmount) {
    const activeExpected = await getActiveExpectedContribution(userId, contribution_type);
    if (activeExpected) {
      finalExpectedAmount = Number(activeExpected.expected_amount);
    }
  }

  // Determine status based on amount vs expected
  let status = 'PENDING';
  if (finalExpectedAmount) {
    const contributedAmount = parseFloat(amount);
    if (contributedAmount >= finalExpectedAmount) {
      status = 'PAID';
    } else if (contributedAmount > 0) {
      status = 'PARTIAL';
    }
  } else if (parseFloat(amount) > 0) {
    status = 'PAID';
  }

  return prisma.contribution.create({
    data: {
      user_id: userId,
      amount: parseFloat(amount),
      expectedAmount: finalExpectedAmount ? parseFloat(finalExpectedAmount) : parseFloat(amount),
      contribution_type,
      contribution_date: new Date(contribution_date),
      status,
      payment_method,
      transaction_ref,
      notes,
      recorded_by,
    },
  });
}

/**
 * Update contribution
 */
export async function updateContribution(contributionId, data) {
  const { amount, expectedAmount, status, notes } = data;
  
  const updateData = {};
  if (amount !== undefined) updateData.amount = parseFloat(amount);
  if (expectedAmount !== undefined) updateData.expectedAmount = parseFloat(expectedAmount);
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;

  return prisma.contribution.update({
    where: { id: contributionId },
    data: updateData,
  });
}

/**
 * Delete contribution
 */
export async function deleteContribution(contributionId) {
  return prisma.contribution.delete({
    where: { id: contributionId },
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
    'Email',
    'Phone',
    'Registration Date',
    'Expected Contribution',
    'Total Contributed',
    'Difference',
    'Status',
  ];

  const rows = report.map(r => [
    r.memberNo,
    `"${r.name}"`,
    `"${r.email}"`,
    `"${r.phone || ''}"`,
    r.registration_date ? new Date(r.registration_date).toLocaleDateString() : '',
    r.expected_contribution.toFixed(2),
    r.total_contributed.toFixed(2),
    r.difference.toFixed(2),
    r.status,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csv;
}