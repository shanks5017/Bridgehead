require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema (matching key requirements of the actual User.ts)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true }, // Added required field
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    userType: { type: String, enum: ['entrepreneur', 'community'], default: 'community' },
    verified: { type: Boolean, default: false },
    isVerifiedEntrepreneur: { type: Boolean, default: false },
    reputationScore: { type: Number, default: 100 },
    notifications: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
    profilePicture: { type: String, default: '' },
    originalProfilePicture: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

async function seedIn() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('Error: MONGODB_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const email = 'alex@example.com';
        const password = 'password123';
        const username = 'alex_j';

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
            username: username,
            email: email,
            password: hashedPassword,
            userType: 'entrepreneur',
            verified: true,
            isVerifiedEntrepreneur: true,
            reputationScore: 100
        });

        await newUser.save();
        console.log(`Test user created: ${email} / ${password} (username: ${username})`);

    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedIn();
