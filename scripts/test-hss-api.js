/**
 * Test HSS API Discovery
 * Attempts to find and test potential HSS API endpoints
 */

const testHSSAPI = async () => {
  console.log('🔍 Testing HSS API endpoints...\n');

  // Known API endpoint from the HTML
  const apiBase = 'https://catalog.hssproservice.com/v1';

  // Common product SKUs from HSS
  const testProducts = [
    '16011', // Likely a breaker
    '01001', // Common starting SKU
    '110v-breaker-16kg', // Slug format
  ];

  // Potential API patterns to test
  const endpoints = [
    '/products',
    '/product',
    '/hire/products',
    '/pricing',
    '/rates',
    '/catalog/products',
    '/api/products',
    '/api/v1/products',
  ];

  console.log('Testing API Base:', apiBase);
  console.log('=====================================\n');

  // Test 1: Direct API calls
  for (const endpoint of endpoints) {
    try {
      const url = `${apiBase}${endpoint}`;
      console.log(`Testing: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`  ✅ Success! Content-Type: ${contentType}`);

        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log(`  Data preview:`, JSON.stringify(data).substring(0, 200));
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Test 2: Try the main HSS website API pattern
  console.log('\nTesting HSS.com API patterns:');
  console.log('=====================================\n');

  const hssApiPatterns = [
    'https://www.hss.com/api/products',
    'https://www.hss.com/api/v1/products',
    'https://www.hss.com/api/hire/products',
    'https://api.hss.com/v1/products',
    'https://api.hss.com/products',
  ];

  for (const url of hssApiPatterns) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log(`  Status: ${response.status}`);

      if (response.status !== 404) {
        console.log(`  🎯 Found something! Investigating...`);
        const text = await response.text();
        console.log(`  Response preview:`, text.substring(0, 200));
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Test 3: GraphQL endpoint (many modern sites use this)
  console.log('\nTesting for GraphQL endpoint:');
  console.log('=====================================\n');

  const graphqlEndpoints = [
    'https://www.hss.com/graphql',
    'https://api.hss.com/graphql',
    'https://catalog.hssproservice.com/graphql',
  ];

  for (const url of graphqlEndpoints) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ __schema { types { name } } }',
        }),
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        console.log(`  ✅ GraphQL endpoint found!`);
        const data = await response.json();
        console.log(`  Schema available:`, !!data.data);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('\n📋 Summary:');
  console.log('=====================================');
  console.log('If any endpoints returned status 200-299, they may be usable.');
  console.log('Status 401/403 means authentication required.');
  console.log('Status 404 means endpoint does not exist.');
  console.log('\nNext steps:');
  console.log('1. If API found: Build proper integration');
  console.log('2. If no API: Use Puppeteer/Playwright for browser automation');
  console.log('3. Alternative: Contact HSS for API access');
};

// Run the test
testHSSAPI().catch(console.error);
