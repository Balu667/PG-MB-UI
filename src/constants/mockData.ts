// src/constants/mockData.ts
export interface PropertyItem {
  _id: string;
  propertyName: string;
  area: string;
  city: string;
  floors: number;
  image: string;
  metadata: {
    totalRooms: number;
    totalBeds: number;
    vacantBeds: number;
    occupiedBeds: number;
    advancedBookings: number;
    underNotice: number;
    income: number;
    expenses: number;
    dues: number;
  };
}

/* ---------- two sample properties ---------- */
export const pgProperties: PropertyItem[] = [
  {
    _id: "prop‑01",
    propertyName: "MJR Mens PG",
    area: "Madhapur",
    city: "Hyderabad",
    floors: 5,
    image: "https://images.unsplash.com/photo-1550966871‑3ed3cdb5ed23?fit=crop&w=800&q=80",
    metadata: {
      totalRooms: 15,
      totalBeds: 120,
      vacantBeds: 10,
      occupiedBeds: 100,
      advancedBookings: 2,
      underNotice: 1,
      income: 150000,
      expenses: 50000,
      dues: 20000,
    },
  },
  {
    _id: "prop‑02",
    propertyName: "Hanuman Gen's PG",
    area: "BTM Layout",
    city: "Bangalore Urban",
    floors: 3,
    image: "https://images.unsplash.com/photo-1570129477492‑45c003edd2be?fit=crop&w=800&q=80",
    metadata: {
      totalRooms: 12,
      totalBeds: 96,
      vacantBeds: 4,
      occupiedBeds: 90,
      advancedBookings: 0,
      underNotice: 2,
      income: 110000,
      expenses: 45000,
      dues: 4000,
    },
  },
];
