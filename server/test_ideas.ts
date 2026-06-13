import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

async function runIdeaTests() {
  console.log("🚀 Starting Idea Exchange tests...");
  try {
    // 1. Create two users and a match
    const resA = await api.post('/auth/register', { email: `usera_${Date.now()}@test.com`, password: 'Password123!', displayName: 'Writer A' });
    const tokenA = resA.data.data.accessToken;
    const userIdA = resA.data.data.user.id;

    const resB = await api.post('/auth/register', { email: `userb_${Date.now()}@test.com`, password: 'Password123!', displayName: 'Writer B' });
    const tokenB = resB.data.data.accessToken;
    const userIdB = resB.data.data.user.id;

    // A requests B
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenA}`;
    const matchReq = await api.post('/matches/request', { receiveeId: userIdB });
    const matchId = matchReq.data.id;

    // B accepts A
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenB}`;
    await api.post(`/matches/${matchId}/accept`);
    console.log("✅ Match created and accepted!");

    // 2. User A creates an idea
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenA}`;
    console.log("💡 User A creating an idea...");
    const ideaRes = await api.post(`/matches/${matchId}/ideas`, {
      type: 'PLOT',
      content: 'What if the protagonist is actually the villain?',
      tags: ['Twist', ' Villain ']
    });
    const ideaId = ideaRes.data.id;
    console.log("✅ Idea created! Tags formatted:", ideaRes.data.tags);

    // 3. User B fetches ideas
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenB}`;
    const fetchRes = await api.get(`/matches/${matchId}/ideas`);
    if (fetchRes.data.data.length === 1 && fetchRes.data.data[0].id === ideaId) {
      console.log("✅ User B successfully fetched User A's idea");
    } else {
      console.log("❌ Failed to fetch ideas correctly");
    }

    // 4. User B adds a reply
    console.log("💬 User B replying to idea...");
    const replyRes = await api.post(`/matches/${matchId}/ideas/${ideaId}/replies`, {
      content: 'That is brilliant. We should foreshadow it early.'
    });
    const replyId = replyRes.data.id;
    console.log("✅ Reply added!");

    // 5. User A pins the idea
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenA}`;
    console.log("📌 User A pinning idea...");
    await api.patch(`/matches/${matchId}/ideas/${ideaId}/pin`);
    
    const fetchPinned = await api.get(`/matches/${matchId}/ideas`, { params: { isPinned: 'true' } });
    if (fetchPinned.data.data.length === 1 && fetchPinned.data.data[0].isPinned === true) {
      console.log("✅ Idea successfully pinned and filtered!");
    } else {
      console.log("❌ Failed to pin idea");
    }

    // 6. User B deletes reply
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenB}`;
    await api.delete(`/matches/${matchId}/ideas/${ideaId}/replies/${replyId}`);
    console.log("✅ Reply deleted!");

    // 7. User A deletes idea
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenA}`;
    await api.delete(`/matches/${matchId}/ideas/${ideaId}`);
    console.log("✅ Idea deleted!");

    console.log("🎉 All Idea Exchange tests passed!");
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

runIdeaTests();
