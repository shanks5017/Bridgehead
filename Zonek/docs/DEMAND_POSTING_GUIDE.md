# Demand Posting Feature - Complete Implementation Guide

## Overview

Complete backend implementation for posting demand posts with image uploads, authentication, and validation. The system allows authenticated users to post business demands with details, location, contact information, and up to 5 images.

---

## ✅ What's Been Implemented

### Backend Components

#### 1. **File Upload Middleware** - [`upload.ts`](file:///d:/my%20projects/bridgehead%20(1)/backend/middleware/upload.ts)
- Multer configuration for handling image uploads
- Storage in `/uploads/demands/` directory with unique filenames
- File type validation (JPEG, PNG, GIF only)
- Size limit: 5MB per image, maximum 5 images
- Comprehensive error handling for upload failures

#### 2. **Enhanced Validation** - [`validation.ts`](file:///d:/my%20projects/bridgehead%20(1)/backend/middleware/validation.ts)
- Title: 5-200 characters
- Description: 20-2000 characters
- Location address: required
- Contact email: valid email format (optional)
- Contact phone: valid phone format (optional)
- Detailed error messages for validation failures

#### 3. **Updated Controller** - [`postController.ts`](file:///d:/my%20projects/bridgehead%20(1)/backend/controllers/postController.ts)
- `createDemandPost` enhanced to:
  - Process uploaded image files from `req.files`
  - Store image paths in database
  - Support multiple location formats (string address, lat/lng object)
  - Map contact fields to schema fields
  - Return structured success/error responses

#### 4. **Protected Routes** - [`posts.ts`](file:///d:/my%20projects/bridgehead%20(1)/backend/routes/posts.ts)
- `POST /api/posts/demands` - Protected with authentication
- Middleware chain: `auth` → `uploadMultiple` → `handleUploadError` → `validateDemand` → `createDemandPost`
- `PUT /api/posts/demands/:id/upvote` - Protected with authentication

#### 5. **Static File Serving** - [`server.ts`](file:///d:/my%20projects/bridgehead%20(1)/backend/server.ts)
- Configured to serve `/uploads` directory
- Images accessible at `http://localhost:5001/uploads/demands/<filename>`

---

## 📋 Existing Schema (Already in Place)

The [`DemandPost`](file:///d:/my%20projects/bridgehead%20(1)/backend/models/DemandPost.ts) model includes all required fields:

```typescript
{
  title: String (required)
  category: String (required)
  description: String (required)
  location: {
    type: 'Point'
    coordinates: [longitude, latitude]
    address: String
  }
  images: [String] // Array of image paths
  phone: String (optional)
  email: String (optional)  
  openToCollaboration: Boolean (default: true)
  upvotes: Number (default: 0)
  upvotedBy: [ObjectId]
  status: 'active' | 'fulfilled' | 'expired'
  createdBy: ObjectId (required)
  comments: Array
  createdAt: Date
  updatedAt: Date
}
```

---

## 🧪 Testing Results

All API tests passed successfully:

| Test | Status | Details |
|------|--------|---------|
| Authentication Required | ✅ PASS | Returns 401 when no token provided |
| Validation | ✅ PASS | Returns 400 with error details for missing/invalid fields |
| Create Demand Post | ✅ PASS | Returns 201 with post data when all fields valid |
| Field Mapping | ✅ PASS | Correctly maps `contactEmail` → `email`, `contactPhone` → `phone` |
| Database Storage | ✅ PASS | Post saved to MongoDB `demandposts` collection |

**Test Script:** [`test-demand-api.js`](file:///d:/my%20projects/bridgehead%20(1)/backend/test-demand-api.js)

---

## 🔌 API Reference

### POST /api/posts/demands

Create a new demand post.

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Content-Type: multipart/form-data  // When uploading images
Content-Type: application/json     // Without images
Authorization: Bearer <JWT_TOKEN>
```

**Request Body (JSON - no images):**
```json
{
  "title": "A 24/7 Soda Shop",
  "category": "Food & Drink",
  "description": "Looking for entrepreneur to open a soda shop that operates 24/7...",
  "location": {
    "address": "123 Main St, Downtown",
    "latitude": 40.7128,    // Optional
    "longitude": -74.0060   // Optional
  },
  "contactEmail": "you@example.com",     // Optional
  "contactPhone": "(123) 456-7890",      // Optional
  "openToCollaboration": true            // Optional, default: true
}
```

**Request Body (Form Data - with images):**
```
title: "A 24/7 Soda Shop"
category: "Food & Drink"
description: "Looking for entrepreneur..."
location[address]: "123 Main St"
location[latitude]: "40.7128"
location[longitude]: "-74.0060"
contactEmail: "you@example.com"
contactPhone: "(123) 456-7890"
openToCollaboration: "true"
images: <file1>
images: <file2>
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Demand post created successfully",
  "data": {
    "id": "693b05048ca401447277d580",
    "title": "A 24/7 Soda Shop",
    "category": "Food & Drink",
    "description": "Looking for entrepreneur...",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, Downtown"
    },
    "images": [
      "/uploads/demands/image1-1234567890.jpg",
      "/uploads/demands/image2-1234567891.jpg"
    ],
    "email": "you@example.com",
    "phone": "(123) 456-7890",
    "openToCollaboration": true,
    "upvotes": 0,
    "status": "active",
    "createdAt": "2025-12-11T18:30:00.000Z",
    "updatedAt": "2025-12-11T18:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "message": "No token, authorization denied"
}

// 400 Bad Request (Validation Error)
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Title is required and must be between 5 and 200 characters",
      "param": "title",
      "location": "body"
    }
  ]
}

