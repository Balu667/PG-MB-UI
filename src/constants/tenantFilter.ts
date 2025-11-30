// src/constants/tenantFilter.ts
export interface TenantFilter {
  sharing: number[];
  // include all status labels you show in the UI + "Dues" as a pseudo-status
  status: (
    | "Active"
    | "Under Notice"
    | "Adv Booking"
    | "Expired Booking"
    | "Canceled Booking"
    | "Dues"
  )[];
  fromDate?: Date;
  toDate?: Date;
  // align with TenantsTab UI strings
  downloadedApp: ("App Downloaded" | "App Not Downloaded")[];
}

export const emptyTenantFilter: TenantFilter = {
  sharing: [],
  status: [],
  fromDate: undefined,
  toDate: undefined,
  downloadedApp: [],
};
