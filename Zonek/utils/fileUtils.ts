/**
 * Convert a base64 data URL to a File object
 * @param dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
 * @param filename - Optional filename for the file
 * @returns File object
 */
export const dataUrlToFile = async (dataUrl: string, filename?: string): Promise<File> => {
    // Extract mime type and base64 data
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    // Generate filename if not provided
    const ext = mime.split('/')[1];
    const name = filename || `image-${Date.now()}.${ext}`;

    return new File([u8arr], name, { type: mime });
};

/**
 * Convert multiple base64 data URLs to File objects
 * @param dataUrls - Array of base64 data URLs
 * @returns Array of File objects
 */
export const dataUrlsToFiles = async (dataUrls: string[]): Promise<File[]> => {
    return Promise.all(dataUrls.map((url, index) => dataUrlToFile(url, `image-${index + 1}`)));
};
