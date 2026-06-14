import { useState, useEffect } from "react";
import { Staff, Room, Shift, Assignment } from "./types";
import { getInitialData, DEFAULT_ROOMS } from "./data";
import { AssignmentView } from "./components/AssignmentView";
import { DashboardView } from "./components/DashboardView";
import { MasterView } from "./components/MasterView";
import { StaffPortalView } from "./components/StaffPortalView";
import { CalendarDays, TrendingUp, Key, RotateCcw, Building, Users, Smile } from "lucide-react";

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-13"); // Set default around seed range
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"assignment" | "dashboard" | "master" | "staff-portal">("assignment");
  
  // User mode state: "manager" | "staff" (separate staff page from manager console)
  const [userRole, setUserRole] = useState<"manager" | "staff">("manager");
  
  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Load state on mount
  useEffect(() => {
    const localStaff = localStorage.getItem("clean_system_staff");
    const localRooms = localStorage.getItem("clean_system_rooms");
    const localShifts = localStorage.getItem("clean_system_shifts");
    const localAssignments = localStorage.getItem("clean_system_assignments");

    if (localStaff && localRooms && localShifts && localAssignments) {
      setStaff(JSON.parse(localStaff));
      setRooms(JSON.parse(localRooms));
      setShifts(JSON.parse(localShifts));
      setAssignments(JSON.parse(localAssignments));
    } else {
      // Seed with initial realistic data for superb UX out of the box
      const seed = getInitialData();
      setStaff(seed.staff);
      setRooms(seed.rooms);
      setShifts(seed.shifts);
      setAssignments(seed.assignments);
      
      localStorage.setItem("clean_system_staff", JSON.stringify(seed.staff));
      localStorage.setItem("clean_system_rooms", JSON.stringify(seed.rooms));
      localStorage.setItem("clean_system_shifts", JSON.stringify(seed.shifts));
      localStorage.setItem("clean_system_assignments", JSON.stringify(seed.assignments));
    }
  }, []);

  // Save utility helpers
  const saveStaff = (updated: Staff[]) => {
    setStaff(updated);
    localStorage.setItem("clean_system_staff", JSON.stringify(updated));
  };

  const saveRooms = (updated: Room[]) => {
    setRooms(updated);
    localStorage.setItem("clean_system_rooms", JSON.stringify(updated));
  };

  const saveShifts = (updated: Shift[]) => {
    setShifts(updated);
    localStorage.setItem("clean_system_shifts", JSON.stringify(updated));
  };

  const saveAssignments = (updated: Assignment[]) => {
    setAssignments(updated);
    localStorage.setItem("clean_system_assignments", JSON.stringify(updated));
  };

  // RESET handler to restore pristine demo statistics
  const resetToDemoData = () => {
    if (window.confirm("全ての登録変更をリセットし、初期デモデータ（2026年6月のシフト・割当実績含む）を復元しますか？")) {
      const seed = getInitialData();
      saveStaff(seed.staff);
      saveRooms(seed.rooms);
      saveShifts(seed.shifts);
      saveAssignments(seed.assignments);
      setSelectedDate("2026-06-13");
      showToast("初期デモデータを正常に復元しました。");
    }
  };

  // Shift 出勤 toggling handler
  const handleToggleShift = (date: string, staffId: string) => {
    let updatedShifts = [...shifts];
    const shiftIndex = updatedShifts.findIndex((s) => s.date === date);

    if (shiftIndex >= 0) {
      const shiftObj = updatedShifts[shiftIndex];
      let updatedStaffIds = [...shiftObj.staffIds];

      if (updatedStaffIds.includes(staffId)) {
        // Warning if staff already has active room assignments on this date
        const hasActiveAssignments = assignments.some(
          (a) => a.date === date && a.staffId === staffId
        );
        if (hasActiveAssignments) {
          // Remove their assignments too silently for a fully smooth in-app experience
          const cleanedAssignments = assignments.filter(
            (a) => !(a.date === date && a.staffId === staffId)
          );
          saveAssignments(cleanedAssignments);
        }

        updatedStaffIds = updatedStaffIds.filter((id) => id !== staffId);
      } else {
        updatedStaffIds.push(staffId);
      }

      updatedShifts[shiftIndex] = { ...shiftObj, staffIds: updatedStaffIds };
    } else {
      updatedShifts.push({
        date,
        staffIds: [staffId],
      });
    }

    saveShifts(updatedShifts);
    showToast("出勤（シフト）設定を保存しました。");
  };

  // Create Assignment (or modify existing one)
  const handleAssignRoom = (date: string, roomNo: string, staffId: string) => {
    const roomObj = rooms.find((r) => r.number === roomNo);
    const appliedPrice = roomObj ? roomObj.defaultPrice : 1200;

    let updatedAssignments = [...assignments];
    const existingIndex = updatedAssignments.findIndex(
      (a) => a.date === date && a.roomNumber === roomNo
    );

    if (existingIndex >= 0) {
      // Modify staff assigned with current price
      updatedAssignments[existingIndex] = {
        ...updatedAssignments[existingIndex],
        staffId,
        appliedPrice, // Keep price at assignment time!
      };
    } else {
      // Create new assignment
      updatedAssignments.push({
        id: `A-${date}-${roomNo}-${Date.now()}`,
        date,
        roomNumber: roomNo,
        staffId,
        appliedPrice,
      });
    }

    saveAssignments(updatedAssignments);
    const cleanerName = staff.find((s) => s.id === staffId)?.name || "スタッフ";
    showToast(`${roomNo}号室に ${cleanerName} 様を割り当てました（単価 ${appliedPrice.toLocaleString()}円 適用）`);
  };

  // Remove assignment
  const handleRemoveAssignment = (date: string, roomNo: string) => {
    const updated = assignments.filter((a) => !(a.date === date && a.roomNumber === roomNo));
    saveAssignments(updated);
    showToast(`${roomNo}号室の清掃割り当てを解除しました。`);
  };

  // Staff Master modification handlers
  const handleAddStaff = (name: string, phone: string, weeklyDesire?: boolean[], specificOffs?: string[]) => {
    // Generate sequential ID
    const nextNum = staff.length > 0 
      ? Math.max(...staff.map((s) => parseInt(s.id.substring(1) || "0", 10))) + 1 
      : 1;
    const nextId = `S${String(nextNum).padStart(2, "0")}`;

    const newStaff: Staff = { 
      id: nextId, 
      name, 
      phone,
      weeklyDesire: weeklyDesire || [true, true, true, true, true, true, true],
      specificOffs: specificOffs || []
    };
    saveStaff([...staff, newStaff]);
    showToast(`清掃員「${name}」様を新しく登録しました。`);
  };

  const handleUpdateStaff = (id: string, name: string, phone: string, weeklyDesire?: boolean[], specificOffs?: string[]) => {
    const updated = staff.map((s) => (s.id === id ? { ...s, name, phone, weeklyDesire, specificOffs } : s));
    saveStaff(updated);
    showToast(`スタッフ「${name}»様の情報を更新しました。`);
  };

  const handleDeleteStaff = (id: string) => {
    // Remove staff from staff master
    const updatedStaff = staff.filter((s) => s.id !== id);
    saveStaff(updatedStaff);

    // Filter shifts and remove their ID
    const updatedShifts = shifts.map((s) => ({
      ...s,
      staffIds: s.staffIds.filter((sid) => sid !== id),
    }));
    saveShifts(updatedShifts);

    // Assignments can either be removed or keep as orphaned to protect integrity.
    // The requirement says: "これまでのシフト割当データ上でスタッフ名称が見つからない場合があります" which matches keeping the records.
    // Let's filter assignments to clean up or keep. We can keep them so historical payouts are unaffected but display placeholder.
    showToast("スタッフ情報を削除しました。");
  };

  // Rooms and Unit prices modifiers
  const handleUpdateRoomPrice = (roomNumber: string, price: number) => {
    const updated = rooms.map((r) => (r.number === roomNumber ? { ...r, defaultPrice: price } : r));
    saveRooms(updated);
    // Silent save since inline slider can be rapid. No toast needed here to avoid alert spam, visual check is in child.
  };

  const handleBulkUpdatePrices = (pricesMap: { [roomNumber: string]: number }) => {
    const updated = rooms.map((r) => {
      const newPrice = pricesMap[r.number];
      return newPrice !== undefined ? { ...r, defaultPrice: newPrice } : r;
    });
    saveRooms(updated);
    showToast("部屋のデフォルト単価を一括更新しました！");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col" id="app-root-workflow">
      
      {/* 1. ヘッダーナビゲーション (Sleek Glass Theme) */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/80 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* 左側: ロゴ・タイトル */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold font-display text-slate-800 block tracking-tight">
                  ホテル清掃管理 <span className="text-slate-400 font-light ml-1">| Professional</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded uppercase tracking-wider">
                  Hotel Cleaning Manager Console
                </span>
              </div>
            </div>

            {/* 真ん中/右: タブメニュー */}
            <nav className="flex items-center gap-1 sm:gap-2" id="nav-tabs">
              <button
                onClick={() => setActiveTab("assignment")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "assignment"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
                }`}
                id="tab-btn-assignment"
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                清掃割当
              </button>

              <button
                onClick={() => setActiveTab("staff-portal")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "staff-portal"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
                }`}
                id="tab-btn-staff-portal"
              >
                <Smile className="w-4 h-4 shrink-0" />
                スタッフ用シフト指定
              </button>
              
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
                }`}
                id="tab-btn-dashboard"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                報酬集計
              </button>

              <button
                onClick={() => setActiveTab("master")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "master"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
                }`}
                id="tab-btn-master"
              >
                <Key className="w-4 h-4 shrink-0" />
                マスタ設定
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* 2. メインコンテンツエリア */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 動的トースト通知 */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-55 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 max-w-md animate-fade-in-up border border-slate-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* 画面A：清掃割当 */}
          {activeTab === "assignment" && (
            <AssignmentView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              staff={staff}
              rooms={rooms}
              shifts={shifts}
              assignments={assignments}
              onToggleShift={handleToggleShift}
              onUpdateShifts={saveShifts}
              onAssignRoom={handleAssignRoom}
              onRemoveAssignment={handleRemoveAssignment}
              onUpdateAssignments={saveAssignments}
            />
          )}

          {/* 画面：スタッフ用シフト入力 */}
          {activeTab === "staff-portal" && (
            <StaffPortalView
              staff={staff}
              shifts={shifts}
              selectedDate={selectedDate}
              onUpdateStaff={handleUpdateStaff}
              onToggleShift={handleToggleShift}
              onUpdateShifts={saveShifts}
            />
          )}

          {/* 画面B：集計ダッシュボード */}
          {activeTab === "dashboard" && (
            <DashboardView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              staff={staff}
              rooms={rooms}
              assignments={assignments}
            />
          )}

          {/* 画面C：マスタ設定 */}
          {activeTab === "master" && (
            <MasterView
              staff={staff}
              rooms={rooms}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              onUpdateRoomPrice={handleUpdateRoomPrice}
              onBulkUpdatePrices={handleBulkUpdatePrices}
            />
          )}
        </div>
      </main>

      {/* 3. フッター & デリケートな管理者リセットバー */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5 flex flex-col sm:flex-row items-center justify-between">
          <p>© 2026 ホテル清掃管理者コントロールシステム — 全12室・変動単価対応仕様</p>
          <button
            onClick={resetToDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-400 font-bold rounded-lg transition-all text-[11px] cursor-pointer"
            id="reset-demo-data-button"
            title="初期のダミー稼働実績データを再設定します。"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            初期デモデータを復元する
          </button>
        </div>
      </footer>

    </div>
  );
}
