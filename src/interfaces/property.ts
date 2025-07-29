export interface PGMetadata {
  advancedBookings: number;
  dues: number;
  expenses: number;
  income: number;
  occupiedBeds: number;
  totalBeds: number;
  totalRooms: number;
  underNotice: number;
  vacantBeds: number;
}

export interface PGNotifications {
  sms: boolean;
  whatsapp: boolean;
}

export interface PGImage {
  url: string; // Adjust if your object structure has more fields
  label?: string;
}

export interface PGProperty {
  _id: string;
  area: string;
  city: string;
  country: string;
  createdBy: string;
  doorNo: string;
  facilities: string[]; // Assuming array of strings
  images: PGImage[]; // If images are object-based
  landmark: string;
  mealType: "Both" | "Veg" | "Non-Veg"; // Add other options as union
  metadata: PGMetadata;
  noticePeriod: string;
  notifications: PGNotifications;
  ownerId: string;
  pincode: string;
  propertyId: string;
  propertyName: string;
  staff: string[]; // Adjust if staff has objects instead
  state: string;
  streetName: string;
  tenantType: "Male" | "Female" | "Co-living"; // Extend as needed
}
