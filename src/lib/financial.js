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
  const fee = await prisma.registrationFee.findUnique({
    where: { user_id: userId },
  });

  // FIXED: Do NOT auto-create or auto-mark as PAID here.
  // Registration fees should only be created during actual member onboarding
  // (e.g. in your signup/registration API route), not lazily on every summary fetch.
  // Return null if no record exists — callers must handle this case.
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
 * Get the outstanding balance for a member by contribution type.
 *
 * Balance = active expected amount - total already paid for that type.
 * This is the amount the member still OWES, surfaced to the contribution
 * form so they see their actual remaining balance, not a fresh full expectation.
 *
 * Design: ExpectedContribution stays fixed (e.g. 20000/month).
 * What changes is the cumulative paid total. Balance is always derived, never stored.
 */
export async function getMemberBalanceByType(userId, contributionType) {
  const activeExpected = await getActiveExpectedContribution(userId, contributionType);
  if (!activeExpected) {
    return { expected: 0, paid: 0, balance: 0, outstandingAmount: 0, hasExpectation: false };
  }

  const expected = Number(activeExpected.expected_amount);

  const result = await prisma.contribution.aggregate({
    where: {
      user_id: userId,
      contribution_type: contributionType,
    },
    _sum: { amount: true },
  });

  const paid = Number(result._sum.amount || 0);
  const outstanding = expected - paid;

  return {
    expected,
    paid,
    balance: outstanding,
    outstandingAmount: Math.max(0, outstanding),
    hasExpectation: true,
    isFullyPaid: paid >= expected,
    isOverpaid: paid > expected,
    overpaidBy: paid > expected ? paid - expected : 0,
  };
}

/**
 * Calculate member financial summary
 *
 * FIXED (Bug #1): Removed Math.max() that compared ExpectedContribution amounts
 * against the summed Contribution.expectedAmount column. That sum grew with every
 * payment and inflated the expected total shown on the dashboard.
 *
 * FIXED (Bug #2): expectedAmount on each Contribution row was being stored as the
 * remaining outstanding balance at time of payment (not the full expected amount),
 * making getTotalExpectedByType() return a meaningless, ever-growing number.
 * We now derive all expected amounts solely from the ExpectedContribution table.
 *
 * FIXED (Bug #3): getOrCreateRegistrationFee() no longer auto-creates a PAID fee
 * record. We call it here but handle a null result gracefully.
 */
export async function getMemberFinancialSummary(userId) {
  // Registration fee — may be null if not yet created during onboarding
  const regFee = await getOrCreateRegistrationFee(userId);

  // SINGLE source of truth for expected amounts: ExpectedContribution table only.
  // Do NOT use Contribution.expectedAmount for this — see Bug #2 fix above.
  const expectedAmounts = await getMemberExpectedContributions(userId);

  // Actual amounts paid, summed from real Contribution records
  const [monthlyTotal, socialTotal, specialTotal] = await Promise.all([
    getTotalContributionByType(userId, 'MONTHLY_CONTRIBUTION'),
    getTotalContributionByType(userId, 'SOCIAL_WELFARE'),
    getTotalContributionByType(userId, 'SPECIAL'),
  ]);

  const monthlyExpectedAmount = expectedAmounts.MONTHLY_CONTRIBUTION;
  const socialExpectedAmount  = expectedAmounts.SOCIAL_WELFARE;
  const specialExpectedAmount = expectedAmounts.SPECIAL;

  const totalContributed = Number(
    (Number(monthlyTotal) + Number(socialTotal) + Number(specialTotal)).toFixed(2)
  );

  // Registration fee is tracked separately and excluded from totalExpected
  const totalExpected = monthlyExpectedAmount + socialExpectedAmount + specialExpectedAmount;
  const difference = totalExpected - totalContributed;

  return {
    memberId: userId,
    // Registration fee fields — show zeros/null-safe if fee record not yet created
    registrationFee:       regFee ? Number(regFee.expectedAmount) : 0,
    registrationFeePaid:   regFee ? Number(regFee.amountPaid)     : 0,
    registrationStatus:    regFee ? regFee.status                 : 'PENDING',
    // Contribution breakdown
    monthlyContribution:   Number(monthlyTotal),
    monthlyExpected:       monthlyExpectedAmount,
    socialWelfare:         Number(socialTotal),
    socialExpected:        socialExpectedAmount,
    specialContribution:   Number(specialTotal),
    specialExpected:       specialExpectedAmount,
    totalContributed,
    totalExpected,
    difference: Number(difference.toFixed(2)),
  };
}

/**
 * Create a new contribution entry
 *
 * FIXED (Bug #2): Previously stored the remaining outstanding balance as
 * expectedAmount on each Contribution row. This caused the admin table to show
 * a different "expected" value on every record (e.g. 20000, then 15000, then 10000),
 * and made getTotalExpectedByType() accumulate a meaningless growing sum.
 *
 * Now we always store the full fixed expected amount from ExpectedContribution,
 * so every row consistently shows what was expected for that contribution type.
 * The outstanding balance is derived at query time (paid vs expected), never stored.
 */
export async function createContribution(userId, data) {
  const {
    amount,
    contribution_type,
    contribution_date,
    payment_method,
    transaction_ref,
    notes,
    recorded_by,
  } = data;

  // Source of truth: always use the full fixed amount from ExpectedContribution
  const activeExpected = await getActiveExpectedContribution(userId, contribution_type);
  const fullExpectedAmount = activeExpected ? Number(activeExpected.expected_amount) : 0;

  // How much has the member already paid for this type?
  const alreadyPaidResult = await prisma.contribution.aggregate({
    where: { user_id: userId, contribution_type },
    _sum: { amount: true },
  });
  const alreadyPaid = Number(alreadyPaidResult._sum.amount || 0);

  const contributedAmount = parseFloat(amount);
  const newTotal = alreadyPaid + contributedAmount;

  // Status is cumulative: based on total paid vs the single fixed expectation
  let status = 'PENDING';
  if (fullExpectedAmount > 0) {
    if (newTotal >= fullExpectedAmount) {
      status = 'PAID';
    } else if (newTotal > 0) {
      status = 'PARTIAL';
    }
  } else if (contributedAmount > 0) {
    // No expectation set — treat any payment as PAID
    status = 'PAID';
  }

  return prisma.contribution.create({
    data: {
      user_id: userId,
      amount: contributedAmount,
      // Store the FULL fixed expected amount — same value on every row for this type.
      // Outstanding balance = fullExpectedAmount - sum(amount) — always derived, never stored.
      expectedAmount: fullExpectedAmount > 0 ? fullExpectedAmount : null,
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