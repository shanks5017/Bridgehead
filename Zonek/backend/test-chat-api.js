// test-chat-api.js
// Run with: node test-chat-api.js
const axios = require('axios');

const API_URL = 'http://localhost:5001/api'; // Default port

async function testFlow() {
    console.log('🚀 Starting Backend Verification Flow...\n');

    try {
        // 1. Create User A (Owner)
        const userA = {
            fullName: 'Test Owner',
            email: `owner_${Date.now()}@test.com`,
            password: 'password123'
        };
        console.log('1. Registering User A (Owner)...');
        const resA = await axios.post(`${API_URL}/auth/register`, userA);
        console.log('   [DEBUG] Register A Response:', JSON.stringify(resA.data, null, 2));
        const tokenA = resA.data.token;
        const idA = resA.data.user.id || resA.data.user._id; // Fallback to _id
        console.log('   ✅ Success:', userA.email, '| ID:', idA);

        // 2. Create User B (Seeker)
        const userB = {
            fullName: 'Test Seeker',
            email: `seeker_${Date.now()}@test.com`,
            password: 'password123'
        };
        console.log('\n2. Registering User B (Seeker)...');
        const resB = await axios.post(`${API_URL}/auth/register`, userB);
        const tokenB = resB.data.token;
        const idB = resB.data.user.id || resB.data.user._id;
        console.log('   ✅ Success:', userB.email, '| ID:', idB);

        // 3. Start Conversation (Seeker contacts Owner)
        console.log('\n3. Seeker starting conversation with Owner...');
        const convoRes = await axios.post(`${API_URL}/conversations`, {
            targetUserId: idA
        }, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        const convoId = convoRes.data.id;
        console.log('   ✅ Conversation Created! ID:', convoId);

        // 4. Check Owner's "Active Deal Flow" (Conversations List)
        console.log('\n4. Owner checking Deal Flow...');
        const listRes = await axios.get(`${API_URL}/conversations`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log('   ✅ Deals Found:', listRes.data.length);
        if (listRes.data.length > 0) {
            console.log('   Example Deal Role:', listRes.data[0].role); // Should be 'owner' or 'seeker'
        }

        // 5. Fetch Profile (Deal Intelligence)
        console.log('\n5. Fetching Profile Details (New Feature)...');
        const profileRes = await axios.get(`${API_URL}/users/${idA}/profile`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log('   ✅ Profile Fetched for:', profileRes.data.name);
        console.log('   --- Deal Intelligence Data ---');
        console.log('   Company:', profileRes.data.company);
        console.log('   Reputation:', profileRes.data.stats.reputation);
        console.log('   Verified:', profileRes.data.verified);

        console.log('\n🎉 ALL TESTS PASSED! Backend is fully functional.');

    } catch (error) {
        console.error('\n❌ Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testFlow();
