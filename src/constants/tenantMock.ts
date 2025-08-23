// src/constants/tenantMock.ts
import { mockTenants, Tenant } from "./mockTenants";
import { hexToRgba } from "@/src/theme";

// Local mutable store (demo only)
let TENANTS = [...mockTenants];

export type RoomOption = { label: string; value: string; dotColor: string };

// Simple room set with availability; in real app, fetch from API
const ROOM_DB = Array.from({ length: 12 }).map((_, i) => {
  const roomNo = `${101 + i}`;
  const totalBeds = (i % 4) + 2; // 2..5
  const occupied = i % (totalBeds + 1);
  const available = totalBeds - occupied;
  const status: "available" | "partial" | "filled" =
    occupied === 0 ? "available" : available === 0 ? "filled" : "partial";
  return { roomNo, totalBeds, occupied, status };
});

export const getRooms = (colors: any): RoomOption[] => {
  return ROOM_DB.map((r) => ({
    label: `${r.roomNo} (${r.totalBeds}-Sharing)`,
    value: r.roomNo,
    dotColor: r.status === "available" ? colors.availableBeds : colors.filledBeds, // green vs red
  }));
};

export const getBedsForRoom = (roomNo: string): { label: string; value: string }[] => {
  const r = ROOM_DB.find((x) => x.roomNo === roomNo);
  const count = r?.totalBeds ?? 0;
  return Array.from({ length: count }, (_, j) => {
    const label = String.fromCharCode(65 + j);
    return { label, value: label };
  });
};

export const getTenantById = (id: string) => TENANTS.find((t) => t.id === id);

export const createTenant = (data: {
  name: string;
  phone: string;
  joinedOn: string;
  gender: "Male" | "Female";
  room: string;
  bedNo: string;
  rent: number;
  securityDeposit: number;
  email?: string;
}) => {
  const id = `tenant_${Math.random().toString(36).slice(2, 8)}`;
  const newTenant: Tenant = {
    id,
    name: data.name,
    phone: data.phone,
    room: data.room,
    bedNo: data.bedNo,
    rent: data.rent,
    securityDeposit: data.securityDeposit,
    status: "Active",
    sharing: ROOM_DB.find((r) => r.roomNo === data.room)?.totalBeds || 2,
    dues: 0,
    joinedOn: data.joinedOn,
    downloadedApp: false,
    noticePeriod: 30,
    email: data.email,
    gender: data.gender,
    imageUri: "https://randomuser.me/api/portraits/men/30.jpg",
  };
  TENANTS.unshift(newTenant);
  return id;
};

export const updateTenant = (id: string, patch: Partial<Tenant>) => {
  TENANTS = TENANTS.map((t) => (t.id === id ? { ...t, ...patch } : t));
};

export const deleteTenant = (id: string) => {
  TENANTS = TENANTS.filter((t) => t.id !== id);
};
