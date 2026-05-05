export type Member = {
  id: string;
  name: string;
  business: string;
  category: string;
  city: string;
  services: string[];
  email: string;
  phone: string;
  address: string;
  initials: string;
  featured?: boolean;
  avatarUrl?: string | null;
  committeeBadge?: string | null;
};

export const categories = [
  "All",
  "Manufacturing",
  "Real Estate",
  "Finance",
  "Technology",
  "Retail",
  "Trading",
  "Services",
  "Startups",
  "Travel",
  "Export/Import",
];

export const members: Member[] = [
  {
    id: "m1",
    name: "Rajveer Singh Rathore",
    business: "Rathore Steel Industries",
    category: "Manufacturing",
    city: "Jodhpur",
    services: ["Steel Fabrication", "Industrial Supply", "OEM Manufacturing"],
    email: "rajveer@rathoresteel.in",
    phone: "+91 98290 11111",
    address: "Industrial Area, Jodhpur, Rajasthan",
    initials: "RR",
    featured: true,
  },
  {
    id: "m2",
    name: "Vikram Singh Chauhan",
    business: "Chauhan Realty Group",
    category: "Real Estate",
    city: "Jaipur",
    services: ["Residential Projects", "Commercial Leasing", "Land Advisory"],
    email: "vikram@chauhanrealty.com",
    phone: "+91 98290 22222",
    address: "C-Scheme, Jaipur, Rajasthan",
    initials: "VC",
    featured: true,
  },
  {
    id: "m3",
    name: "Aditya Pratap Sisodia",
    business: "Sisodia Capital Advisors",
    category: "Finance",
    city: "Mumbai",
    services: ["Wealth Management", "Tax Planning", "Investment Advisory"],
    email: "aditya@sisodiacapital.com",
    phone: "+91 98200 33333",
    address: "Bandra Kurla Complex, Mumbai",
    initials: "AS",
  },
  {
    id: "m4",
    name: "Karan Singh Shekhawat",
    business: "Shekhawat Tech Labs",
    category: "Technology",
    city: "Bengaluru",
    services: ["SaaS Products", "AI Consulting", "Custom Software"],
    email: "karan@shekhawatlabs.io",
    phone: "+91 99000 44444",
    address: "Koramangala, Bengaluru",
    initials: "KS",
    featured: true,
  },
  {
    id: "m5",
    name: "Mahipal Singh Tanwar",
    business: "Tanwar Retail House",
    category: "Retail",
    city: "Udaipur",
    services: ["Fashion Retail", "Franchise Network", "Distribution"],
    email: "mahipal@tanwarretail.in",
    phone: "+91 98290 55555",
    address: "Lake City, Udaipur",
    initials: "MT",
  },
  {
    id: "m6",
    name: "Devendra Singh Bhati",
    business: "Bhati Trading Co.",
    category: "Trading",
    city: "Ahmedabad",
    services: ["Bulk Commodities", "B2B Sourcing", "Logistics"],
    email: "devendra@bhatitrading.com",
    phone: "+91 98250 66666",
    address: "SG Highway, Ahmedabad",
    initials: "DB",
  },
  {
    id: "m7",
    name: "Yashraj Singh Thakor",
    business: "Thakor Business Services",
    category: "Services",
    city: "Surat",
    services: ["Legal Advisory", "Business Setup", "Compliance"],
    email: "yashraj@thakorservices.com",
    phone: "+91 98250 77777",
    address: "Vesu, Surat, Gujarat",
    initials: "YT",
    featured: true,
  },
  {
    id: "m8",
    name: "Bhavya Singh Rao",
    business: "RaoVentures",
    category: "Startups",
    city: "Pune",
    services: ["Startup Incubation", "Seed Investment", "Growth Strategy"],
    email: "bhavya@raoventures.in",
    phone: "+91 98220 88888",
    address: "Hinjewadi, Pune",
    initials: "BR",
  },
  {
    id: "m9",
    name: "Pratap Singh Solanki",
    business: "Solanki Travels & Tours",
    category: "Travel",
    city: "Jaisalmer",
    services: ["Luxury Tours", "Heritage Travel", "Corporate Bookings"],
    email: "pratap@solankitravels.com",
    phone: "+91 98290 99999",
    address: "Jaisalmer, Rajasthan",
    initials: "PS",
  },
  {
    id: "m10",
    name: "Hanwant Singh Parmar",
    business: "Parmar Exports",
    category: "Export/Import",
    city: "Mumbai",
    services: ["Spice Exports", "Textile Trade", "Global Logistics"],
    email: "hanwant@parmarexports.com",
    phone: "+91 98200 12121",
    address: "Nhava Sheva, Mumbai",
    initials: "HP",
  },
];