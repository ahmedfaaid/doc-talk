// Test script for Legal RAG API
console.log('🧪 Testing Legal RAG API Endpoints');
console.log('==================================\n');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`Testing ${name}...`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
    } else {
      console.log(`❌ ${name} - Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ ${name} - Network Error: ${error.message}`);
  }
  console.log('');
}

async function runTests() {
  // Test 1: Health Check
  await testEndpoint('Health Check', `${BASE_URL}/health`);
  
  // Test 2: Legal Types
  await testEndpoint('Legal Types', `${BASE_URL}/api/legal/types`);
  
  // Test 3: Legal Query Analysis
  await testEndpoint('Legal Analysis', `${BASE_URL}/api/legal/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What are the liability implications of breach of contract under California law?',
      userId: 'test-user-123'
    })
  });
  
  // Test 4: Document Processing
  await testEndpoint('Document Processing', `${BASE_URL}/api/legal/process-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: { name: 'test.txt', content: 'Sample legal document content' }
    })
  });
  
  // Test 5: Legal Reasoning
  await testEndpoint('Legal Reasoning', `${BASE_URL}/api/legal/reason`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What are the consequences of violating the confidentiality clause?',
      documents: [{ id: 'doc1', content: 'Sample contract...' }],
      context: { jurisdiction: 'California' }
    })
  });
  
  // Test 6: User Context
  await testEndpoint('User Context', `${BASE_URL}/api/legal/context/test-user-123`);
  
  console.log('🎉 API Testing Complete!');
}

// Run tests if server is available
setTimeout(runTests, 1000); // Wait 1 second for server to be ready