// Business Category Constants and Utilities

export const DEMAND_CATEGORIES = [
    // Food & Beverage
    "Restaurant", "Cafe & Coffee Shop", "Bar & Pub", "Fast Food", "Bakery & Pastry Shop",
    "Ice Cream Parlor", "Juice Bar", "Food Truck", "Fine Dining", "Ethnic Cuisine",
    "Pizza Place", "Burger Joint", "Dessert Shop", "Tea House", "Brewery",

    // Retail & Shopping
    "Grocery Store", "Convenience Store", "Bookstore", "Clothing Store", "Shoe Store",
    "Electronics Store", "Furniture Store", "Home Decor", "Pet Store", "Toy Store",
    "Pharmacy", "Beauty Supply", "Sports Equipment", "Hardware Store", "Gift Shop",
    "Specialty Store", "Thrift Store", "Farmers Market",

    // Entertainment & Leisure
    "Gaming Lounge", "Arcade", "Movie Theater", "Bowling Alley", "Escape Room",
    "VR Gaming Center", "Board Game Cafe", "Karaoke Bar", "Comedy Club", "Music Venue",
    "Night Club", "Sports Bar", "Billiards Hall", "Laser Tag Arena",

    // Health & Wellness
    "Gym & Fitness Center", "Yoga Studio", "Spa & Massage", "Medical Clinic",
    "Dental Clinic", "Physiotherapy", "Mental Health Center", "Nutrition Center",
    "Salon & Barbershop", "Nail Salon", "Wellness Center",

    // Recreation & Sports
    "Swimming Pool", "Sports Complex", "Tennis Court", "Basketball Court",
    "Cricket Ground", "Badminton Court", "Rock Climbing Gym", "Skate Park",
    "Cycling Track", "Running Track", "Golf Course", "Paintball Arena",

    // Community & Public Spaces
    "Public Park", "Dog Park", "Community Center", "Library", "Playground",
    "Garden & Botanical Park", "Picnic Area", "Outdoor Gym", "Amphitheater",

    // Services
    "Laundromat", "Dry Cleaning", "Car Wash", "Repair Shop", "Tailoring Service",
    "Photography Studio", "Print Shop", "Courier Service", "Storage Facility",
    "Co-working Space", "Event Venue", "Banquet Hall",

    // Education & Learning
    "Tuition Center", "Music School", "Dance Academy", "Art Studio", "Cooking Classes",
    "Language School", "Skill Development Center", "Vocational Training",

    // Automotive
    "Gas Station", "Electric Charging Station", "Auto Repair", "Car Dealership",
    "Bike Repair Shop", "Car Accessories",

    // Technology
    "Computer Repair", "Mobile Repair", "Internet Cafe", "Tech Store",
    "Gaming Store", "Gadget Shop",

    // Other
    "ATM", "Bank Branch", "Post Office", "Recycling Center", "Public Restroom",
    "Tourist Information", "Cultural Center", "Religious Center", "Other"
] as const;

export const RENTAL_CATEGORIES = [
    // Commercial Retail
    "Retail Space", "Shop", "Boutique Space", "Mall Kiosk", "Market Stall",
    "Showroom", "Pop-up Store Space",

    // Food & Beverage
    "Restaurant Space", "Cafe Space", "Bar Space", "Fast Food Outlet",
    "Food Court Space", "Commercial Kitchen", "Ghost Kitchen",

    // Office & Workspace  
    "Office Space", "Co-working Space", "Meeting Room", "Virtual Office",
    "Executive Suite", "Call Center Space", "Serviced Office",

    // Entertainment & Leisure
    "Event Venue", "Banquet Hall", "Wedding Venue", "Party Hall",
    "Exhibition Space", "Gallery Space", "Theater Space", "Studio Space",

    // Health & Fitness
    "Gym Space", "Yoga Studio", "Spa Space", "Clinic Space",
    "Salon Space", "Medical Office", "Wellness Center Space",

    // Education & Training
    "Classroom Space", "Training Center", "Coaching Center", "Dance Studio",
    "Music Studio", "Art Studio", "Workshop Space",

    // Industrial & Warehouse
    "Warehouse", "Storage Unit", "Industrial Space", "Manufacturing Unit",
    "Cold Storage", "Logistics Center", "Distribution Center",

    // Specialty Spaces
    "Gaming Lounge Space", "Arcade Space", "Sports Facility",
    "Community Center", "Cultural Center", "Creative Space",

    // Land & Outdoor
    "Commercial Land", "Parking Space", "Outdoor Venue", "Sports Ground",
    "Farm Space", "Open Land",

    // Mixed Use
    "Mixed-use Space", "Flex Space", "Multi-purpose Hall",

    // Other
    "Other Commercial Space"
] as const;

export type DemandCategory = typeof DEMAND_CATEGORIES[number];
export type RentalCategory = typeof RENTAL_CATEGORIES[number];

/**
 * Filter categories based on search query
 * Returns categories that match the query, sorted by relevance
 */
export const filterCategories = (
    categories: readonly string[],
    query: string
): string[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    // Exact matches first
    const exactMatches = categories.filter(cat =>
        cat.toLowerCase() === lowerQuery
    );

    // Starts with query
    const startsWithMatches = categories.filter(cat =>
        cat.toLowerCase().startsWith(lowerQuery) && !exactMatches.includes(cat)
    );

    // Contains query
    const containsMatches = categories.filter(cat =>
        cat.toLowerCase().includes(lowerQuery) &&
        !exactMatches.includes(cat) &&
        !startsWithMatches.includes(cat)
    );

    return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 10);
};

/**
 * Get category icon/emoji based on category name
 */
export const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
        // Food & Beverage
        "Restaurant": "🍽️", "Cafe & Coffee Shop": "☕", "Bar & Pub": "🍺",
        "Fast Food": "🍔", "Bakery & Pastry Shop": "🥐", "Ice Cream Parlor": "🍦",
        "Pizza Place": "🍕", "Burger Joint": "🍔", "Dessert Shop": "🍰",

        // Entertainment
        "Gaming Lounge": "🎮", "Arcade": "👾", "Movie Theater": "🎬",
        "Bowling Alley": "🎳", "Escape Room": "🔐", "VR Gaming Center": "🥽",

        // Retail
        "Bookstore": "📚", "Clothing Store": "👕", "Electronics Store": "📱",
        "Pet Store": "🐾", "Toy Store": "🧸", "Grocery Store": "🛒",

        // Health & Wellness
        "Gym & Fitness Center": "💪", "Yoga Studio": "🧘", "Spa & Massage": "💆",
        "Salon & Barbershop": "💇", "Medical Clinic": "🏥",

        // Community
        "Public Park": "🌳", "Dog Park": "🐕", "Library": "📖",
        "Playground": "🎪", "Community Center": "🏛️",

        // Default
        "Other": "🏢"
    };

    return iconMap[category] || "🏢";
};
