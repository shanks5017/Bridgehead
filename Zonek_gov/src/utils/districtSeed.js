'use strict';

/**
 * Seed list of districts for India (state, district).
 * This is a curated list to expand coverage beyond the few hardcoded districts.
 * In production, this could be replaced with a full LGD district dump.
 */
const DISTRICT_SEED = [
  // Andhra Pradesh
  { state: 'Andhra Pradesh', district: 'Visakhapatnam' },
  { state: 'Andhra Pradesh', district: 'Vijayawada' },
  { state: 'Andhra Pradesh', district: 'Guntur' },
  { state: 'Andhra Pradesh', district: 'Nellore' },
  { state: 'Andhra Pradesh', district: 'Kurnool' },
  // Arunachal Pradesh
  { state: 'Arunachal Pradesh', district: 'Papum Pare' },
  { state: 'Arunachal Pradesh', district: 'Lohit' },
  // Assam
  { state: 'Assam', district: 'Kamrup Metropolitan' },
  { state: 'Assam', district: 'Darrang' },
  { state: 'Assam', district: 'Nagaon' },
  // Bihar
  { state: 'Bihar', district: 'Patna' },
  { state: 'Bihar', district: 'Gaya' },
  { state: 'Bihar', district: 'Bhagalpur' },
  { state: 'Bihar', district: 'Muzaffarpur' },
  // Chhattisgarh
  { state: 'Chhattisgarh', district: 'Raipur' },
  { state: 'Chhattisgarh', district: 'Bilaspur' },
  { state: 'Chhattisgarh', district: 'Durg' },
  // Goa
  { state: 'Goa', district: 'North Goa' },
  { state: 'Goa', district: 'South Goa' },
  // Gujarat
  { state: 'Gujarat', district: 'Ahmedabad' },
  { state: 'Gujarat', district: 'Surat' },
  { state: 'Gujarat', district: 'Vadodara' },
  { state: 'Gujarat', district: 'Rajkot' },
  { state: 'Gujarat', district: 'Jamnagar' },
  // Haryana
  { state: 'Haryana', district: 'Faridabad' },
  { state: 'Haryana', district: 'Gurugram' },
  { state: 'Haryana', district: 'Panipat' },
  { state: 'Haryana', district: 'Ambala' },
  // Himachal Pradesh
  { state: 'Himachal Pradesh', district: 'Kangra' },
  { state: 'Himachal Pradesh', district: 'Shimla' },
  { state: 'Himachal Pradesh', district: 'Mandi' },
  // Jharkand
  { state: 'Jharkhand', district: 'Ranchi' },
  { state: 'Jharkhand', district: 'Dhanbad' },
  { state: 'Jharkhand', district: 'Bokaro' },
  // Karnataka
  { state: 'Karnataka', district: 'Bangalore Urban' },
  { state: 'Karnataka', district: 'Belgaum' },
  { state: 'Karnataka', district: 'Mysore' },
  { state: 'Karnataka', district: 'Gulbarga' },
  { state: 'Karnataka', district: 'Dharwad' },
  // Kerala
  { state: 'Kerala', district: 'Thiruvananthapuram' },
  { state: 'Kerala', district: 'Ernakulam' },
  { state: 'Kerala', district: 'Kozhikode' },
  { state: 'Kerala', district: 'Thrissur' },
  // Madhya Pradesh
  { state: 'Madhya Pradesh', district: 'Bhopal' },
  { state: 'Madhya Pradesh', district: 'Indore' },
  { state: 'Madhya Pradesh', district: 'Jabalpur' },
  { state: 'Madhya Pradesh', district: 'Gwalior' },
  { state: 'Madhya Pradesh', district: 'Ujjain' },
  // Maharashtra
  { state: 'Maharashtra', district: 'Mumbai' },
  { state: 'Maharashtra', district: 'Pune' },
  { state: 'Maharashtra', district: 'Nagpur' },
  { state: 'Maharashtra', district: 'Thane' },
  { state: 'Maharashtra', district: 'Nashik' },
  { state: 'Maharashtra', district: 'Aurangabad' },
  // Manipur
  { state: 'Manipur', district: 'Imphal West' },
  { state: 'Manipur', district: 'Thoubal' },
  // Meghalaya
  { state: 'Meghalaya', district: 'East Khasi Hills' },
  { state: 'Meghalaya', district: 'Jaintia Hills' },
  // Mizoram
  { state: 'Mizoram', district: 'Aizawl' },
  { state: 'Mizoram', district: 'Lunglei' },
  // Nagaland
  { state: 'Nagaland', district: 'Dimapur' },
  { state: 'Nagaland', district: 'Kohima' },
  // Odisha
  { state: 'Odisha', district: 'Khordha' },
  { state: 'Odisha', district: 'Cuttack' },
  { state: 'Odisha', district: 'Rourkela' },
  { state: 'Odisha', district: 'Berhampur' },
  // Punjab
  { state: 'Punjab', district: 'Ludhiana' },
  { state: 'Punjab', district: 'Amritsar' },
  { state: 'Punjab', district: 'Jalandhar' },
  { state: 'Punjab', district: 'Patiala' },
  // Rajasthan
  { state: 'Rajasthan', district: 'Jaipur' },
  { state: 'Rajasthan', district: 'Jodhpur' },
  { state: 'Rajasthan', district: 'Udaipur' },
  { state: 'Rajasthan', district: 'Kota' },
  { state: 'Rajasthan', district: 'Bikaner' },
  // Sikkim
  { state: 'Sikkim', district: 'East Sikkim' },
  { state: 'Sikkim', district: 'North Sikkim' },
  // Tamil Nadu
  { state: 'Tamil Nadu', district: 'Chennai' },
  { state: 'Tamil Nadu', district: 'Coimbatore' },
  { state: 'Tamil Nadu', district: 'Madurai' },
  { state: 'Tamil Nadu', district: 'Tiruchirappalli' },
  { state: 'Tamil Nadu', district: 'Salem' },
  // Telangana
  { state: 'Telangana', district: 'Hyderabad' },
  { state: 'Telangana', district: 'Warangal' },
  { state: 'Telangana', district: 'Nizamabad' },
  { state: 'Telangana', district: 'Karimnagar' },
  // Tripura
  { state: 'Tripura', district: 'West Tripura' },
  { state: 'Tripura', district: 'South Tripura' },
  // Uttar Pradesh
  { state: 'Uttar Pradesh', district: 'Lucknow' },
  { state: 'Uttar Pradesh', district: 'Kanpur Nagar' },
  { state: 'Uttar Pradesh', district: 'Ghaziabad' },
  { state: 'Uttar Pradesh', district: 'Agra' },
  { state: 'Uttar Pradesh', district: 'Varanasi' },
  { state: 'Uttar Pradesh', district: 'Meerut' },
  // Uttarakhand
  { state: 'Uttarakhand', district: 'Dehradun' },
  { state: 'Uttarakhand', district: 'Haridwar' },
  { state: 'Uttarakhand', district: 'Nainital' },
  // West Bengal
  { state: 'West Bengal', district: 'Kolkata' },
  { state: 'West Bengal', district: 'North 24 Parganas' },
  { state: 'West Bengal', district: 'Howrah' },
  { state: 'West Bengal', district: 'Darjeeling' },
  // Delhi
  { state: 'Delhi', district: 'New Delhi' },
  { state: 'Delhi', district: 'North Delhi' },
  { state: 'Delhi', district: 'South Delhi' },
  // Jammu and Kashmir
  { state: 'Jammu and Kashmir', district: 'Anantnag' },
  { state: 'Jammu and Kashmir', district: 'Srinagar' },
  { state: 'Jammu and Kashmir', district: 'Baramulla' },
  // Ladakh
  { state: 'Ladakh', district: 'Leh' },
  { state: 'Ladakh', district: 'Kargil' },
];

module.exports = { DISTRICT_SEED };