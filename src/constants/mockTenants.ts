export interface Tenant {
  id: string;
  name: string;
  phone: string;
  room: string;
  rent: number;
  status: "Active" | "Dues" | "Under Notice";
  sharing: number;
  dues: number;
  joinedOn: string;
  downloadedApp: boolean;
  imageUri?: string;
}

export const mockTenants: Tenant[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `tenant_${i + 1}`,
  name: `Tenant ${i + 1}`,
  phone: `98765432${10 + i}`,
  room: `10${i % 5}`,
  rent: 5000 + i * 200,
  status: i % 3 === 0 ? "Active" : i % 3 === 1 ? "Dues" : "Under Notice",
  sharing: (i % 5) + 1,
  dues: i % 3 === 1 ? 15000 : 0,
  joinedOn: `2024-0${(i % 9) + 1}-0${(i % 9) + 1}`,
  downloadedApp: i % 2 === 0,
  imageUri: "https://randomuser.me/api/portraits/men/" + (10 + i) + ".jpg",
}));
