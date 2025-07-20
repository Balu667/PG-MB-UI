// src/constants/tenantFilter.ts
export interface TenantFilter {
  sharing: number[];
  status: ("Active" | "Dues" | "Under Notice")[];
  fromDate?: Date;
  toDate?: Date;
  downloadedApp: ("Downloaded" | "Not Downloaded")[];
}

export const emptyTenantFilter: TenantFilter = {
  sharing: [],
  status: [],
  fromDate: undefined,
  toDate: undefined,
  downloadedApp: [],
};
