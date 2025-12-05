import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Linking } from "react-native";
import Constants from "expo-constants";

// For Expo SDK 49+, use expoConfig; for older SDKs, use manifest
const { apiUrl, fileUrl } = (Constants as any).expoConfig?.extra || {};

// Types
export interface FetchParams {
  baseUrl?: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  isAuthRequired?: boolean;
}

export interface Tenant {
  tenantStatus: number;
}

export interface BedData {
  _id: string;
  tenantsPerBed: Tenant[];
}

export interface RoomTenantData extends BedData {}

export async function fetchData<T = any>({
  baseUrl = apiUrl,
  url,
  method = "GET",
  body,
  headers,
  isAuthRequired = true,
}: FetchParams): Promise<T> {
  const token = await AsyncStorage.getItem("userToken");
  url = baseUrl + url;

  // Check if body is FormData - don't set Content-Type for FormData
  // The browser/RN will automatically set it with proper boundary
  const isFormData = body instanceof FormData;

  const fetchHeaders: Record<string, string> = {
    ...(headers || {}),
    ...(isAuthRequired && token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    fetchHeaders["Content-Type"] = "application/json";
  }

  const fetchObject: RequestInit = {
    method,
    headers: fetchHeaders,
    body: body,
  };
  try {
    const response = await fetch(url, fetchObject);
    const data = await response.json();
    if ([400, 401, 500].includes(response.status)) {
      throw new Error(data.errorMessage || "Unknown error occurred");
    }

    return data || {};
  } catch (error: any) {
    throw error;
  }
}

// Extract initials from sentence
export function extractAndAddFirstLetters(sentence: string): string {
  return sentence
    .split(" ")
    .map((word) => word[0])
    .join("");
}

// Room status based on beds and tenants
export function getRoomStatus(beds: number, tenantData: BedData[]): string {
  let tenants = 0;
  tenantData?.forEach((item) => {
    const active = item.tenantsPerBed.filter(
      (t) => t.tenantStatus === 1 || t.tenantStatus === 3
    );
    tenants += active.length;
  });

  if (tenants >= beds) return "Filled";
  if (tenants === 0) return "Available";
  return "Partially Filled";
}

// Advanced room status
export function getAdvRoomStatus(status: number): string | undefined {
  const statusMap: Record<number, string> = {
    3: "Active",
    5: "Expired",
    6: "Cancelled",
  };
  return statusMap[status];
}

// Date range check
export function isBookingDateInRange(
  bookingDate: string,
  fromDate?: string,
  toDate?: string
): boolean {
  const date = new Date(bookingDate);
  return fromDate
    ? date >= new Date(fromDate) && (!toDate || date <= new Date(toDate))
    : true;
}

// Bed status
export function getBedStatus(
  bedNumber: string,
  roomTenantData: RoomTenantData[]
): string {
  const bed = roomTenantData?.find((b) => b?._id === bedNumber);
  if (!bed) return "Available";

  for (const tenant of bed.tenantsPerBed) {
    if (tenant.tenantStatus === 1) return "Filled";
    if (tenant.tenantStatus === 3) return "AdvBooked";
    if (tenant.tenantStatus === 2) return "UnderNotice";
  }

  return "Available";
}

// Booking status placeholder
export function getBookingStatus(): string | undefined {
  return undefined; // Implement as needed
}

// Open buffer file in a new tab (Web only)
export const openFileInNewTab = (
  bufferData: BlobPart,
  mimeType: string
): void => {
  if (Platform.OS === "web") {
    const blob = new Blob([bufferData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
};

// Open file URL
export const openFileUrlInNewTab = async (url: string): Promise<void> => {
  const fullUrl = fileUrl + url;
  await Linking.openURL(fullUrl);
};

// Month date range
export function getMonthDateRange(
  months: number[],
  year: number = new Date().getFullYear()
): { month: number; startDate: string; endDate: string }[] {
  return months.map((month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      month,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  });
}

// Get total days in a month
export function getTotalDaysFromDate(dateString: string): number {
  const date = new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Get remaining days in a month
export function getRemainingDaysInMonth(dateString: string): number {
  const date = new Date(dateString);
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return total - date.getDate() + 1;
}

// Format currency for Indian locale
export function formatToIndianCurrency(number: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(number);
}
