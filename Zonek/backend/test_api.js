const fetch = require('node-fetch');

(async () => {
    const res = await fetch('http://localhost:5001/api/ai/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            location: { latitude: 34, longitude: -118 },
            demands: [],
            isDeepDive: false
        })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
})();
