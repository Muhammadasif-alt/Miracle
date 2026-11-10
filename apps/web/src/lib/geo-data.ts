/**
 * Structured Country, City, and Niche Data for Miracle Pitch Studio
 * Supports real searchable dropdown filtering and dynamic city cascading
 */

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  cities: string[];
}

export const COUNTRIES_DATA: CountryOption[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    cities: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Miami",
      "Austin",
      "San Francisco",
      "Dallas",
      "Seattle",
      "Boston",
      "Atlanta",
      "Denver",
      "San Diego",
      "Phoenix",
      "Houston",
      "Las Vegas",
      "All US Metros",
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    cities: [
      "London",
      "Manchester",
      "Birmingham",
      "Leeds",
      "Glasgow",
      "Liverpool",
      "Edinburgh",
      "Bristol",
      "Sheffield",
      "All UK Cities",
    ],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    cities: [
      "Toronto",
      "Vancouver",
      "Montreal",
      "Calgary",
      "Ottawa",
      "Edmonton",
      "Winnipeg",
      "Quebec City",
      "All Canada Cities",
    ],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    cities: [
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth",
      "Adelaide",
      "Gold Coast",
      "Canberra",
      "All Australia Cities",
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    cities: [
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Ras Al Khaimah",
      "Al Ain",
      "All UAE Cities",
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    cities: ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina", "All Saudi Cities"],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    cities: [
      "Berlin",
      "Munich",
      "Frankfurt",
      "Hamburg",
      "Cologne",
      "Stuttgart",
      "Dusseldorf",
      "All Germany Cities",
    ],
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "All France Cities"],
  },
  {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "All Netherlands Cities"],
  },
  {
    code: "CH",
    name: "Switzerland",
    flag: "🇨🇭",
    cities: ["Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Lucerne"],
  },
  {
    code: "IE",
    name: "Ireland",
    flag: "🇮🇪",
    cities: ["Dublin", "Cork", "Galway", "Limerick", "Waterford"],
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    cities: ["Singapore Central", "Marina Bay", "Jurong", "Orchard", "All Singapore Areas"],
  },
  {
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar"],
  },
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    cities: ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Pune", "Chennai", "Gurgaon", "All India Metros"],
  },
  {
    code: "QA",
    name: "Qatar",
    flag: "🇶🇦",
    cities: ["Doha", "Al Rayyan", "Al Wakrah", "Lusail", "All Qatar Cities"],
  },
  {
    code: "GLOBAL",
    name: "Global / Worldwide",
    flag: "🌐",
    cities: ["Worldwide Metros", "North America", "EMEA Region", "APAC Region", "Latin America"],
  },
];

export const NICHES_DATA = [
  "Dental Clinics",
  "Restaurants & Cafes",
  "Real Estate & Property",
  "E-Commerce & DTC Brands",
  "Hair Salons, Spas & Beauty",
  "Gyms & Fitness Centers",
  "SaaS & AI Software",
  "Marketing & Creative Agencies",
  "Law Firms & Legal Advisory",
  "Medical & Healthcare Clinics",
  "Architecture & Interior Design",
  "Content Creators & YouTubers",
  "Fintech & Financial Advisory",
  "Construction & Contractors",
  "Podcasts & Media Brands",
  "Corporate Consulting & B2B",
];

export const AUDIENCES_DATA = [
  "CEOs & Founders",
  "Marketing Directors & CMOs",
  "Procurement Managers",
  "Small Business Owners",
  "General Consumers & Creators",
];

export const TONES_DATA = [
  "Direct & Professional",
  "Creative & High-Energy",
  "Consultative & Insightful",
  "Warm & Conversational",
  "Concise & Action-Oriented",
];

export const PLATFORMS_DATA = [
  "Google Maps Local Business",
  "LinkedIn B2B Outreach",
  "Direct Cold Email Sequence",
  "Multi-Channel (Email + LinkedIn)",
];
