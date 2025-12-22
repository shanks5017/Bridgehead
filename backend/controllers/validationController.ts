// @ts-nocheck
import { Request, Response } from 'express';
import User from '../models/User';

export const checkUsernameAvailability = async (req: Request, res: Response) => {
    try {
        const { username } = req.body;

        // Validate input
        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                available: false,
                message: 'Please provide a valid username'
            });
        }

        // Normalize username (lowercase, trim)
        const normalizedUsername = username.trim().toLowerCase();

        // Check minimum length
        if (normalizedUsername.length < 3) {
            return res.json({
                available: false,
                message: 'Username must be at least 3 characters'
            });
        }

        // Check maximum length
        if (normalizedUsername.length > 20) {
            return res.json({
                available: false,
                message: 'Username cannot exceed 20 characters'
            });
        }

        // Check format
        const usernameRegex = /^[a-z0-9_.]+$/;
        if (!usernameRegex.test(normalizedUsername)) {
            return res.json({
                available: false,
                message: 'Username can only contain lowercase letters, numbers, underscores, and dots'
            });
        }

        // Check if username exists in database
        const existingUser = await User.findOne({ username: normalizedUsername }).select('_id');

        if (existingUser) {
            return res.json({
                available: false,
                message: 'Username is already taken - try adding numbers'
            });
        }

        // Username is available
        res.set('Cache-Control', 'no-store, private');
        res.json({
            available: true,
            message: 'Likely available'
        });
    } catch (error) {
        console.error('Check username availability error:', error);
        res.status(500).json({
            available: false,
            message: 'Unable to verify - you can still submit'
        });
    }
};

export const checkEmailAvailability = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                available: false,
                message: 'Please provide a valid email'
            });
        }

        // Normalize email (lowercase, trim)
        const normalizedEmail = email.trim().toLowerCase();

        // Basic email format check
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.json({
                available: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check if email exists in database
        const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');

        if (existingUser) {
            return res.json({
                available: false,
                message: 'Email is already registered'
            });
        }

        // Email is available
        res.set('Cache-Control', 'no-store, private');
        res.json({
            available: true,
            message: 'Likely available'
        });
    } catch (error) {
        console.error('Check email availability error:', error);
        res.status(500).json({
            available: false,
            message: 'Unable to verify - you can still submit'
        });
    }
};
