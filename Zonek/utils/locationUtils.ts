interface Location {
    latitude: number;
    longitude: number;
    address: string;
}

/**
 * Sanitizes location address to "City, Area" format for cleaner display
 * @param location - Location object with address string
 * @returns Formatted string in "City, Area" format
 * 
 * @example
 * sanitizeLocation({ address: "123 Main St, Downtown, Mumbai, Maharashtra" })
 * // Returns: "Mumbai, Downtown"
 * 
 * @example
 * sanitizeLocation({ address: "456 Park Ave, Andheri West, Mumbai" })
 * // Returns: "Mumbai, Andheri West"
 */
export function sanitizeLocation(location: Location): string {
    const address = location.address.trim();

    // Check if address contains "Location at" pattern with coordinates
    if (address.toLowerCase().includes('location at')) {
        return 'Location';
    }

    // Check if address is just coordinates (contains mostly numbers, dots, commas, spaces)
    const isCoordinates = /^[\d\s,.-]+$/.test(address);
    if (isCoordinates) {
        return 'Location';
    }

    // Split by comma and clean up
    const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);

    // If we have multiple parts, try to extract meaningful location
    if (parts.length >= 4) {
        // Format: "plot, area, city, state, pincode" → "area, city, state"
        const state = parts[parts.length - 2]; // Second from end (before pincode)
        const city = parts[parts.length - 3]; // Third from end
        const area = parts[parts.length - 4]; // Fourth from end
        return `${area}, ${city}, ${state}`;
    } else if (parts.length === 3) {
        // Format: "area, city, state"
        return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
    } else if (parts.length === 2) {
        // For "Area, City" format
        return `${parts[0]}, ${parts[1]}`;
    } else if (parts.length === 1) {
        // Just one part, return it
        return parts[0];
    }

    // Fallback to 'Location' if nothing works
    return 'Location';
}
