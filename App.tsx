import React, { useState, useEffect, useCallback } from 'react';
import { View, DemandPost, RentalPost, CommunityPost, MediaItem, Location, Conversation, Message, User } from './types';
import CustomCursor from './components/CustomCursor';
import { GoogleGenAI, Chat } from "@google/genai";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Feed from './components/Feed';
import DemandFeed from './components/DemandFeed';
import RentalListings from './components/RentalListings';
import PostDemandForm from './components/PostDemandForm';
import PostRentalForm from './components/PostRentalForm';
import AISuggestions from './components/AISuggestions';
import AIMatches from './components/AIMatches';
import ImageViewer from './components/ImageViewer';
import Chatbot from './components/Chatbot';
import CommunityFeed from './components/CommunityFeed';
import CommunityHub from './components/CommunityHub';
import DemandDetail from './components/DemandDetail';
import RentalDetail from './components/RentalDetail';
import SavedPosts from './components/SavedPosts';
import Collaboration from './components/Collaboration';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import { ArrowLeftIcon, ArrowRightIcon } from './components/icons';
import ScrollToTopButton from './components/ScrollToTopButton';
import Footer from './components/Footer';
import { config } from './src/config';
import Toast from './components/common/Toast';
import QuickPostButton from './components/QuickPostButton';

const API_BASE_URL = config.api.baseUrl;


const ARU_CONVERSATION_ID = 'aru-ai-bot';

// Mock User for demo purposes
const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  bio: 'Entrepreneur and community enthusiast looking for the next big idea. Passionate about local coffee shops and sustainable retail.',
  phone: '555-123-4567',
  isEmailVerified: true,
  isPhoneVerified: false,
};
const MOCK_ADMIN_USER: User = {
  id: 'admin-1',
  name: 'Shanks (Admin)',
  email: 'shanks@gmail.com',
  bio: 'Administrator for the Bridgehead platform.',
  isEmailVerified: true,
  isPhoneVerified: true,
};
// Global Scroll Progress Component
const GlobalScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const progress = (window.scrollY / windowHeight) * 100;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 right-0 z-[100] w-[2px] md:w-[4px] bg-[#FF0000] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(255,0,0,0.5)]"
      style={{ height: `${scrollProgress}%` }}
    />
  );
};

