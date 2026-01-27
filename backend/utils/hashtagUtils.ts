/**
 * Hashtag Utility Functions
 * Provides reusable functions for extracting and normalizing hashtags from text
 */

/**
 * Extract hashtags from text using regex pattern
 * @param text - The text to extract hashtags from
 * @returns Array of normalized hashtags (lowercase, without # symbol)
 */
export const extractHashtags = (text: string): string[] => {
    if (!text || typeof text !== 'string') {
        return [];
    }

    // Match hashtags: # followed by alphanumeric characters and underscores
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);

    if (!matches) {
        return [];
    }

    // Normalize and remove duplicates
    const normalized = matches.map(tag => normalizeHashtag(tag));
    return [...new Set(normalized)];
};

/**
 * Normalize a hashtag by removing # symbol and converting to lowercase
 * @param tag - The hashtag to normalize
 * @returns Normalized hashtag string
 */
export const normalizeHashtag = (tag: string): string => {
    if (!tag || typeof tag !== 'string') {
        return '';
    }

    // Remove # symbol and convert to lowercase
    return tag.replace('#', '').toLowerCase().trim();
};

/**
 * Format hashtag for display (adds # prefix if not present)
 * @param tag - The hashtag to format
 * @returns Formatted hashtag with # prefix
 */
export const formatHashtagForDisplay = (tag: string): string => {
    if (!tag || typeof tag !== 'string') {
        return '';
    }

    const normalized = tag.trim();
    return normalized.startsWith('#') ? normalized : `#${normalized}`;
};

/**
 * Validate if a string is a valid hashtag
 * @param tag - The string to validate
 * @returns True if valid hashtag format
 */
export const isValidHashtag = (tag: string): boolean => {
    if (!tag || typeof tag !== 'string') {
        return false;
    }

    // Valid hashtag: starts with # and contains only alphanumeric and underscore
    const validHashtagRegex = /^#[a-zA-Z0-9_]+$/;
    return validHashtagRegex.test(tag);
};
