import { Staff, Room, Shift, Assignment } from "./types";

export const DEFAULT_STAFF: Staff[] = [
  { id: "S01", name: "佐藤 一郎", phone: "090-1111-2222" },
  { id: "S02", name: "鈴木 美咲", phone: "090-3333-4444" },
  { id: "S03", name: "高橋 健太", phone: "090-5555-6666" },
  { id: "S04", name: "田中 裕子", phone: "090-7777-8888" },
  { id: "S05", name: "伊藤 修二", phone: "090-9999-0000" },
];

export const DEFAULT_ROOMS: Room[] = [
  { number: "201", defaultPrice: 1200 },
  { number: "202", defaultPrice: 1200 },
  { number: "203", defaultPrice: 1200 },
  { number: "205", defaultPrice: 1350 },
  { number: "301", defaultPrice: 1200 },
  { number: "302", defaultPrice: 1200 },
  { number: "303", defaultPrice: 1200 },
  { number: "305", defaultPrice: 1350 },
  { number: "401", defaultPrice: 1250 },
  { number: "402", defaultPrice: 1250 },
  { number: "403", defaultPrice: 1250 },
  { number: "405", defaultPrice: 1500 },
];

// Helper to generate seed data around today (June 13, 2026)
export function getInitialData() {
  const currentDate = new Date("2026-06-13");
  const shifts: Shift[] = [];
  const assignments: Assignment[] = [];

  // Generate shifts and assignments for the first 15 days of June 2026
  for (let d = 1; d <= 15; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `2026-06-${dayStr}`;

    // On-duty staff varies by day of week
    // d % 3 determines basic roster
    let onDutyIds: string[] = [];
    if (d % 3 === 0) {
      onDutyIds = ["S01", "S02", "S04"];
    } else if (d % 3 === 1) {
      onDutyIds = ["S02", "S03", "S05"];
    } else {
      onDutyIds = ["S01", "S03", "S04", "S05"];
    }

    shifts.push({
      date: dateStr,
      staffIds: onDutyIds,
    });

    // Distribute rooms among on-duty staff
    // 12 rooms: 201, 202, 203, 205, 301, 302, 303, 305, 401, 402, 403, 405
    const rooms = DEFAULT_ROOMS;
    rooms.forEach((room, index) => {
      // Clean almost all rooms on most days, maybe omit 1 or 2 rooms on some days
      if ((d + index) % 10 === 0) {
        return; // skip cleaning this room today
      }

      const staffIndex = (index + d) % onDutyIds.length;
      const staffId = onDutyIds[staffIndex];

      assignments.push({
        id: `A-${dateStr}-${room.number}`,
        date: dateStr,
        roomNumber: room.number,
        staffId: staffId,
        appliedPrice: room.defaultPrice,
      });
    });
  }

  // Also pre-seed a couple of distinct items with a different past rate
  // to prove that change in room pricing doesn't retroactively alter past applied price.
  return {
    staff: DEFAULT_STAFF,
    rooms: DEFAULT_ROOMS,
    shifts,
    assignments,
  };
}
