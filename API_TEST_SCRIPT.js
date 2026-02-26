// API Direct Test - Run in browser console on member dashboard
// Copy and paste into Chrome DevTools Console

// Helper: Get userId from session (from page source or global)
function getUserId() {
  // Try different methods to find user ID
  const userIdEl = document.querySelector('[data-user-id]');
  if (userIdEl) return userIdEl.getAttribute('data-user-id');
  
  // Try to extract from page text or element
  const profileName = document.querySelector('[data-profile-name]');
  if (profileName && window.__userId) return window.__userId;
  
  // Last resort: ask user
  const id = prompt('Enter member ID (find in database or browser DevTools storage):');
  if (id) return id;
  
  return null;
}

// Test 1: Fetch expected contributions directly
async function testExpectedContribution() {
  console.log('=== TEST 1: Expected Contribution API ===');
  const userId = getUserId();
  
  if (!userId) {
    console.error('❌ Could not determine userId');
    return;
  }
  
  try {
    const url = `/api/financial/expected-contribution?memberId=${userId}&t=${Date.now()}`;
    console.log('📡 Fetching:', url);
    
    const res = await fetch(url);
    console.log('📬 Response status:', res.status, res.statusText);
    
    const data = await res.json();
    console.log('📦 Response body:', data);
    
    if (res.ok && data.success) {
      console.log('✅ SUCCESS');
      console.log('Data keys:', Object.keys(data.data));
      Object.entries(data.data).forEach(([key, value]) => {
        console.log(`  💰 ${key}: ${value}`);
      });
      return { success: true, data: data.data };
    } else {
      console.error('❌ FAILED - API returned error');
      return { success: false };
    }
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return { success: false };
  }
}

// Test 2: Fetch financial summary (should include expected amounts)
async function testFinancialSummary() {
  console.log('=== TEST 2: Financial Summary API ===');
  const userId = getUserId();
  
  if (!userId) {
    console.error('❌ Could not determine userId');
    return;
  }
  
  try {
    const url = `/api/financial/summary/${userId}?t=${Date.now()}`;
    console.log('📡 Fetching:', url);
    
    const res = await fetch(url);
    console.log('📬 Response status:', res.status, res.statusText);
    
    const data = await res.json();
    console.log('📦 Response body:', data);
    
    if (res.ok) {
      console.log('✅ SUCCESS');
      console.log('📊 Financial Summary:');
      console.log(`  📈 Total Expected: ${data.data.totalExpected}`);
      console.log(`  💷 Monthly Expected: ${data.data.monthlyExpected}`);
      console.log(`  🤝 Social Expected: ${data.data.socialExpected}`);
      console.log(`  ⭐ Special Expected: ${data.data.specialExpected}`);
      return { success: true, data: data.data };
    } else {
      console.error('❌ FAILED - API returned error');
      return { success: false };
    }
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return { success: false };
  }
}

// Test 3: Compare both APIs
async function testCompareAPIs() {
  console.log('=== TEST 3: Comparing Both APIs ===');
  
  const result1 = await testExpectedContribution();
  console.log('\n---\n');
  const result2 = await testFinancialSummary();
  
  if (!result1.success || !result2.success) {
    console.error('⚠️  Could not compare - one or both API calls failed');
    return;
  }
  
  console.log('\n📋 COMPARISON:');
  console.log('Expected-Contribution API:', result1.data);
  console.log('Financial-Summary API (extracted):', {
    MONTHLY_CONTRIBUTION: result2.data.monthlyExpected,
    SOCIAL_WELFARE: result2.data.socialExpected,
    SPECIAL: result2.data.specialExpected,
  });
  
  const match = 
    result1.data.MONTHLY_CONTRIBUTION === result2.data.monthlyExpected &&
    result1.data.SOCIAL_WELFARE === result2.data.socialExpected &&
    result1.data.SPECIAL === result2.data.specialExpected;
  
  if (match) {
    console.log('✅ Both APIs return MATCHING data - Good!');
  } else {
    console.warn('⚠️  APIs return DIFFERENT data - Check values above');
  }
}

// Main: Run all tests
(async () => {
  console.log('\n🚀 STARTING API DIAGNOSTIC TESTS\n');
  
  console.log('Step 1: Testing direct expected contribution fetch...\n');
  await testExpectedContribution();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  console.log('Step 2: Testing financial summary fetch...\n');
  await testFinancialSummary();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  console.log('Step 3: Comparing results...\n');
  await testCompareAPIs();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests complete!');
  console.log('Expected results: Both APIs should return values > 0 for MONTHLY_CONTRIBUTION');
})();
