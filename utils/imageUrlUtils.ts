import { config } from '../src/config';

/**
 * Get the full URL for an uploaded image
 * Backend saves images as relative paths like "/uploads/demands/image.jpg"
 * This function converts them to full URLs like "http://localhost:5001/uploads/demands/image.jpg"
 */
export const getImageUrl = (imagePath: string): string => {
    // If it's already a full URL (starts with http:// or https://), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // If it's a data URL (base64), return as is
    if (imagePath.startsWith('data:')) {
        return imagePath;
    }

    // Otherwise, it's a relative path from the backend - prepend the backend base URL
    // config.api.baseUrl is like "http://localhost:5001/api", we need just "http://localhost:5001"
    const baseUrl = config.api.baseUrl.replace('/api', '');

    // Ensure the path starts with /
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    return `${baseUrl}${path}`;
};

/**
 * Get full URLs for multiple images
 */
export const getImageUrls = (imagePaths: string[]): string[] => {
    return imagePaths.map(getImageUrl);
};
