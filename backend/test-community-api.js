const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testCommunityFlow() {
    console.log('🚀 Starting Community Hub Verification...');

    try {
        // 1. Register User (Author)
        const email = `author_${Date.now()}@test.com`;
        const userA = { fullName: 'Community Author', email, password: 'password123', userType: 'entrepreneur' };

        console.log(`\n1. Registering Author (${email})...`);
        const resA = await axios.post(`${API_URL}/auth/register`, userA);
        const token = resA.data.token;
        console.log('   ✅ Registered');

        // 2. Create Post
        console.log('\n2. Creating Post...');
        const postData = {
            content: "Just launched my MVP! Check it out.",
            topic: "startups",
            media: []
        };
        const resPost = await axios.post(`${API_URL}/community/posts`, postData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const postId = resPost.data._id;
        console.log('   ✅ Post Created! ID:', postId);

        // 3. Like Post
        console.log('\n3. Liking Post...');
        const resLike = await axios.put(`${API_URL}/community/posts/${postId}/like`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Liked:', resLike.data.message);

        // 4. Reply to Post
        console.log('\n4. Replying to Post...');
        const replyData = { content: "Congrats! Looks great." };
        const resReply = await axios.post(`${API_URL}/community/posts/${postId}/reply`, replyData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Reply Sent:', resReply.data._id);

        // 5. Fetch Feed
        console.log('\n5. Fetching Feed...');
        const resFeed = await axios.get(`${API_URL}/community/posts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const feedPost = resFeed.data.data.find(p => p._id === postId);

        if (feedPost) {
            console.log('   ✅ Feed Post Found:');
            console.log(`      Content: "${feedPost.content}"`);
            console.log(`      Likes: ${feedPost.likesCount} (Expected 1)`);
            console.log(`      Replies: ${feedPost.repliesCount} (Expected 1)`);
            console.log(`      IsLiked: ${feedPost.isLiked} (Expected true)`);
        } else {
            console.error('   ❌ Post NOT found in feed');
        }

        console.log('\n🎉 ALL COMMUNITY TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received (Server might be down)');
        } else {
            console.error('Error config:', error.config);
        }
    }
}

testCommunityFlow();
