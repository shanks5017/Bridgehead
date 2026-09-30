import fs from 'fs/promises';
import path from 'path';

const categories = [
  "AC Service",
  "Astrologers",
  "Body Massage Centers",
  "Beauty Spa",
  "Car Hire",
  "Caterers",
  "Chartered Accountant",
  "Computer Training Institutes",
  "Courier Services",
  "Computer & Laptop Repair & Services",
  "Car Repair & Services",
  "Dermatologists",
  "Dentists",
  "Electricians",
  "Event Organizer",
  "Real Estate",
  "Fabricators",
  "Furniture Repair Services",
  "Hospitals",
  "House keeping Services",
  "Hobbies",
  "Interior Designers",
  "Internet Website Designers",
  "Jewellery Showrooms",
  "Lawyers",
  "Transporters",
  "Photographers",
  "Nursing Services",
  "Printing & Publishing Services",
  "Placement Services",
  "Pest Control Services",
  "Painting Contractors",
  "Packers & Movers",
  "Scrap Dealers",
  "Scrap Buyers",
  "Registration Consultants",
  "Security System",
  "Coaching",
  "Vocational training",
  "Home Services",
  "Interior Decorators",
  "Plumbers",
  "Diagnostic Centers",
  "Schools",
  "Colleges",
  "Hotels",
  "Restaurants",
  "Stationery Shop",
  "Hardware Stores",
  "Clinics",
  "Bakeries",
  "General Stores",
  "Travel Agents",
  "Water Purifier Dealers",
  "Modular Kitchen Dealers",
  "Solar Water Heater Dealers",
  "Security Services",
  "Web Designers",
  "Digital Marketing Agencies",
  "Mobile Phone Repair & Services"
];

const cities = [
  "Bangalore",
  "Chennai",
  "Madurai",
  "Trichy",
  "Salem",
  "Tirupur",
  "Vellore",
  "Hyderabad"
];

async function generateConfigs() {
  const srcDir = 'd:/my projects/my projects/Zonek-Intelligence/zonek-core/src';
  
  for (const city of cities) {
    const config = {
      city: city,
      atomicUnits: [
        {
          area: city,
          categories: categories
        }
      ]
    };
    
    const filePath = path.join(srcDir, `${city.toLowerCase()}.json`);
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Generated ${filePath}`);
  }
}

generateConfigs();
