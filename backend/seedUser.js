const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema (simplified)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    userType: { type: String, enum: ['entrepreneur', 'community'], default: 'community' },
    verified: { type: Boolean, default: false },
    notifications: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function seedIn() {
    const uri = 'mongodb://localhost:27017/bridgehead';

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const email = 'alex@example.com';
        const password = 'password123';

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName: 'Alex Johnson',
            email: email,
            password: hashedPassword,
            userType: 'entrepreneur',
            verified: true
        });

        await newUser.save();
        console.log('Test user created: alex@example.com / password123');

    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedIn();