// 400 Bad Request (File Upload Error)
{
  "success": false,
  "message": "File too large. Maximum size is 5MB per image."
}
```

### GET /api/posts/demands

Retrieve all demand posts.

**Authentication:** Not required

**Success Response (200 OK):**
```json
[
  {
    "id": "693b05048ca401447277d580",
    "title": "A 24/7 Soda Shop",
    // ... full post data
  }
]
```

---

## 📱 Frontend Integration Guide

### Option 1: JSON Request (No Images)

```javascript
const response = await fetch('http://localhost:5001/api/posts/demands', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: formData.title,
    category: formData.category,
    description: formData.description,
    location: {
      address: formData.location,
      latitude: formData.lat,  // Optional
      longitude: formData.lng  // Optional
    },
    contactEmail: formData.email,
    contactPhone: formData.phone,
    openToCollaboration: formData.openToCollab
  })
});
```

### Option 2: FormData Request (With Images)

```javascript
const formData = new FormData();
formData.append('title', 'A 24/7 Soda Shop');
formData.append('category', 'Food & Drink');
formData.append('description', 'Looking for entrepreneur...');
formData.append('location[address]', '123 Main St');
formData.append('location[latitude]', '40.7128');
formData.append('location[longitude]', '-74.0060');
formData.append('contactEmail', 'you@example.com');
formData.append('contactPhone', '(123) 456-7890');
formData.append('openToCollaboration', 'true');

// Add images (multiple files)
imageFiles.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('http://localhost:5001/api/posts/demands', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // DO NOT set Content-Type - browser will set it with boundary
  },
  body: formData
});
```

---

## 🖼️ Image Upload Examples

### React Example with Drag & Drop

```javascript
const [images, setImages] = useState([]);

const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  
  // Validate file count
  if (files.length > 5) {
    alert('Maximum 5 images allowed');
    return;
  }
  
  // Validate file sizes
  const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
  if (oversized.length > 0) {
    alert('Some files exceed 5MB limit');
    return;
  }
  
  setImages(files);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  // ... add all other fields
  
  images.forEach(img => {
    formData.append('images', img);
  });
  
  const response = await fetch('/api/posts/demands', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('Posted!', data.data);
  }
};
```

---

## 🔐 Security Features

- ✅ **Authentication Required**: Only logged-in users can post demands
- ✅ **File Type Validation**: Only images (JPEG, PNG, GIF) accepted
- ✅ **File Size Limits**: 5MB per image, max 5 images
- ✅ **Input Validation**: All fields validated with express-validator
- ✅ **SQL Injection Protection**: MongoDB + Mongoose prevents injection
- ✅ **XSS Protection**: Express.js default protections

---

## 📂 File Structure

```
backend/
├── middleware/
│   ├── auth.ts           ✅ Authentication middleware
│   ├── upload.ts         ✅ NEW - File upload with multer
│   └── validation.ts     ✅ UPDATED - Enhanced validation
├── models/
│   └── DemandPost.ts     ✅ Complete schema (already existed)
├── controllers/
│   └── postController.ts ✅ UPDATED - Image processing
├── routes/
│   └── posts.ts          ✅ UPDATED - Auth & upload middleware
├── uploads/
│   └── demands/          ✅ NEW - Image storage directory
└── server.ts             ✅ UPDATED - Static file serving
```

---

## ✨ Next Steps (Frontend)

To complete the feature, update the frontend:

1. **Update API Call in Demand Form Component**
   - Use FormData when images are selected
   - Include Authorization header with JWT token
   - Handle success/error responses

2. **Image Upload UI**
   - Add file input with `accept="image/*" multiple`
   - Show image previews before upload
   - Display upload progress

3. **Location Handling**
   - Add geolocation button to capture coordinates
   - Support manual address entry
   - Optionally integrate with Google Maps API

4. **Validation**
   - Add client-side validation matching backend rules
   - Show character counts for title/description
   - Validate image file sizes before upload

5. **Success Handling**
   - Redirect to demand feed after successful post
   - Show success notification
   - Clear form data

---

## 💡 Tips

- Store JWT token in localStorage or secure cookie
- Use `axios` or `fetch` for API calls
- Handle image preview with `URL.createObjectURL(file)`
- Show loading state during upload
- Compress images client-side if needed (optional)
- Test with both JSON and FormData approaches

---

## 🐛 Troubleshooting

**Issue: 401 Unauthorized**
- Ensure token is included in Authorization header
- Format: `Bearer <token>` (note the space)
- Verify token hasn't expired

**Issue: 400 File Upload Error**
- Check file sizes (max 5MB each)
- Verify file types (only images)
- Ensure max 5 files

**Issue: Images not displaying**
- Verify backend is serving `/uploads` directory
- Check image path format: `/uploads/demands/filename.jpg`
- Ensure CORS allows image requests

**Issue: Validation errors**
- Review console for specific error messages
- Check field lengths (title: 5-200, description: 20-2000)
- Ensure required fields are provided
