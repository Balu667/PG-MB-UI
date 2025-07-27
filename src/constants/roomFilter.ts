// ---------------------------------------------------------------------------
//  Room‑tab filter shape + pristine value
// ---------------------------------------------------------------------------

/**
 * – Extend or tweak later if you add new controls in the FilterSheet
 *   (e.g. price range, room size, etc.).
 */
export interface RoomFilter {
  status: ("Available" | "Partial" | "Filled")[];
  sharing: number[];
  floor: ("GF" | `${number}F`)[];
  facilities: ("AC" | "Geyser" | "WM" | "WiFi" | "TV" | "Furnished")[];
}

/** The “empty” state used for “Clear all” and initial mount */
export const emptyFilter: RoomFilter = {
  status: [],
  sharing: [],
  floor: [],
  facilities: [],
};
