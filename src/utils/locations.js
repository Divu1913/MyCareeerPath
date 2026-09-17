export const LOCATION_HIERARCHY = {
  Maharashtra: {
    Amravati: ["Amravati", "Achalpur", "Chandur Bazar"],
    Mumbai: ["Mumbai", "Andheri", "Borivali"],
    Nagpur: ["Nagpur", "Kamptee", "Hingna"],
    Pune: ["Pune", "Pimpri-Chinchwad", "Hinjewadi"],
    Nashik: ["Nashik", "Igatpuri", "Sinnar"],
  },
  Karnataka: {
    Bengaluru: ["Bengaluru", "Whitefield", "Electronic City"],
    Mysuru: ["Mysuru", "Nanjangud", "Hunsur"],
    Mangaluru: ["Mangaluru", "Udupi", "Surathkal"],
  },
  Delhi: {
    Delhi: ["New Delhi", "Dwarka", "Rohini"],
  },
  Gujarat: {
    Ahmedabad: ["Ahmedabad", "Gandhinagar", "Sanand"],
    Surat: ["Surat", "Adajan", "Vesu"],
  },
  Telangana: {
    Hyderabad: ["Hyderabad", "Secunderabad", "Gachibowli"],
  },
  "Uttar Pradesh": {
    Lucknow: ["Lucknow", "Gomti Nagar", "Malihabad"],
    Noida: ["Noida", "Greater Noida", "Dadri"],
  },
};

export const LOCATION_STATES = Object.keys(LOCATION_HIERARCHY);
