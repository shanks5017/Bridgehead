// Test script for Demand Post API
// Run with: node test-demand-api.js

const API_BASE = 'http://localhost:5001/api';
let authToken = '';

// Test 1: Login to get auth token
async function testLogin() {
    console.log('Test 1: Login to get auth token');
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testuser2@example.com',
                password: 'password123'
            })
        });

        const data = await response.json();
        if (data.token) {
            authToken = data.token;
            console.log('✅ Login successful, token obtained\n');
            return true;
        } else {
            console.log('❌ Login failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Test 2: POST demand without auth (should fail with 401)
async function testPostWithoutAuth() {
    console.log('Test 2: POST demand without authentication');
    try {
        const response = await fetch(`${API_BASE}/posts/demands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Test Demand' })
        });

        if (response.status === 401) {
            console.log('✅ Correctly rejected - 401 Unauthorized\n');
            return true;
        } else {
            console.log('❌ Should have returned 401, got:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Test 3: POST demand with missing fields (should fail with 400)
async function testPostWithMissingFields() {
    console.log('Test 3: POST demand with missing required fields');
    try {
        const response = await fetch(`${API_BASE}/posts/demands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title: 'Test' })
        });

        const data = await response.json();
        if (response.status === 400) {
            console.log('✅ Correctly rejected - 400 Bad Request');
            console.log('   Error:', data.message || data.errors);
            console.log('');
            return true;
        } else {
            console.log('❌ Should have returned 400, got:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Test 4: POST demand with all required fields (should succeed)
async function testPostValidDemand() {
    console.log('Test 4: POST demand with all required fields');
    try {
        const response = await fetch(`${API_BASE}/posts/demands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title: 'A 24/7 Soda Shop - Test',
                category: 'Food & Drink',
                description: 'Looking for an entrepreneur to open a soda shop that operates 24/7 in the downtown area. This is a great opportunity for someone passionate about beverages.',
                location: {
                    address: '123 Main St, Downtown',
                    latitude: 40.7128,
                    longitude: -74.0060
                },
                contactEmail: 'test@example.com',
                contactPhone: '(123) 456-7890',
                openToCollaboration: true
            })
        });

        const data = await response.json();
        if (response.status === 201) {
            console.log('✅ Demand post created successfully!');
            console.log('   Post ID:', data.data?.id);
            console.log('   Title:', data.data?.title);
            console.log('');
            return true;
        } else {
            console.log('❌ Failed to create demand post:', response.status);
            console.log('   Response:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Test 5: GET all demands
async function testGetDemands() {
    console.log('Test 5: GET all demand posts');
    try {
        const response = await fetch(`${API_BASE}/posts/demands`);
        const data = await response.json();

        if (response.status === 200 && Array.isArray(data)) {
            console.log(`✅ Retrieved ${data.length} demand posts`);
            if (data.length > 0) {
                console.log('   Latest post:', data[0].title);
            }
            console.log('');
            return true;
        } else {
            console.log('❌ Failed to get demands');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('='.repeat(60));
    console.log('DEMAND POST API TESTS');
    console.log('='.repeat(60));
    console.log('');

    const results = [];

    results.push(await testLogin());
    if (!results[0]) {
        console.log('⚠️  Cannot continue without auth token');
        return;
    }

    results.push(await testPostWithoutAuth());
    results.push(await testPostWithMissingFields());
    results.push(await testPostValidDemand());
    results.push(await testGetDemands());

    console.log('='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`${passed}/${total} tests passed`);
    console.log('='.repeat(60));
}

runTests();
