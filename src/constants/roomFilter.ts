// src/constants/roomFilter.ts
export interface RoomFilter {
  status: ("Available" | "Partial" | "Filled")[];
  sharing: number[];
  /** Floor labels like "GF", "1F", "2F", etc. */
  floor: string[];
  /** Loosened to support canonical API keys like 'washingMachine', 'wifi', 'hotWater', etc. */
  facilities: string[];
}

/** The “empty” state used for “Clear all” and initial mount */
export const emptyFilter: RoomFilter = {
  status: [],
  sharing: [],
  floor: [],
  facilities: [],
};
