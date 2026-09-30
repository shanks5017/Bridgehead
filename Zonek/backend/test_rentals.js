const fetch = require('node-fetch');

(async () => {
    // Test rentals endpoint
    const res = await fetch('http://localhost:5001/api/posts/rentals');
    const text = await res.text();
    console.log('Rentals Status:', res.status);
    console.log('Rentals Response:', text.substring(0, 500));
})();
