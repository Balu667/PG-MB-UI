export interface Room {
  id: string;
  roomNo: string;
  floor: string;
  status: "Available" | "Partial" | "Filled";
  deposit: number;
  totalBeds: number;
  vacantBeds: number;
  occupiedBeds: number;
  noticeBeds: number;
  bookingBeds: number;
  bedBreakdown: Room["bedBreakdown"]; // alias
}

export const mockRooms: Room[] = Array.from({ length: 15 }).map((_, i) => {
  const total = (i % 5) + 2; // 2‑6 beds
  const occupied = i % total;
  const vacant = total - occupied;
  return {
    id: `R${i}`,
    roomNo: `${101 + i}`,
    floor: `${Math.floor(i / 5) + 1}st Floor`,
    status: occupied === 0 ? "Available" : occupied === total ? "Filled" : "Partial",
    deposit: 5000 + i * 1000,
    totalBeds: total,
    vacantBeds: vacant,
    occupiedBeds: occupied,
    noticeBeds: 0,
    bookingBeds: 0,
    bedBreakdown: {
      totalBeds: total,
      vacantBeds: vacant,
      occupiedBeds: occupied,
      noticeBeds: 0,
      bookingBeds: 0,
    },
  };
});
