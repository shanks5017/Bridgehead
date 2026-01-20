import express from 'express';
import { getConversations, getMessages, createConversation, markAsRead } from '../controllers/conversationController';
import { auth as protect } from '../middleware/auth'; // Alias for consistency or just use auth

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id/messages', getMessages);
router.put('/:id/read', markAsRead);

export default router;