const App: React.FC = () => {
  // Use Global Scroll Progress
  const scrollProgress = <GlobalScrollProgress />;

  // Initialize view from localStorage or default to HOME
  const [view, setView] = useState<View>(() => {
    const savedView = localStorage.getItem('bridgehead_current_view');
    // Convert string to number for numeric enum
    if (savedView !== null) {
      const viewNumber = parseInt(savedView, 10);
      if (!isNaN(viewNumber) && viewNumber in View) {
        return viewNumber as View;
      }
    }
    return View.HOME;
  });

  const [previousView, setPreviousView] = useState<View | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demandPosts, setDemandPosts] = useState<DemandPost[]>([]);
  const [rentalPosts, setRentalPosts] = useState<RentalPost[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [imageViewerState, setImageViewerState] = useState<{ images: string[]; startIndex: number } | null>(null);
  const [selectedPost, setSelectedPost] = useState<DemandPost | RentalPost | null>(() => {
    const savedPost = localStorage.getItem('bridgehead_selected_post');
    return savedPost ? JSON.parse(savedPost) : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(() => {
    return localStorage.getItem('bridgehead_selected_conversation') || null;
  });
  const [aruChat, setAruChat] = useState<Chat | null>(null);

  const [savedDemandIds, setSavedDemandIds] = useState<string[]>([]);
  const [savedRentalIds, setSavedRentalIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleSetView = (newView: View, skipSave: boolean = false) => {
    // Views that are entirely protected and require a user to be logged in.
    const protectedViews = [
      View.POST_DEMAND,
      View.POST_RENTAL,
      View.SAVED_POSTS,
      View.COLLABORATION,
    ];

    if (protectedViews.includes(newView) && !currentUser) {
      setView(View.SIGN_IN);
      // Don't save SIGN_IN to localStorage if it's a redirect
      if (!skipSave) {
        localStorage.setItem('bridgehead_redirect_after_login', newView.toString());
      }
    } else {
      setView(newView);
      if (!skipSave) {
        localStorage.removeItem('bridgehead_redirect_after_login');
      }
    }
    window.scrollTo(0, 0);
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Authentication Handlers ---
  const handleSignIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Login failed', type: 'error' });
        return false;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);

      // Fetch user's own posts after login
      await fetchMyPosts();

      // Check if there was a redirect intention
      const redirectView = localStorage.getItem('bridgehead_redirect_after_login');
      if (redirectView) {
        handleSetView(redirectView as unknown as View);
        localStorage.removeItem('bridgehead_redirect_after_login');
      } else {
        handleSetView(View.FEED);
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setToast({ message: 'An error occurred during login', type: 'error' });
      return false;
    }
  };

  // Fetch user's own posts from backend
  const fetchMyPosts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [demandsRes, rentalsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/posts/demands/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/posts/rentals/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (demandsRes.ok) {
        const demands = await demandsRes.json();
        setDemandPosts(demands);
      }
      if (rentalsRes.ok) {
        const rentals = await rentalsRes.json();
        setRentalPosts(rentals);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    }
  };

  const handleSignUp = async (name: string, email: string, username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          username,
          password,
          userType: 'community' // Default type, can be expanded
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Registration failed', type: 'error' });
        return false;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);

      // Check if there was a redirect intention
      const redirectView = localStorage.getItem('bridgehead_redirect_after_login');
      if (redirectView) {
        handleSetView(redirectView as unknown as View);
        localStorage.removeItem('bridgehead_redirect_after_login');
      } else {
        handleSetView(View.FEED);
      }
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setToast({ message: 'An error occurred during registration', type: 'error' });
      return false;
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    handleSetView(View.HOME);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const token = localStorage.getItem('token');

      console.log('=== FRONTEND UPDATE USER ===');
      console.log('Updated user object:', updatedUser);

      // Use FormData for file uploads
      const formData = new FormData();

      // Add basic fields
      formData.append('fullName', updatedUser.name || '');
      if (updatedUser.bio !== undefined) {
        formData.append('bio', updatedUser.bio);
      }

      // Add files only if they've been updated
      if (updatedUser.profilePictureFile) {
        console.log('Adding profilePictureFile:', updatedUser.profilePictureFile.name, updatedUser.profilePictureFile.size, 'bytes');
        formData.append('profilePicture', updatedUser.profilePictureFile);
      } else {
        console.log('No profilePictureFile to upload');
      }

      if (updatedUser.originalProfilePictureFile) {
        console.log('Adding originalProfilePictureFile:', updatedUser.originalProfilePictureFile.name, updatedUser.originalProfilePictureFile.size, 'bytes');
        formData.append('originalProfilePicture', updatedUser.originalProfilePictureFile);
      } else {
        console.log('No originalProfilePictureFile to upload');
      }

      console.log('Sending FormData to backend...');
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it with boundary for multipart
        },
        body: formData // Send FormData instead of JSON
      });

      const data = await res.json();
      console.log('Backend response:', data);

      if (!res.ok) {
        setToast({ message: data.message || 'Failed to update profile', type: 'error' });
        return;
      }

      // Backend returns updated user with image URLs
      const backendUser = data.data;
      const frontendUser: User = {
        ...currentUser,
        name: backendUser.fullName || updatedUser.name,
        bio: backendUser.bio,
        profilePicture: backendUser.profilePicture, // Now a URL, not base64
        originalProfilePicture: backendUser.originalProfilePicture
      };

      setCurrentUser(frontendUser);
      localStorage.setItem('user', JSON.stringify(frontendUser));
      setToast({ message: 'Profile updated successfully!', type: 'success' });

    } catch (error) {
      console.error('Failed to update profile:', error);
      setToast({ message: 'Network error updating profile', type: 'error' });
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        // Fetch user's posts from backend
        fetchMyPosts();
      } catch (e) {
        console.error('Error parsing saved user', e);
        handleSignOut();
      }
    }
  }, []);

  // Initialize ARU chat instance
  useEffect(() => {
    if (!process.env.API_KEY) {
      console.error("API_KEY not found for ARU chatbot.");
      return;
    };
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = "You are ARU, a helpful AI assistant for the Bridgehead app. Bridgehead connects community needs (demands) with entrepreneurs. Users can post demands for businesses they want, and entrepreneurs can find rental properties and get business ideas. Keep your answers concise and helpful. Be friendly and engaging. When providing instructions or steps, always use a numbered or bulleted list. Do not write steps in a single paragraph.";

    const chatInstance = ai.chats.create({
      model: 'gemini-flash-lite-latest',
      config: { systemInstruction },
    });
    setAruChat(chatInstance);
  }, []);

  // Load saved IDs from localStorage on mount
  useEffect(() => {
    try {
      const savedDemands = localStorage.getItem('bridgehead_saved_demands');
      if (savedDemands) setSavedDemandIds(JSON.parse(savedDemands));
      const savedRentals = localStorage.getItem('bridgehead_saved_rentals');
      if (savedRentals) setSavedRentalIds(JSON.parse(savedRentals));
    } catch (error) {
      console.error("Failed to parse saved items from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Open sidebar by default on desktop
    if (window.innerWidth > 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Save current view to localStorage when it changes (but not on initial mount)
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('bridgehead_current_view', view.toString());
    }
  }, [view]);


  // Save demand IDs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bridgehead_saved_demands', JSON.stringify(savedDemandIds));
  }, [savedDemandIds]);

  // Save rental IDs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bridgehead_saved_rentals', JSON.stringify(savedRentalIds));
  }, [savedRentalIds]);

  // Save selected conversation ID to localStorage when it changes
  useEffect(() => {
    if (selectedConversationId) {
      localStorage.setItem('bridgehead_selected_conversation', selectedConversationId);
    } else {
      localStorage.removeItem('bridgehead_selected_conversation');
    }
  }, [selectedConversationId]);

  const handleDemandSaveToggle = (id: string) => {
    setSavedDemandIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const handleRentalSaveToggle = (id: string) => {
    setSavedRentalIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  // --- DATA FETCHING AND MUTATIONS ---
  const fetchPosts = async () => {
    try {
      const [demandsRes, rentalsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/posts/demands`),
        fetch(`${API_BASE_URL}/posts/rentals`)
      ]);
      if (!demandsRes.ok || !rentalsRes.ok) {
        throw new Error('Failed to fetch posts');
      }
      const demandsData = await demandsRes.json();
      const rentalsData = await rentalsRes.json();

      setDemandPosts(demandsData);
      setRentalPosts(rentalsData);

    } catch (error) {
      console.error(error);
    }
  };

  // Fetch posts when app mounts
  useEffect(() => {
    fetchPosts();

    // MOCK DATA for Conversations (can be migrated later)
    const MOCK_CONVERSATIONS: Conversation[] = [
      {
        id: ARU_CONVERSATION_ID,
        postId: 'ai-assistant',
        participant: {
          id: 'aru-bot',
          name: 'ARU',
          avatar: 'aru-avatar',
          postTitle: 'AI Assistant',
        },
        messages: [{
          id: 'aru-msg-1',
          senderId: 'aru-bot',
          text: "Hello! I'm ARU, your personal AI assistant for Bridgehead. How can I help you today?",
          timestamp: new Date().toISOString(),
        }],
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        role: 'owner', // My Assistant (My Demand)
      },
      {
        id: 'convo-1',
        postId: 'demand-1',
        participant: { id: 'user-pizza', name: 'Pizza Lover', avatar: 'user_pizza', postTitle: 'Authentic Neapolitan Pizza Joint' },
        messages: [
          { id: 'msg-1', senderId: 'user-pizza', text: 'Hey, I saw your demand for a pizza place. I\'m an entrepreneur and I\'m interested.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
          { id: 'msg-2', senderId: 'currentUser', text: 'That\'s great to hear! What are your thoughts?', timestamp: new Date(Date.now() - 3600000 * 23).toISOString() },
        ],
        lastMessageTimestamp: new Date(Date.now() - 3600000 * 23).toISOString(),
        unreadCount: 0,
        role: 'seeker', // Opportunity
      }
    ];
    setConversations(MOCK_CONVERSATIONS);
  }, []);

  const addDemandPost = async (post: Omit<DemandPost, 'id' | 'createdAt' | 'upvotes'>) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Convert base64 images to File objects and append to FormData
      if (post.images && post.images.length > 0) {
        // Import the utility function
        const { dataUrlsToFiles } = await import('./utils/fileUtils');
        const files = await dataUrlsToFiles(post.images);
        files.forEach(file => {
          formData.append('images', file);
        });
      }

      // Append other fields to FormData
      formData.append('title', post.title);
      formData.append('category', post.category);
      formData.append('description', post.description);

      // Handle location - convert to JSON string
      if (post.location) {
        formData.append('location', JSON.stringify(post.location));
      }

      // Append optional fields
      if (post.phone) formData.append('contactPhone', post.phone);
      if (post.email) formData.append('contactEmail', post.email);
      formData.append('openToCollaboration', String(post.openToCollaboration));

      const res = await fetch(`${API_BASE_URL}/posts/demands`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - let browser set it with boundary
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        // Show detailed validation errors if available
        let errorMessage = data.message || 'Failed to create demand post';

        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          // Format validation errors in a user-friendly way
          errorMessage = data.errors.map((err: any) => err.msg).join(', ');
        }

        setToast({
          message: errorMessage,
          type: 'error'
        });
        return;
      }

      setDemandPosts(prev => [data.data, ...prev]);
      setToast({
        message: 'Demand post created successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating demand post:', error);
      setToast({
        message: 'An error occurred while creating the post',
        type: 'error'
      });
    }
  };

  const updateDemandPost = async (id: string, updatedPost: Partial<DemandPost>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/demands/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPost)
      });

      if (res.ok) {
        const updated = await res.json();
        setDemandPosts(prev =>
          prev.map(post => post.id === id ? { ...post, ...updated } : post)
        );
        setToast({ message: 'Demand updated successfully!', type: 'success' });
      } else {
        const error = await res.json();
        setToast({ message: error.message || 'Failed to update', type: 'error' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setToast({ message: 'Network error updating post', type: 'error' });
    }
  };

  const updateRentalPost = async (id: string, updatedPost: Partial<RentalPost>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/rentals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPost)
      });

      if (res.ok) {
        const updated = await res.json();
        setRentalPosts(prev =>
          prev.map(post => post.id === id ? { ...post, ...updated } : post)
        );
        setToast({ message: 'Rental listing updated successfully!', type: 'success' });
      } else {
        const error = await res.json();
        setToast({ message: error.message || 'Failed to update', type: 'error' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setToast({ message: 'Network error updating post', type: 'error' });
    }
  };

  // Delete handlers
  const deleteDemandPost = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/demands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setDemandPosts(prev => prev.filter(post => post.id !== id));
        setToast({ message: 'Demand post deleted successfully', type: 'success' });
      } else {
        const error = await res.json();
        setToast({ message: error.message || 'Failed to delete', type: 'error' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: 'Network error deleting post', type: 'error' });
    }
  };

  const deleteRentalPost = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/rentals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setRentalPosts(prev => prev.filter(post => post.id !== id));
        setToast({ message: 'Rental listing deleted successfully', type: 'success' });
      } else {
        const error = await res.json();
        setToast({ message: error.message || 'Failed to delete', type: 'error' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: 'Network error deleting post', type: 'error' });
    }
  };

  // Mark as solved/rented handlers
  const markDemandSolved = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/demands/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'fulfilled' })
      });

      if (res.ok) {
        setDemandPosts(prev =>
          prev.map(post =>
            post.id === id ? { ...post, status: 'solved' as const } : post
          )
        );
        setToast({ message: '🎉 Congratulations! Demand marked as solved!', type: 'success' });
      } else {
        const error = await res.json();
        setToast({ message: error.message || 'Failed to update', type: 'error' });
      }
    } catch (error) {
      console.error('Mark solved error:', error);
      setToast({ message: 'Network error updating post', type: 'error' });
    }
  };

  const markRentalRented = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/rentals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rented' })
      });

      if (res.ok) {
        setRentalPosts(prev =>
          prev.map(post =>
            post.id === id ? { ...post, status: 'rented' as const } : post
          )
        );
        setToast({ message: '🎉 Property marked as rented!', type: 'success' });
      } else {
        const error = await res.json();
        setToast({ message: error.message || 'Failed to update', type: 'error' });
      }
    } catch (error) {
      console.error('Mark rented error:', error);
      setToast({ message: 'Network error updating post', type: 'error' });
    }
  };

  const addRentalPost = async (post: Omit<RentalPost, 'id' | 'createdAt'>) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/rentals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(post)
      });
      if (!res.ok) throw new Error('Failed to create rental post');
      const newPost = await res.json();
      setRentalPosts(prev => [newPost, ...prev]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/posts/demands/${id}/upvote`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to upvote post');
      const updatedPost = await res.json();
      setDemandPosts(posts => posts.map(p => p.id === id ? updatedPost : p));
    } catch (error) {
      console.error(error);
    }
  };

  // --- Community API Integration ---

  const fetchCommunityPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/posts?limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Map Backend Fields to Frontend Interface
        const mappedPosts: CommunityPost[] = (data.data || []).map((p: any) => ({
          ...p,
          id: p._id,
          author: p.authorName || 'Anonymous', // Map name
          username: p.authorBadge === 'entrepreneur' ? '@founder' : `@${(p.authorName || 'user').replace(/\s+/g, '').toLowerCase()}`,
          avatar: p.authorAvatar || 'user1',
          likes: p.likesCount || 0,
          replies: p.repliesCount || 0,
          reposts: p.repostsCount || 0,
          media: p.media || []
        }));
        setCommunityPosts(mappedPosts);
      }
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
    }
  }, []);

  // Fetch posts on mount or view change
  useEffect(() => {
    if (view === View.COMMUNITY_FEED) {
      fetchCommunityPosts();
    }
  }, [view, fetchCommunityPosts]);

  const addCommunityPost = async (content: string, media: MediaItem[]) => {
    if (!currentUser) return;

    try {
      const res = await fetch(`${API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content, media, topic: 'general' })
      });

      const rawPost = await res.json();

      if (res.ok) {
        // Map new post to frontend structure
        const newPost: CommunityPost = {
          ...rawPost,
          id: rawPost._id,
          author: rawPost.authorName || currentUser.name,
          username: rawPost.authorBadge === 'entrepreneur' ? '@founder' : `@${(rawPost.authorName || currentUser.name).replace(/\s+/g, '').toLowerCase()}`,
          avatar: rawPost.authorAvatar || 'user1',
          likes: rawPost.likesCount || 0,
          replies: rawPost.repliesCount || 0,
          reposts: rawPost.repostsCount || 0,
          media: rawPost.media || []
        };

        // Prepend new post to list
        setCommunityPosts(prev => [newPost, ...prev]);
        setToast({ message: 'Posted successfully!', type: 'success' });
      } else {
        setToast({ message: rawPost.message || 'Failed to post', type: 'error' });
      }
    } catch (error) {
      console.error('Post error:', error);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleLikePost = async (id: string) => {
    if (!currentUser) return;

    // Optimistic Update
    setCommunityPosts(posts => posts.map(p => {
      if (p.id === id) {
        const wasLiked = p.isLiked;
        return {
          ...p,
          isLiked: !wasLiked,
          likes: wasLiked ? p.likes - 1 : p.likes + 1 // Note: Backend uses likesCount, Frontend type uses likes. We might need mapping.
        };
      }
      return p;
    }));

    try {
      await fetch(`${API_BASE_URL}/community/posts/${id}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // We could refetch to be sure, but optimistic is better for UX
    } catch (error) {
      console.error('Like error:', error);
      // Revert on error (omitted for brevity, but recommended in prod)
    }
  };

  const handleRepostPost = (id: string) => {
    // Placeholder for repost API
    console.log('Repost not yet implemented on backend');
  };

  const handleEditPost = (id: string, newContent: string, newMedia: MediaItem[]) => {
    // Placeholder for edit API
    console.log('Edit not yet implemented on backend');
  };

  const handleReplyPost = async (postId: string, content: string, media: MediaItem[]) => {
    if (!currentUser) return;

    try {
      const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        setToast({ message: 'Reply sent!', type: 'success' });
        // Update reply count locally
        setCommunityPosts(posts => posts.map(p => {
          if (p.id === postId) {
            return { ...p, replies: p.replies + 1 };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('Reply error:', error);
      setToast({ message: 'Failed to reply', type: 'error' });
    }
  };

  const handleImageClick = useCallback((images: string[], startIndex: number) => {
    setImageViewerState({ images, startIndex });
  }, []);

  const closeImageViewer = useCallback(() => {
    setImageViewerState(null);
  }, []);

  const handlePostSelect = (post: DemandPost | RentalPost) => {
    // Track where we're coming from
    setPreviousView(view);
    setSelectedPost(post);
    localStorage.setItem('bridgehead_selected_post', JSON.stringify(post));
    if ('upvotes' in post) { // Type guard for DemandPost
      handleSetView(View.DEMAND_DETAIL);
    } else {
      handleSetView(View.RENTAL_DETAIL);
    }
  };

  const handleBackToFeed = () => {
    // Go back to previous view if available, otherwise fallback to feed type
    if (previousView !== null) {
      handleSetView(previousView);
    } else if (selectedPost && 'upvotes' in selectedPost) {
      handleSetView(View.DEMAND_FEED);
    } else {
      handleSetView(View.RENTAL_LISTINGS);
    }
    setSelectedPost(null);
    setPreviousView(null);
    localStorage.removeItem('bridgehead_selected_post');
  };

  const handleSendMessage = async (conversationId: string, text: string, media?: MediaItem[]) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: 'currentUser',
      text,
      media,
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => {
      const updatedConversations = prev.map(convo => {
        if (convo.id === conversationId) {
          return {
            ...convo,
            messages: [...convo.messages, newMessage],
            lastMessageTimestamp: newMessage.timestamp,
          };
        }
        return convo;
      });
      return updatedConversations.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
    });

    if (conversationId === ARU_CONVERSATION_ID) {
      if (!aruChat) {
        console.error("ARU chat not initialized");
        return;
      }

      try {
        const result = await aruChat.sendMessageStream({ message: text });

        let modelResponse = '';
        const responseMessageId = crypto.randomUUID();

        setConversations(prev => prev.map(convo => {
          if (convo.id === ARU_CONVERSATION_ID) {
            return {
              ...convo,
              messages: [
                ...convo.messages,
                { id: responseMessageId, senderId: 'aru-bot', text: '...', timestamp: new Date().toISOString() }
              ],
            };
          }
          return convo;
        }));

        for await (const chunk of result) {
          modelResponse += chunk.text;
          setConversations(prev => prev.map(convo => {
            if (convo.id === ARU_CONVERSATION_ID) {
              const updatedMessages = convo.messages.map(msg =>
                msg.id === responseMessageId ? { ...msg, text: modelResponse } : msg
              );
              return {
                ...convo,
                messages: updatedMessages,
                lastMessageTimestamp: new Date().toISOString()
              };
            }
            return convo;
          }));
        }
      } catch (error) {
        console.error("ARU chat error:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          senderId: 'aru-bot',
          text: "Sorry, I'm having trouble connecting right now. Please try again later.",
          timestamp: new Date().toISOString(),
        };
        setConversations(prev => prev.map(convo =>
          convo.id === ARU_CONVERSATION_ID
            ? { ...convo, messages: [...convo.messages, errorMessage], lastMessageTimestamp: errorMessage.timestamp }
            : convo
        ));
      }

    } else {
      // Existing mock peer-to-peer reply logic
      setTimeout(() => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        const replyMessage: Message = {
          id: crypto.randomUUID(),
          senderId: conversation.participant.id,
          text: "Thanks for your message! I'll get back to you shortly.",
          timestamp: new Date().toISOString(),
        };
        setConversations(prev => prev.map(convo => {
          if (convo.id === conversationId) {
            return {
              ...convo,
              messages: [...convo.messages, replyMessage],
              lastMessageTimestamp: replyMessage.timestamp,
            };
          }
          return convo;
        }));
      }, 1500);
    }
  };

  const handleStartCollaboration = (post: DemandPost | RentalPost) => {
    const existingConvo = conversations.find(c => c.postId === post.id);
    if (existingConvo) {
      setSelectedConversationId(existingConvo.id);
    } else {
      const newConvo: Conversation = {
        id: crypto.randomUUID(),
        postId: post.id,
        participant: {
          id: `user-${post.id}`,
          name: `Owner of "${post.title.substring(0, 15)}..."`, // Mock name
          avatar: `user-avatar-${post.id}`,
          postTitle: post.title,
        },
        messages: [],
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        role: 'seeker', // I am starting this collaboration
      };
      setConversations(prev => [newConvo, ...prev]);
      setSelectedConversationId(newConvo.id);
    }
    handleSetView(View.COLLABORATION);
  };

  const handleNavigateToAIAssistant = () => {
    setSelectedConversationId(ARU_CONVERSATION_ID);
    handleSetView(View.COLLABORATION);
  };

  const renderView = () => {
    switch (view) {
      case View.FEED:
        return <Feed
          demandPosts={demandPosts}
          rentalPosts={rentalPosts}
          communityPosts={communityPosts}
          savedDemandIds={savedDemandIds}
          savedRentalIds={savedRentalIds}
          onPostSelect={handlePostSelect}
          onDemandUpvote={handleUpvote}
          onDemandSaveToggle={handleDemandSaveToggle}
          onRentalSaveToggle={handleRentalSaveToggle}
          onCommunityLike={handleLikePost}
          onCommunityRepost={handleRepostPost}
          onCommunityEdit={handleEditPost}
          onCommunityReply={handleReplyPost}
          currentUser={currentUser}
          setView={handleSetView}
        />;
      case View.DEMAND_FEED:
        return <DemandFeed posts={demandPosts} onPostSelect={handlePostSelect} onUpvote={handleUpvote} savedPostIds={savedDemandIds} onSaveToggle={handleDemandSaveToggle} />;
      case View.POST_DEMAND:
        return <PostDemandForm addDemandPost={addDemandPost} setView={handleSetView} />;
      case View.RENTAL_LISTINGS:
        return <RentalListings posts={rentalPosts} onPostSelect={handlePostSelect} savedPostIds={savedRentalIds} onSaveToggle={handleRentalSaveToggle} />;
      case View.POST_RENTAL:
        return <PostRentalForm addRentalPost={addRentalPost} setView={handleSetView} />;
      case View.AI_SUGGESTIONS:
        return <AISuggestions demands={demandPosts} />;
      case View.AI_MATCHES:
        return <AIMatches
          demands={demandPosts}
          rentals={rentalPosts}
          onPostSelect={handlePostSelect}
          onDemandUpvote={handleUpvote}
          onDemandSaveToggle={handleDemandSaveToggle}
          onRentalSaveToggle={handleRentalSaveToggle}
          savedDemandIds={savedDemandIds}
          savedRentalIds={savedRentalIds}
        />;
      case View.COMMUNITY_FEED:
        return <CommunityHub
          posts={communityPosts}
          addPost={addCommunityPost}
          onLike={handleLikePost}
          onRepost={handleRepostPost}
          onEditPost={handleEditPost}
          onReply={handleReplyPost}
          currentUser={currentUser}
          setView={handleSetView}
        />;
      case View.DEMAND_DETAIL:
        return selectedPost ? (
          <DemandDetail
            post={selectedPost as DemandPost}
            onBack={handleBackToFeed}
            onViewDemand={() => handleSetView(View.DEMAND_FEED)}
            onImageClick={handleImageClick}
            onStartCollaboration={handleStartCollaboration}
          />
        ) : <Home setView={handleSetView} />;
      case View.RENTAL_DETAIL:
        return selectedPost ? (
          <RentalDetail
            post={selectedPost as RentalPost}
            onBack={handleBackToFeed}
            onViewRental={() => handleSetView(View.RENTAL_LISTINGS)}
            onImageClick={handleImageClick}
            onStartCollaboration={handleStartCollaboration}
          />
        ) : <Home setView={handleSetView} />;
      case View.SAVED_POSTS:
        return <SavedPosts
          demandPosts={demandPosts}
          rentalPosts={rentalPosts}
          savedDemandIds={savedDemandIds}
          savedRentalIds={savedRentalIds}
          onDemandSaveToggle={handleDemandSaveToggle}
          onRentalSaveToggle={handleRentalSaveToggle}
          onDemandUpvote={handleUpvote}
          onPostSelect={handlePostSelect}
        />;
      case View.COLLABORATION:
        return <Collaboration conversations={conversations} onSendMessage={handleSendMessage} selectedConversationId={selectedConversationId} setSelectedConversationId={setSelectedConversationId} />;
      case View.SIGN_IN:
        return <SignIn onSignIn={handleSignIn} setView={handleSetView} />;
      case View.SIGN_UP:
        return <SignUp onSignUp={handleSignUp} setView={handleSetView} />;
      case View.PROFILE:
        return currentUser ? <Profile user={currentUser} onUpdateUser={handleUpdateUser} setView={handleSetView} demandPosts={demandPosts} rentalPosts={rentalPosts} communityPosts={communityPosts} conversations={conversations} updateDemandPost={updateDemandPost} updateRentalPost={updateRentalPost} deleteDemandPost={deleteDemandPost} deleteRentalPost={deleteRentalPost} markDemandSolved={markDemandSolved} markRentalRented={markRentalRented} /> : <SignIn onSignIn={handleSignIn} setView={handleSetView} />;
      case View.HOME:
      default:
        return <Home setView={handleSetView} />;
    }
  };

  return (
    <>
      <CustomCursor />
      <GlobalScrollProgress />
      <Header
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        currentView={view}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        setView={handleSetView}
      />
      <Sidebar
        onNavigate={handleSetView}
        currentView={view}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />
      {/* Futuristic Sidebar Toggle for Desktop */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onMouseEnter={() => {
          if (!isSidebarOpen && window.innerWidth > 768) setIsSidebarOpen(true);
        }}
        className={`hidden md:flex items-center justify-center fixed top-1/2 -translate-y-1/2 z-[60] transition-all duration-500 group ${isSidebarOpen ? 'left-72' : 'left-0'
          }`}
        style={{
          width: '48px',
          height: '120px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
          borderTopRightRadius: '24px',
          borderBottomRightRadius: '24px',
          borderTop: '2px solid rgba(239, 68, 68, 0.5)',
          borderRight: '2px solid rgba(239, 68, 68, 0.5)',
          borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.1)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: isSidebarOpen ? 'transform' : 'auto',
        }}
        aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {/* Animated accent lines */}
        <div className="absolute inset-0 overflow-hidden rounded-r-3xl">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
          <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Icon */}
        <div className="relative z-10 text-red-500 group-hover:text-red-400 transition-colors duration-300">
          {isSidebarOpen ? (
            <ArrowLeftIcon className="w-6 h-6 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          ) : (
            <ArrowRightIcon className="w-6 h-6 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-r-3xl"></div>
      </button>

      <main
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}
      >
        {renderView()}
      </main>
      <Footer setView={handleSetView} onNavigateToAIAssistant={handleNavigateToAIAssistant} />
      {imageViewerState && (
        <ImageViewer
          images={imageViewerState.images}
          startIndex={imageViewerState.startIndex}
          onClose={closeImageViewer}
        />
      )}
      {view !== View.COLLABORATION && <QuickPostButton setView={handleSetView} isChatbotOpen={isChatbotOpen} />}
      {view !== View.COLLABORATION && <Chatbot isChatbotOpen={isChatbotOpen} onChatbotToggle={setIsChatbotOpen} />}
      <ScrollToTopButton />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;

// Add gradient animation CSS
const styleTag = document.createElement('style');
styleTag.innerHTML = `
          @keyframes gradient-shift {
            0 %, 100 % {
              background- position: 0% 50%;
    }
          50% {
            background - position: 100% 50%;
    }
  }

          .animate-gradient-shift {
            background - size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
  }

          @keyframes dropdownOpen {
            0 % {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
            }
    100% {
            opacity: 1;
          transform: translateY(0) scale(1);
    }
  }

          @keyframes dropdownClose {
            0 % {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
    100% {
            opacity: 0;
          transform: translateY(-10px) scale(0.95);
    }
  }
          `;
if (!document.querySelector('style[data-gradient-anim]')) {
  styleTag.setAttribute('data-gradient-anim', 'true');
  document.head.appendChild(styleTag);
}


