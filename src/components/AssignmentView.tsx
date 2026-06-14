import React, { useState } from "react";
import { Staff, Room, Shift, Assignment } from "../types";
import { 
  Calendar as CalendarIcon, 
  User, 
  Layers, 
  Info, 
  Check, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckSquare, 
  RefreshCw,
  Sliders,
  X
} from "lucide-react";

interface AssignmentViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  staff: Staff[];
  rooms: Room[];
  shifts: Shift[];
  assignments: Assignment[];
  onToggleShift: (date: string, staffId: string) => void;
  onUpdateShifts: (shifts: Shift[]) => void;
  onAssignRoom: (date: string, roomNumber: string, staffId: string) => void;
  onRemoveAssignment: (date: string, roomNumber: string) => void;
  onUpdateAssignments: (assignments: Assignment[]) => void;
}

export const AssignmentView: React.FC<AssignmentViewProps> = ({
  selectedDate,
  setSelectedDate,
  staff,
  rooms,
  shifts,
  assignments,
  onToggleShift,
  onUpdateShifts,
  onAssignRoom,
  onRemoveAssignment,
  onUpdateAssignments,
}) => {
  // Navigation for view mode: 'daily' (assign rooms), 'weekly' (shift matrix), 'monthly' (shift matrix & patterns)
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");

  // State for pop-up room assignments
  const [activeModalDate, setActiveModalDate] = useState<string | null>(null);

  // State for Bulk Weekly Pattern Scheduler
  const [bulkStaffId, setBulkStaffId] = useState<string>("");
  const [bulkDays, setBulkDays] = useState<boolean[]>([false, false, false, false, false, false, false]); // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

  // Get active shift for this date
  const currentShift = shifts.find((s) => s.date === selectedDate);
  const onDutyStaffIds = currentShift ? currentShift.staffIds : [];
  const onDutyStaff = staff.filter((s) => onDutyStaffIds.includes(s.id));

  // Get assignments for this date
  const currentAssignments = assignments.filter((a) => a.date === selectedDate);

  // Group rooms by floors
  const floors = [
    { label: "4F", roomNumbers: ["401", "402", "403", "405"] },
    { label: "3F", roomNumbers: ["301", "302", "303", "305"] },
    { label: "2F", roomNumbers: ["201", "202", "203", "205"] },
  ];

  // Format currency
  const formatYen = (num: number) => `¥${num.toLocaleString("ja-JP")}`;

  // Helper selectors for dates
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const getWeekDayJP = (dateStr: string) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : days[d.getDay()];
  };

  // Compute dynamic daily reward and assigned count for the sidebar KPI card
  const dailyTotalReward = currentAssignments.reduce((sum, curr) => sum + curr.appliedPrice, 0);

  // Helper to generate initials fallback for avatar
  const getInitials = (name: string) => {
    if (!name) return "??";
    const cleanName = name.replace(/\s+/g, "");
    if (cleanName.length <= 2) return cleanName;
    return cleanName.substring(0, 2);
  };

  // Helper to get a stable light color class based on ID
  const getAvatarColor = (id: string) => {
    const colours = [
      { bg: "bg-blue-50 text-blue-600 border-blue-150", text: "text-blue-700" },
      { bg: "bg-purple-50 text-purple-600 border-purple-150", text: "text-purple-700" },
      { bg: "bg-amber-50 text-amber-600 border-amber-150", text: "text-amber-700" },
      { bg: "bg-emerald-50 text-emerald-600 border-emerald-150", text: "text-emerald-700" },
      { bg: "bg-pink-50 text-pink-600 border-pink-150", text: "text-pink-700" },
    ];
    const index = id.charCodeAt(id.length - 1) % colours.length;
    return colours[index];
  };

  // --- WEEKLY SHIFT HELPERS ---
  // Calculates the 7 days (Mon-Sun) of the week containing the selection date
  const getWeekDays = (baseDateStr: string) => {
    const baseDate = new Date(baseDateStr);
    const day = baseDate.getDay();
    // Adjust selector to make Monday index 0 (getDay: 0 for Sun, 1 for Mon ... 6 for Sat)
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + mondayOffset);

    const daysList: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      daysList.push(`${yyyy}-${mm}-${dd}`);
    }
    return daysList;
  };

  // Toggles shift state specifically for a specific date
  const toggleShiftForDate = (dateStr: string, staffId: string) => {
    onToggleShift(dateStr, staffId);
  };

  // Bulk Apply options for a staff within the active week
  const applyWeekBulkStatus = (staffId: string, type: "all-work" | "all-off" | "weekdays-only") => {
    const days = getWeekDays(selectedDate);
    const updatedShifts = [...shifts];

    days.forEach((dateStr) => {
      const d = new Date(dateStr);
      const dayIdx = d.getDay(); // 0 is Sun, 1-5 is Mon-Fri, 6 is Sat
      const isWeekday = dayIdx >= 1 && dayIdx <= 5;

      let shouldWork = false;
      if (type === "all-work") shouldWork = true;
      if (type === "weekdays-only" && isWeekday) shouldWork = true;

      const shiftIndex = updatedShifts.findIndex((s) => s.date === dateStr);

      if (shiftIndex >= 0) {
        const shiftObj = updatedShifts[shiftIndex];
        let updatedStaffIds = [...shiftObj.staffIds];

        if (shouldWork) {
          if (!updatedStaffIds.includes(staffId)) updatedStaffIds.push(staffId);
        } else {
          // Safeguard: Check if assignments exist
          const hasAssignment = assignments.some((a) => a.date === dateStr && a.staffId === staffId);
          if (!hasAssignment) {
            updatedStaffIds = updatedStaffIds.filter((id) => id !== staffId);
          }
        }
        updatedShifts[shiftIndex] = { ...shiftObj, staffIds: updatedStaffIds };
      } else if (shouldWork) {
        updatedShifts.push({
          date: dateStr,
          staffIds: [staffId],
        });
      }
    });

    onUpdateShifts(updatedShifts);
  };

  // --- MONTHLY SHIFT HELPERS ---
  // Calculates all day dates belonging to selectedDate's month
  const getMonthDays = (baseDateStr: string) => {
    const baseDate = new Date(baseDateStr);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth(); // 0-indexed
    const lastDay = new Date(year, month + 1, 0).getDate();

    const daysList: string[] = [];
    for (let i = 1; i <= lastDay; i++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(i).padStart(2, "0");
      daysList.push(`${year}-${mm}-${dd}`);
    }
    return daysList;
  };

  // Shift whole week or month selections
  const navigateWeek = (direction: number) => {
    const base = new Date(selectedDate);
    base.setDate(base.getDate() + direction * 7);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const navigateMonth = (direction: number) => {
    const base = new Date(selectedDate);
    // Add month
    base.setMonth(base.getMonth() + direction);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Bulk Apply a specific weekly day-pattern to the entire selected Month
  const handleApplyPatternToMonth = () => {
    if (!bulkStaffId) {
      alert("スタッフを指定してください。");
      return;
    }

    const hasAnyDayChecked = bulkDays.some((d) => d);
    if (!hasAnyDayChecked) {
      if (!window.confirm("全ての曜日チェックがオフになっています。このスタッフの対象月内のすべてのシフト（清掃割当のない日）が「休み」になりますが、よろしいですか？")) {
        return;
      }
    }

    const targetDates = getMonthDays(selectedDate);
    const updatedShifts = [...shifts];
    let skippedCount = 0;

    targetDates.forEach((dateStr) => {
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay(); // 0: Sun, 1: Mon, ...
      const shouldBeOn = bulkDays[dayOfWeek];

      const shiftIndex = updatedShifts.findIndex((s) => s.date === dateStr);

      if (shiftIndex >= 0) {
        const shiftObj = updatedShifts[shiftIndex];
        let updatedStaffIds = [...shiftObj.staffIds];

        if (shouldBeOn) {
          if (!updatedStaffIds.includes(bulkStaffId)) {
            updatedStaffIds.push(bulkStaffId);
          }
        } else {
          // If staff is turned OFF, check if they have active assignments on that day first
          const hasActiveAssignments = assignments.some(
            (a) => a.date === dateStr && a.staffId === bulkStaffId
          );
          if (hasActiveAssignments) {
            skippedCount++; // Skip turning off because of active room chores
          } else {
            updatedStaffIds = updatedStaffIds.filter((id) => id !== bulkStaffId);
          }
        }
        updatedShifts[shiftIndex] = { ...shiftObj, staffIds: updatedStaffIds };
      } else if (shouldBeOn) {
        updatedShifts.push({
          date: dateStr,
          staffIds: [bulkStaffId],
        });
      }
    });

    onUpdateShifts(updatedShifts);

    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const activeDayLabels = dayNames.filter((_, idx) => bulkDays[idx]).join("・");
    
    let infoMsg = `「${staff.find((s) => s.id === bulkStaffId)?.name}」様の曜日別パターン [${activeDayLabels || "休み"}] を、選択された月へ一括適用しました。`;
    if (skippedCount > 0) {
      infoMsg += `\n※ なお、すでに客室清掃に割り当てのあった ${skippedCount} 日間については、割当を保護するためシフトONのまま据え置かれました。`;
    }
    alert(infoMsg);
  };

  const getDayNamesForChecks = ["日", "月", "火", "水", "木", "金", "土"];

  // ==========================================================
  // 【新機能】登録希望に基づくシフト自動作成 (週別・月別) ＆ 部屋自動割当
  // ==========================================================

  // 今週のシフト自動作成
  const handleAutoCreateWeeklyShift = () => {
    const weekdays = getWeekDays(selectedDate);
    const updatedShifts = [...shifts];

    weekdays.forEach((dateStr) => {
      const d = new Date(dateStr);
      const dayOfWeekIdx = d.getDay(); // 0: 日, 1: 月, ... 6: 土

      const availableStaffIds = staff.filter((s) => {
        const desire = s.weeklyDesire || [true, true, true, true, true, true, true];
        const wantsToWork = desire[dayOfWeekIdx] !== false;
        const isOff = s.specificOffs?.includes(dateStr);
        return wantsToWork && !isOff;
      }).map((s) => s.id);

      const shiftIndex = updatedShifts.findIndex((s) => s.date === dateStr);
      if (shiftIndex >= 0) {
        const existingShift = updatedShifts[shiftIndex];
        const activeAssignments = assignments.filter((a) => a.date === dateStr).map((a) => a.staffId);
        const newStaffIds = Array.from(new Set([...availableStaffIds, ...activeAssignments]));
        updatedShifts[shiftIndex] = { ...existingShift, staffIds: newStaffIds };
      } else {
        updatedShifts.push({
          date: dateStr,
          staffIds: availableStaffIds,
        });
      }
    });

    onUpdateShifts(updatedShifts);
    alert("各スタッフの「シフト希望スケジュール（曜日固定・特定休）」を適用し、この一週間の出勤メンバーシフトを自動編成しました！");
  };

  // 今月のシフト自動作成
  const handleAutoCreateMonthlyShift = () => {
    const monthDays = getMonthDays(selectedDate);
    const updatedShifts = [...shifts];

    monthDays.forEach((dateStr) => {
      const d = new Date(dateStr);
      const dayOfWeekIdx = d.getDay(); // 0: 日, 1: 月, ... 6: 土

      const availableStaffIds = staff.filter((s) => {
        const desire = s.weeklyDesire || [true, true, true, true, true, true, true];
        const wantsToWork = desire[dayOfWeekIdx] !== false;
        const isOff = s.specificOffs?.includes(dateStr);
        return wantsToWork && !isOff;
      }).map((s) => s.id);

      const shiftIndex = updatedShifts.findIndex((s) => s.date === dateStr);
      if (shiftIndex >= 0) {
        const existingShift = updatedShifts[shiftIndex];
        const activeAssignments = assignments.filter((a) => a.date === dateStr).map((a) => a.staffId);
        const newStaffIds = Array.from(new Set([...availableStaffIds, ...activeAssignments]));
        updatedShifts[shiftIndex] = { ...existingShift, staffIds: newStaffIds };
      } else {
        updatedShifts.push({
          date: dateStr,
          staffIds: availableStaffIds,
        });
      }
    });

    onUpdateShifts(updatedShifts);
    alert(`${selectedDate.split("-")[1]}月の全日程について、登録された従業員の出勤希望曜日・特定希望休を評価し、シフトスケジュール表を1タップ自動作成しました！`);
  };

  // 本日出勤スタッフによる12部屋均等自動部屋割り (自動決定)
  const handleAutoAssignRooms = () => {
    if (onDutyStaff.length === 0) {
      alert("本日の出勤スタッフが1人も設定されていません。\n左側の「本日出勤スタッフ」から出勤メンバーを登録するか、シフトを自動作成した後に実行してください。");
      return;
    }

    if (!window.confirm("本日の出勤スタッフのみなさんに、全12室の清掃担当を均等に自動割り当てします。すでに入力済みの本日の部屋割り担当は上書きされますがよろしいですか？")) {
      return;
    }

    // 本日以外のアサインをコピーして残す
    let updatedAssignments = assignments.filter((a) => a.date !== selectedDate);

    // 12つの清掃部屋
    const allRooms = [
      "201", "202", "203", "205",
      "301", "302", "303", "305",
      "401", "402", "403", "405"
    ];

    allRooms.forEach((roomNo, index) => {
      const staffIdx = index % onDutyStaff.length;
      const assignedStaff = onDutyStaff[staffIdx];
      const roomObj = rooms.find((r) => r.number === roomNo);
      const appliedPrice = roomObj ? roomObj.defaultPrice : 1200;

      updatedAssignments.push({
        id: `A-${selectedDate}-${roomNo}-${Date.now()}-${index}`,
        date: selectedDate,
        roomNumber: roomNo,
        staffId: assignedStaff.id,
        appliedPrice,
      });
    });

    onUpdateAssignments(updatedAssignments);
    alert(`本日の出勤スタッフ ${onDutyStaff.length}名 に、全12部屋の清掃割り当て（1人あたり平均 ${Math.round(12 / onDutyStaff.length * 10) / 10}部屋）を自動的に均等に決定しました！`);
  };

  return (
    <div className="space-y-6" id="assignment-module-root">
      
      {/* ビュー切り替えナビゲーションバー */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1.5" id="view-mode-selectors">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "daily"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            日別客室割当 &amp; 出勤
          </button>
          
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "weekly"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            週別シフト表
          </button>

          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "monthly"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            月別シフト &amp; 一括適用ツール
          </button>
        </div>

        {/* クイックガイド */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-medium px-3 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span>データは連動：週・月でシフトを組むと、日別の割当にリアルタイム反映されます。</span>
        </div>
      </div>

      {/* ==================== 1. DAILY MOVEMENT (ROOM ASSIGNMENT) ==================== */}
      {viewMode === "daily" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="assignment-view-container">
          {/* 1. 左側: 日付・出勤スタッフ管理 */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6" id="left-shift-ctrl-panel">
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => shiftDate(-1)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-100 transition-colors cursor-pointer"
                  id="prev-day-btn"
                  title="前日"
                >
                  <span className="sr-only">前日</span>
                  &larr;
                </button>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold font-display">
                    {selectedDate.split("-")[0]}年 {selectedDate.split("-")[1]}月
                  </p>
                  <p className="text-base font-bold text-slate-800">
                    {selectedDate.split("-")[2]}日 ({getWeekDayJP(selectedDate)})
                  </p>
                </div>
                <button
                  onClick={() => shiftDate(1)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-100 transition-colors cursor-pointer"
                  id="next-day-btn"
                  title="翌日"
                >
                  <span className="sr-only">翌日</span>
                  &rarr;
                </button>
              </div>

              {/* カレンダー入力 & 今日ボタン */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                    id="calendar-input-field"
                  />
                </div>
                <button
                  onClick={() => {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, "0");
                    const dd = String(today.getDate()).padStart(2, "0");
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs border border-indigo-100/40 transition-all cursor-pointer whitespace-nowrap flex items-center"
                  id="today-btn"
                >
                  今日に戻る
                </button>
              </div>
            </div>

            {/* 本日の総報酬/状況 */}
            <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-150 space-y-1">
              <p className="text-[11px] opacity-75 font-semibold tracking-wide">本日の総報酬 (確定実績)</p>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono">{formatYen(dailyTotalReward)}</span>
                  <span className="text-[11px] opacity-60">/ 日次</span>
                </div>
                <span className="text-xs bg-indigo-500/40 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-bold">
                  {currentAssignments.length} / 12部屋 割当済
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 出勤登録セクション */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  本日出勤スタッフ
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  出勤中: {onDutyStaff.length}名
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                チェックを入れて本日出勤にする（他の曜日でのシフトは上部の<b>「週別」「月別」</b>からまとめて組むことができます）。
              </p>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1" id="staff-attendance-checklist">
                {staff.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    スタッフが登録されていません。
                    <br />
                    マスタ設定から登録してください。
                  </div>
                ) : (
                  staff.map((s) => {
                    const isWorking = onDutyStaffIds.includes(s.id);
                    const hasAssignedRooms = currentAssignments.some((a) => a.staffId === s.id);
                    const avatarColors = getAvatarColor(s.id);

                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isWorking
                            ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/5"
                            : "bg-slate-50/70 border-slate-100/80 hover:bg-slate-50 text-slate-500 opacity-60"
                        }`}
                        id={`staff-duty-checkbox-label-${s.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isWorking}
                            onChange={() => onToggleShift(selectedDate, s.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                            id={`staff-duty-checkbox-${s.id}`}
                          />
                          
                          {/* Avatar fallback */}
                          <div className={`w-8 h-8 rounded-lg ${avatarColors.bg} border flex items-center justify-center font-bold text-xs uppercase shrink-0`}>
                            {getInitials(s.name)}
                          </div>

                          <div>
                            <span className="text-sm font-semibold text-slate-700 block">{s.name}</span>
                            {s.phone && <span className="text-[10px] font-mono text-slate-400">{s.phone}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {hasAssignedRooms && isWorking && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-bold">
                              割当あり
                            </span>
                          )}
                          
                          {isWorking ? (
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">休み</span>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 2. 右側: 客室への清掃割りあて */}
          <div className="lg:col-span-8 bg-slate-100/70 rounded-2xl border border-slate-200/60 p-6 space-y-6" id="right-room-assignment-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  清掃割り当て <span className="text-sm font-normal text-slate-400">{selectedDate.replace(/-/g, "/")} ({getWeekDayJP(selectedDate)})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  各部屋の担当スタッフを選択します。その日出勤しているスタッフのみプルダウンから割り当てに選択可能です。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleAutoAssignRooms}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100 cursor-pointer whitespace-nowrap"
                  title="本日の出勤スタッフで全12室を均等にアサインします。"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  本日部屋割りを自動決定
                </button>
                <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-3xs font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  割当済: {currentAssignments.length}部屋
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-650 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-3xs font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                  未割当: {Math.max(0, 12 - currentAssignments.length)}部屋
                </span>
              </div>
            </div>

            {/* 部屋一覧 (フロア別) */}
            <div className="space-y-6" id="floors-assignment-wrapper">
              {floors.map((floor) => {
                return (
                  <div
                    key={floor.label}
                    className="space-y-3"
                    id={`floor-${floor.label}-container`}
                  >
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span>{floor.label} Rooms</span>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </h4>

                    {/* この階の部屋 4部屋グリッド */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id={`floor-${floor.label}-grid`}>
                      {floor.roomNumbers.map((roomNo) => {
                        const roomObj = rooms.find((r) => r.number === roomNo) || {
                          number: roomNo,
                          defaultPrice: 1200,
                        };
                        const assignment = currentAssignments.find((a) => a.roomNumber === roomNo);
                        const isSuite = roomNo === "405";

                        return (
                          <div
                            key={roomNo}
                            className={`room-card bg-white rounded-2xl p-4 flex flex-col justify-between h-36 ${
                              assignment
                                ? isSuite
                                  ? "border-2 border-indigo-200 ring-4 ring-indigo-50"
                                  : "border-indigo-100 shadow-sm"
                                : "opacity-90 hover:opacity-100"
                            }`}
                            id={`room-card-${roomNo}`}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-xl font-extrabold ${assignment && isSuite ? "text-indigo-600" : "text-slate-800"}`}>
                                  {roomNo}
                                </span>
                                
                                <span className={`reward-badge px-2 py-0.5 rounded-md text-[10px] font-bold ${isSuite ? "bg-indigo-50 text-indigo-700 border-indigo-100" : ""}`}>
                                  {formatYen(roomObj.defaultPrice)}
                                </span>
                              </div>
                              
                              <p className={`text-[9px] font-bold uppercase mb-3 tracking-wider ${isSuite ? "text-indigo-400" : "text-slate-400"}`}>
                                {isSuite ? "Suite Room (Corner)" : "Standard Twin"}
                              </p>
                            </div>

                            {/* 担当清掃員 セレクター */}
                            <div>
                              <select
                                value={assignment ? assignment.staffId : ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "") {
                                    onRemoveAssignment(selectedDate, roomNo);
                                  } else {
                                    onAssignRoom(selectedDate, roomNo, val);
                                  }
                                }}
                                className={`w-full text-xs p-2 rounded-lg border outline-none font-medium transition-all ${
                                  assignment
                                    ? isSuite
                                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold focus:ring-2 focus:ring-indigo-500/20"
                                      : "border-slate-200 bg-indigo-50/50 text-indigo-900 font-semibold focus:ring-2 focus:ring-indigo-500/10"
                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                }`}
                                id={`room-select-${roomNo}`}
                              >
                                <option value="">-- 未割当 --</option>
                                {onDutyStaff.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 適用単価の履歴表示 */}
                            {assignment && (
                              <div className="text-[9px] text-slate-400 font-mono text-right mt-1.5">
                                適用単価: {formatYen(assignment.appliedPrice)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 出勤なし時の美しい警告/案内バナー */}
            {onDutyStaff.length === 0 && (
              <div className="bg-amber-50 border border-amber-200/70 text-amber-900 p-4 rounded-xl flex items-start gap-3 mt-4" id="no-staff-on-duty-warning">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">本日の出勤スタッフが登録されていません</p>
                  <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                    または上部の<b>「週別シフト表」「月別シフト」</b>からあらかじめまとめてスケジュールを登録してください。
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-200/40 p-4 rounded-xl text-xs text-slate-500 flex items-start gap-2.5 leading-relaxed border border-slate-200/30">
              <Info className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <b>部屋単価の永続保持ルール:</b> 担当者を割り当てた瞬間の部屋基本単価が
                報酬履歴（適用単価）として複製保存されます。そのため、後から設定画面で基準単価を
                変更・改定しても、過去の報酬データ（ダッシュボード等での集計額）が不意に書き換わってしまうのを防ぎます。
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. WEEKLY SHIFT PLANNER ==================== */}
      {viewMode === "weekly" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6" id="weekly-shift-panel">
          
          {/* 週ナビゲーションヘッダー */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                週別シフト編成（一括登録グリッド）
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                月曜日から日曜日までの1週間全体のシフトを一括調整。清掃員のスケジュール調整が直感的に行えます。
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* 【新機能】希望ベース自動作成ボタン */}
              <button
                onClick={handleAutoCreateWeeklyShift}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-100 cursor-pointer h-[38px] whitespace-nowrap"
                title="各スタッフが登録している稼働希望（曜日・休み希望）を読み込み、今週のシフトを自動作成します。"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                スタッフ希望から今週のシフトを自動作成
              </button>

              {/* 年週ナビゲーター */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateWeek(-1)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs flex items-center gap-1 font-bold h-[38px]"
                  title="前の週"
                >
                  <ChevronLeft className="w-4 h-4" />
                  先週
                </button>
                
                <div className="bg-slate-100/80 border border-slate-200 px-4 py-2 rounded-xl text-center font-mono font-bold text-xs text-slate-700 min-w-[180px] h-[38px] flex items-center justify-center">
                  {getWeekDays(selectedDate)[0].replace(/-/g, "/")} 〜 {getWeekDays(selectedDate)[6].split("-")[2]}日
                </div>

                <button
                  onClick={() => navigateWeek(1)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs flex items-center gap-1 font-bold h-[38px]"
                  title="次の週"
                >
                  翌週
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 週別マトリクス */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4.5 px-4 sticky left-0 bg-slate-50 z-10 w-[180px] shadow-sm">清掃スタッフ氏名</th>
                  {getWeekDays(selectedDate).map((dayStr) => {
                    const d = new Date(dayStr);
                    const weekName = getWeekDayJP(dayStr);
                    const isToday = dayStr === new Date().toISOString().split("T")[0];
                    const isSelected = dayStr === selectedDate;
                    const dayAssignments = assignments.filter((a) => a.date === dayStr);
                    
                    return (
                      <th
                        key={dayStr}
                        className={`py-3 px-3 text-center border-l border-slate-100 min-w-[105px] ${
                          isSelected ? "bg-indigo-50/50" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-mono text-slate-600 block text-[10px]">
                            {dayStr.split("-")[1]}/{dayStr.split("-")[2]}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                            weekName === "日" ? "text-rose-500 bg-rose-50 font-bold" :
                            weekName === "土" ? "text-blue-500 bg-blue-50 font-bold" : "text-slate-700 font-semibold"
                          }`}>
                            ({weekName})
                          </span>
                          {isToday && (
                            <span className="block text-[8px] bg-indigo-600 text-white font-extrabold rounded transform scale-90 px-1 mx-auto w-max leading-none">
                              TODAY
                            </span>
                          )}
                          <button
                            onClick={() => setActiveModalDate(dayStr)}
                            className="mt-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center gap-1 text-[10px] text-indigo-700 font-bold rounded-lg cursor-pointer border border-indigo-100/40 w-full transition"
                            title={`${dayStr} のクリーニング配属`}
                          >
                            <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>割当 ({dayAssignments.length})</span>
                          </button>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-4.5 px-4 text-center border-l border-slate-100 min-w-[150px]">一括操作アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      スタッフが登録されていません。マスタ設定から先に登録してください。
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => {
                    const weekdays = getWeekDays(selectedDate);
                    // Calculates total work days this week
                    const countWorkDaysThisWeek = weekdays.reduce((sum, dayStr) => {
                      const sh = shifts.find((shObj) => shObj.date === dayStr);
                      return sum + (sh && sh.staffIds.includes(s.id) ? 1 : 0);
                    }, 0);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* 左：名前（スクロール時にも固定で見えるように） */}
                        <td className="py-4 px-4 sticky left-0 bg-white border-r border-slate-100 z-10 font-bold text-slate-755 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800">{s.name}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                              {countWorkDaysThisWeek}日出勤
                            </span>
                          </div>
                        </td>

                        {/* 曜日のトグルボタン */}
                        {weekdays.map((dayStr) => {
                          const sh = shifts.find((shObj) => shObj.date === dayStr);
                          const isWorking = sh ? sh.staffIds.includes(s.id) : false;

                          return (
                            <td
                              key={dayStr}
                              className={`p-2 text-center border-l border-slate-100 transition-colors ${
                                dayStr === selectedDate ? "bg-indigo-50/10" : ""
                              }`}
                            >
                              <button
                                onClick={() => toggleShiftForDate(dayStr, s.id)}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                  isWorking
                                    ? "bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100 shadow-3xs"
                                    : "bg-slate-50/80 border-slate-200/50 text-slate-400 hover:bg-slate-100 hover:text-slate-655"
                                }`}
                                title={`${dayStr} (クリックで切替)`}
                              >
                                {isWorking ? "出勤" : "休み"}
                              </button>
                            </td>
                          );
                        })}

                        {/* 右：クイックテンプレート一括アクション */}
                        <td className="py-3 px-3 border-l border-slate-100 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <button
                              onClick={() => applyWeekBulkStatus(s.id, "all-work")}
                              className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded text-[10px] font-bold text-slate-600 transition-all cursor-pointer"
                              title="月曜から日曜ます全て出勤にセット"
                            >
                              全ON
                            </button>
                            <button
                              onClick={() => applyWeekBulkStatus(s.id, "weekdays-only")}
                              className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded text-[10px] font-bold text-slate-600 transition-all cursor-pointer"
                              title="月曜から金曜までを出勤、土日を休みにセット"
                            >
                              平日ON
                            </button>
                            <button
                              onClick={() => applyWeekBulkStatus(s.id, "all-off")}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded text-[10px] font-bold text-slate-600 transition-all cursor-pointer"
                              title="今週のシフト出勤登録を全て解除（部屋清掃に割り当てられている場合は保護のためスキップされます）"
                            >
                              クリア
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 出勤人数の合計要約 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <b>人員充足ガイド：</b> 1日あたり12部屋の清掃が必要なため、1人が3部屋清掃すると仮定すると、毎日最低でも <b>3〜4名</b> の出勤があると安定したオペレーションが維持できます。上の表で毎日出勤人数を確認して調整して下さい。
            </span>
            <span className="font-bold text-slate-600">※ セルをクリックするだけでいつでも即時登録変更、リアルタイム保存されます。</span>
          </div>

        </div>
      )}

      {/* ==================== 3. MONTHLY SHIFT MATRIX & PATTERNS ==================== */}
      {viewMode === "monthly" && (
        <div className="space-y-6" id="monthly-scheduler-panel">
          
          {/* A. 曜日別スマート一括自動生成テンプレート ＆ スタッフ登録希望ベース全自動シフト作成 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* ツール1: 個別スタッフの曜日一括パターン適用 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                    <Sliders className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">個別曜日パターン一括適用</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      「毎週火・水・金に出勤」のように、選択した1名について定常曜日スケジュールを一括設定します。
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  {/* スタッフの指定 */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">
                      対象清掃スタッフ
                    </label>
                    <select
                      value={bulkStaffId}
                      onChange={(e) => setBulkStaffId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- スタッフを選択 --</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 曜日のチェックボックス配列 (Sun-Sat) */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
                      定期出勤する曜日の指定（複数選択可）
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {getDayNamesForChecks.map((dayLabel, idx) => {
                        const isChecked = bulkDays[idx];
                        return (
                          <button
                            key={dayLabel}
                            type="button"
                            onClick={() => {
                              const updated = [...bulkDays];
                              updated[idx] = !isChecked;
                              setBulkDays(updated);
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-700 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-550 hover:bg-slate-100"
                            }`}
                          >
                            {dayLabel}曜
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={handleApplyPatternToMonth}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer h-[38px] mt-2 border border-slate-700"
                >
                  <CheckSquare className="w-4 h-4" />
                  選択月への一括適用を実行
                </button>
              </div>
            </div>

            {/* ツール2: 各スタッフの登録希望条件から一発全自動シフト編成 (新機能) */}
            <div className="bg-white rounded-2xl border border-indigo-150/80 shadow-md p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">スタッフ稼働希望ベース 全自動シフト作成</h3>
                    <p className="text-xs text-indigo-500 mt-0.5">
                      全スタッフがマスタ画面に登録している「希望出勤曜日」および「希望休」を読み取り、当月全体の最適シフトを一撃で自動編成します。
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-xl space-y-2.5 text-xs text-indigo-900">
                  <p className="font-bold text-[10px] text-indigo-800 uppercase tracking-widest leading-none">全自動スケジューラのメリット</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
                    <li>個人個人の曜日希望をパーフェクトにスケジュール化</li>
                    <li>希望休み希望日（希望休）がある日は稼働から自動スキップ</li>
                    <li>すでにある部屋の清掃割当（実担当）がある日程は自動保護</li>
                  </ul>
                </div>
              </div>

              <div>
                <button
                  onClick={handleAutoCreateMonthlyShift}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 cursor-pointer h-[38px]"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  希望条件から今月のシフトを全自動作成
                </button>
              </div>
            </div>

          </div>

          {/* B. 月間日付別グリッドリスト */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
            
            {/* 年月ナビゲーター */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  月別シフトマトリクス一覧：<span className="text-indigo-600">{selectedDate.split("-")[0]}年 {selectedDate.split("-")[1]}月</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  1ヶ月間のすべての日付を横軸に、各スタッフを縦軸に配置したマトリクスです。各セルをクリックして簡単に出勤・お休みを微調整できます。
                </p>
              </div>

              {/* 月ナビゲーター */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  先月
                </button>
                
                <span className="font-mono font-bold text-sm text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                  {selectedDate.split("-")[0]}年 {selectedDate.split("-")[1]}月
                </span>

                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  翌月
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 月別マトリクス (Swapped Axis with Scrollable Grid) */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-[11px] text-slate-400 font-bold uppercase tracking-wider shadow-2xs">
                  <tr>
                    <th className="py-4 px-4 sticky left-0 bg-slate-50 z-20 min-w-[160px] shadow-sm border-r border-slate-200">清掃スタッフ氏名</th>
                    {getMonthDays(selectedDate).map((dayStr) => {
                      const d = new Date(dayStr);
                      const weekName = getWeekDayJP(dayStr);
                      const isToday = dayStr === new Date().toISOString().split("T")[0];
                      const dayNum = dayStr.split("-")[2];
                      const dayAssignments = assignments.filter((a) => a.date === dayStr);
                      
                      return (
                        <th key={dayStr} className="py-3 px-2 text-center border-l border-slate-100 min-w-[72px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-slate-700 text-xs font-extrabold">
                              {dayNum}日
                            </span>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              weekName === "日" ? "text-rose-500 bg-rose-50" :
                              weekName === "土" ? "text-blue-500 bg-blue-50" : "text-slate-500"
                            }`}>
                              ({weekName})
                            </span>
                            {isToday && (
                              <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 rounded transform scale-85 leading-none">
                                今日
                              </span>
                            )}
                            <button
                              onClick={() => setActiveModalDate(dayStr)}
                              className="mt-1 px-1 py-0.5 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center gap-0.5 text-[9px] text-indigo-700 font-bold rounded-md cursor-pointer border border-indigo-100/40 transition hover:shadow-2xs"
                              title={`${dayStr} の部屋割当(アサイン)を開く`}
                            >
                              <Layers className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                              <span>割当 ({dayAssignments.length})</span>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-4 px-3 text-center border-l border-slate-200 min-w-[100px] bg-slate-50">出勤合計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={35} className="py-12 text-center text-slate-400 font-medium">
                        スタッフが登録されていません。マスタ設定から先に登録してください。
                      </td>
                    </tr>
                  ) : (
                    staff.map((s) => {
                      const monthDays = getMonthDays(selectedDate);
                      // Calculates total work days this month for this staff
                      const totalWorkMonthsCount = monthDays.reduce((sum, dayStr) => {
                        const sh = shifts.find((shObj) => shObj.date === dayStr);
                        return sum + (sh && sh.staffIds.includes(s.id) ? 1 : 0);
                      }, 0);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Column 1: Sticky Staff Name */}
                          <td className="py-3 px-4 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-150 z-10 shadow-sm">
                            <div className="flex flex-col">
                              <span>{s.name}</span>
                              <span className="text-[9px] text-indigo-550 text-indigo-500 font-mono font-bold">{s.id}</span>
                            </div>
                          </td>

                          {/* Each Date shift cell toggle buttons */}
                          {monthDays.map((dayStr) => {
                            const sh = shifts.find((shObj) => shObj.date === dayStr);
                            const isWorking = sh ? sh.staffIds.includes(s.id) : false;

                            return (
                              <td 
                                key={dayStr} 
                                className="p-1 px-1.5 border-l border-slate-100 text-center"
                              >
                                <button
                                  onClick={() => toggleShiftForDate(dayStr, s.id)}
                                  className={`w-full py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer border ${
                                    isWorking
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-3xs"
                                      : "bg-slate-50/70 border-slate-200/40 text-slate-400 hover:bg-slate-100"
                                  }`}
                                  title={`${s.name} 様 - ${dayStr} (クリックで切替)`}
                                >
                                  {isWorking ? "出勤" : "休み"}
                                </button>
                              </td>
                            );
                          })}

                          {/* Total Month Days Scheduled column */}
                          <td className="py-3 px-3 border-l border-slate-200 text-center font-mono font-bold text-slate-700 bg-slate-50/50 font-black">
                            <span className="bg-slate-100 text-slate-650 px-2 py-1 rounded-md text-[11px] border border-slate-200">
                              {totalWorkMonthsCount}日出勤
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary row for daily workers totals */}
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                    <td className="py-3.5 px-4 sticky left-0 bg-slate-50 border-r border-slate-150 z-10 shadow-sm text-xs font-extrabold text-slate-700">
                      本日合計出勤人数
                    </td>
                    {getMonthDays(selectedDate).map((dayStr) => {
                      const sh = shifts.find((shObj) => shObj.date === dayStr);
                      const workersCount = sh ? sh.staffIds.length : 0;
                      
                      return (
                        <td key={dayStr} className="py-3 px-1 border-l border-slate-100 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-black text-[10px] ${
                            workersCount >= 3
                              ? "bg-emerald-100/85 text-emerald-900 border border-emerald-200"
                              : workersCount > 0
                                ? "bg-amber-100/85 text-amber-900 border border-amber-200"
                                : "bg-rose-100/85 text-rose-900 border border-rose-200"
                          }`}>
                            {workersCount}名
                          </span>
                        </td>
                      );
                    })}
                    <td className="bg-slate-100/60 border-l border-slate-200"></td>
                  </tr>

                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs text-indigo-900 flex items-start gap-2.5 leading-relaxed">
              <RefreshCw className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 animate-spin-slow" />
              <span>
                <b>横型マトリクスシフトのご案内：</b> 縦に清掃員のスタッフ氏名、横に1ヶ月の日付を配置しました。全体のバランスを見渡しながら、
                空いている<b>「出勤 / 休み」</b>セルを自由にタップ・クリックしてシフト指示書を編成できます。各ヘッダー列の<b>「配属/割当」</b>ボタンをクリックすれば、
                その日の全12室のクリーンアサイン画面がポップアップで開き、どこからでもすぐ計画を構築できます。
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ==================== DAILY ROOM ASSIGNMENT OVERLAY MODAL ==================== */}
      {activeModalDate && (() => {
        const modalShift = shifts.find((s) => s.date === activeModalDate);
        const modalOnDutyIds = modalShift ? modalShift.staffIds : [];
        const modalOnDutyStaff = staff.filter((s) => modalOnDutyIds.includes(s.id));
        const modalAssignments = assignments.filter((a) => a.date === activeModalDate);
        const modalWeekDay = getWeekDayJP(activeModalDate);

        // All 12 rooms list
        const allRoomsList = [
          "201", "202", "203", "205",
          "301", "302", "303", "305",
          "401", "402", "403", "405"
        ];

        // Evenly auto distribute room cleaner assignments logic inside modal
        const handleModalAutoAssign = () => {
          if (modalOnDutyStaff.length === 0) {
            alert("この日出勤に登録されているスタッフが一人もいません。先に本日のシフト出勤を登録してください。");
            return;
          }

          let updated = assignments.filter((a) => a.date !== activeModalDate);

          allRoomsList.forEach((roomNo, index) => {
            const staffIdx = index % modalOnDutyStaff.length;
            const assignedStaff = modalOnDutyStaff[staffIdx];
            const roomObj = rooms.find((r) => r.number === roomNo);
            const appliedPrice = roomObj ? roomObj.defaultPrice : 1200;

            updated.push({
              id: `A-${activeModalDate}-${roomNo}-${Date.now()}-${index}`,
              date: activeModalDate,
              roomNumber: roomNo,
              staffId: assignedStaff.id,
              appliedPrice,
            });
          });

          onUpdateAssignments(updated);
        };

        // Manual assign handler inside modal
        const handleModalAssign = (roomNo: string, staffId: string) => {
          const roomObj = rooms.find((r) => r.number === roomNo);
          const appliedPrice = roomObj ? roomObj.defaultPrice : 1200;

          let updated = [...assignments];
          const existIdx = updated.findIndex((a) => a.date === activeModalDate && a.roomNumber === roomNo);

          if (existIdx >= 0) {
            updated[existIdx] = {
              ...updated[existIdx],
              staffId,
              appliedPrice
            };
          } else {
            updated.push({
              id: `A-${activeModalDate}-${roomNo}-${Date.now()}`,
              date: activeModalDate,
              roomNumber: roomNo,
              staffId,
              appliedPrice
            });
          }
          onUpdateAssignments(updated);
        };

        // Manual remove handler inside modal
        const handleModalRemove = (roomNo: string) => {
          const updated = assignments.filter((a) => !(a.date === activeModalDate && a.roomNumber === roomNo));
          onUpdateAssignments(updated);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="space-y-1 bg-transparent p-0">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span>客室割当設定: {activeModalDate.replace(/-/g, "/")} ({modalWeekDay})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    選択した日付に紐づけて客室の担当清掃員を個別にアサイン、または自動で均等配置できます。
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalDate(null)}
                  className="p-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer text-xs font-bold flex items-center gap-1 shadow-3xs hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                  閉じる
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* On-Duty staff Summary bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-xs">
                  <div>
                    <span className="font-bold text-indigo-900 block">本日出勤メンバー ({modalOnDutyStaff.length}名)</span>
                    <span className="text-slate-550 text-slate-500 mt-1 block leading-relaxed">
                      {modalOnDutyStaff.length === 0 
                        ? "本日出勤に登録された清掃員がいません。シフト表で出勤に設定して下さい。" 
                        : modalOnDutyStaff.map(s => `${s.name} (${s.id})`).join(", ")}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={handleModalAutoAssign}
                      disabled={modalOnDutyStaff.length === 0}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      出勤者で12部屋を自動均等割当
                    </button>
                  </div>
                </div>

                {/* Rooms Matrix List */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    全12室の個別アサイン進捗（{modalAssignments.length} / 12部屋 割当済）
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allRoomsList.map((roomNo) => {
                      const roomObj = rooms.find(r => r.number === roomNo);
                      const defaultPrice = roomObj ? roomObj.defaultPrice : 1200;
                      
                      const assigned = modalAssignments.find((a) => a.roomNumber === roomNo);
                      const assignedStaff = assigned ? staff.find(s => s.id === assigned.staffId) : null;

                      return (
                        <div
                          key={roomNo}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                            assigned 
                              ? "bg-white border-indigo-205 border-indigo-200 shadow-3xs" 
                              : "bg-slate-50 border-slate-200/60 opacity-90"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50">
                                {roomNo}号室
                              </span>
                              <span className="text-[10px] text-slate-450 text-slate-400 font-medium">
                                単価: ¥{defaultPrice.toLocaleString()}
                              </span>
                            </div>
                            
                            {assigned && (
                              <button
                                onClick={() => handleModalRemove(roomNo)}
                                className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded-lg border border-rose-100 cursor-pointer transition"
                                title="割り当て解除"
                              >
                                解除
                              </button>
                            )}
                          </div>

                          {/* Cleaner Selection Dropdown inside Modal */}
                          <div>
                            <select
                              value={assigned ? assigned.staffId : ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleModalAssign(roomNo, e.target.value);
                                } else {
                                  handleModalRemove(roomNo);
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="">-- 未割り当て --</option>
                              {staff.map((s) => {
                                const isOnDuty = modalOnDutyIds.includes(s.id);
                                return (
                                  <option key={s.id} value={s.id}>
                                    {s.name} {isOnDuty ? "（本日出勤）" : "（休み/応援要請用）"}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 flex items-center justify-end bg-slate-100/45">
                <button
                  type="button"
                  onClick={() => setActiveModalDate(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all border border-slate-700"
                >
                  完了して変更を適用
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

