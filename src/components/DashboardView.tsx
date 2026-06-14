import React, { useState, useMemo } from "react";
import { Staff, Room, Assignment } from "../types";
import { 
  TrendingUp, 
  Coins, 
  Download, 
  CalendarDays, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Layers, 
  Calendar,
  Clock,
  ArrowRight,
  Search,
  BookOpen
} from "lucide-react";

interface DashboardViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  staff: Staff[];
  rooms: Room[];
  assignments: Assignment[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedDate,
  setSelectedDate,
  staff,
  rooms,
  assignments,
}) => {
  // Navigation tabs: 'overall' (calendar-based) or 'individual' (wage analytics per staff)
  const [activeTab, setActiveTab] = useState<"overall" | "individual">("overall");
  
  // Base month date state (e.g. "2026-06-13"). We use this to decide which month is currently visible in the calendar or analytics.
  const [currentMonthDate, setCurrentMonthDate] = useState<string>(selectedDate);
  
  // Selected Staff ID in the individual wage lookup view
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // Search keyword for staff in the list
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>("");

  // Currency helper
  const formatYen = (num: number) => `¥${num.toLocaleString("ja-JP")}`;

  // Calendar Day Constants
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const getWeekDayJP = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : dayNames[d.getDay()];
  };

  // Helper: Get Monday and Sunday boundaries for a specific date (Mon to Sun)
  const getWeekRange = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { start: dateStr, end: dateStr };
    }
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ...
    // Adjust so Monday is offset 0 and Sunday is offset 6
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.getTime());
    monday.setDate(diffToMonday);

    const sunday = new Date(monday.getTime());
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      start: formatDate(monday),
      end: formatDate(sunday),
    };
  };

  // Navigate active target month (Prev/Next)
  const handleMonthShift = (direction: number) => {
    const date = new Date(currentMonthDate);
    if (isNaN(date.getTime())) return;
    date.setMonth(date.getMonth() + direction);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setCurrentMonthDate(`${yyyy}-${mm}-${dd}`);
  };

  // Generate days sequence for calendar grid of current target month
  const calendarCells = useMemo(() => {
    const baseDate = new Date(currentMonthDate);
    if (isNaN(baseDate.getTime())) return [];
    
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth(); // 0-indexed

    // First day of the month
    const firstDayObj = new Date(year, month, 1);
    const startDayOfWeek = firstDayObj.getDay(); // 0: Sun, 1: Mon, ...

    // Total days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: { dateStr: string | null; dayNum: number | null }[] = [];

    // Empty cells at the beginning
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }

    // Actual calendar days
    for (let i = 1; i <= totalDays; i++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(i).padStart(2, "0");
      cells.push({
        dateStr: `${year}-${mm}-${dd}`,
        dayNum: i,
      });
    }

    return cells;
  }, [currentMonthDate]);

  // Current year/month parsed labels
  const targetYear = currentMonthDate.split("-")[0];
  const targetMonth = currentMonthDate.split("-")[1];

  // Total month stats (Total Completed Rooms, Total Payout, Total Active Staffs)
  const monthlyStats = useMemo(() => {
    const yearMonthStr = `${targetYear}-${targetMonth}`; // "YYYY-MM"
    const currMonthAssignments = assignments.filter((a) => a.date.startsWith(yearMonthStr));
    
    const totalPayout = currMonthAssignments.reduce((sum, a) => sum + a.appliedPrice, 0);
    const totalRooms = currMonthAssignments.length;
    
    const activeStaffSet = new Set(currMonthAssignments.map((a) => a.staffId));
    
    return {
      totalPayout,
      totalRooms,
      activeStaffCount: activeStaffSet.size,
    };
  }, [assignments, targetYear, targetMonth]);

  // Wage Calculators for the selected staff individual lookup
  const getStaffWagesOnDate = (staffId: string, dStr: string) => {
    const dayAssignments = assignments.filter((a) => a.staffId === staffId && a.date === dStr);
    return {
      total: dayAssignments.reduce((sum, a) => sum + a.appliedPrice, 0),
      rooms: dayAssignments.map((a) => a.roomNumber).sort()
    };
  };

  const getStaffWagesOnWeek = (staffId: string, dStr: string) => {
    const { start, end } = getWeekRange(dStr);
    const weeklyAssignments = assignments.filter((a) => a.staffId === staffId && a.date >= start && a.date <= end);
    return weeklyAssignments.reduce((sum, a) => sum + a.appliedPrice, 0);
  };

  const getStaffWagesOnMonth = (staffId: string, dStr: string) => {
    const prefix = dStr.substring(0, 7); // "YYYY-MM"
    const monthlyAssignments = assignments.filter((a) => a.staffId === staffId && a.date.startsWith(prefix));
    return monthlyAssignments.reduce((sum, a) => sum + a.appliedPrice, 0);
  };

  // Staff individual aggregate results for dates inside current visible month
  const staffMonthRecords = useMemo(() => {
    if (!selectedStaffId) return [];

    const monthPrefix = `${targetYear}-${targetMonth}`; // "YYYY-MM"
    
    // Find all assignments of this staff in selected month
    const staffMonthAssignments = assignments.filter(
      (a) => a.staffId === selectedStaffId && a.date.startsWith(monthPrefix)
    );

    // Get unique dates sorted in descending order
    const uniqueDates: string[] = staffMonthAssignments
      .map((a) => a.date)
      .filter((val, idx, self) => self.indexOf(val) === idx)
      .sort((a, b) => b.localeCompare(a));

    return uniqueDates.map((dStr) => {
      // Calculate daily details
      const { total: dailyTotal, rooms: roomsCleaned } = getStaffWagesOnDate(selectedStaffId, dStr);
      // Calculate week total (containing this date)
      const weeklyTotal = getWeekRange(dStr);
      const weeklyWagesSum = getStaffWagesOnWeek(selectedStaffId, dStr);
      // Calculate month total (containing this date)
      const monthlyWagesSum = getStaffWagesOnMonth(selectedStaffId, dStr);

      return {
        date: dStr,
        weekday: getWeekDayJP(dStr),
        rooms: roomsCleaned,
        dailyTotal,
        weeklyTotal: {
          start: weeklyTotal.start.replace(/-/g, "/").substring(5),
          end: weeklyTotal.end.replace(/-/g, "/").substring(5),
          sum: weeklyWagesSum
        },
        monthlyTotal: monthlyWagesSum,
      };
    });
  }, [assignments, selectedStaffId, targetYear, targetMonth]);

  // Overall list of staff sorted by name with query filter option
  const filteredStaffList = useMemo(() => {
    return staff.filter((s) => 
      s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(staffSearchQuery.toLowerCase())
    );
  }, [staff, staffSearchQuery]);

  // Default selected cleaner upon toggle
  React.useEffect(() => {
    if (staff.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staff[0].id);
    }
  }, [staff, selectedStaffId]);

  // CSV Report Downloader
  const handleCsvDownload = () => {
    let csvContent = "\ufeff"; // UTF-8 with BOM
    csvContent += `ホテル清掃実績・報酬集計レポート,対象月: ${targetYear}年${targetMonth}月\r\n`;
    csvContent += `出力時刻,${new Date().toLocaleString("ja-JP")}\r\n`;
    csvContent += `合計客室清掃数,${monthlyStats.totalRooms}部屋\r\n`;
    csvContent += `総支出清掃費,${monthlyStats.totalPayout}円\r\n\r\n`;

    if (activeTab === "overall") {
      csvContent += "【日付別 - 清掃アサイン＆報酬構成ログ】\r\n";
      csvContent += "日付,部屋番号,清掃担当者氏名,部屋単価(円)\r\n";
      
      const monthPrefix = `${targetYear}-${targetMonth}`;
      const monthAssignments = assignments
        .filter((a) => a.date.startsWith(monthPrefix))
        .sort((a, b) => a.date.localeCompare(b.date) || a.roomNumber.localeCompare(b.roomNumber));

      monthAssignments.forEach((a) => {
        const staffName = staff.find((s) => s.id === a.staffId)?.name || "削除済スタッフ";
        csvContent += `${a.date},${a.roomNumber}号室,${staffName},${a.appliedPrice}\r\n`;
      });
    } else {
      const activeStaff = staff.find((s) => s.id === selectedStaffId);
      csvContent += `【個人別集計】清掃者: ${activeStaff ? activeStaff.name55 : (activeStaff?.name || "未指定")} (${selectedStaffId})\r\n`;
      csvContent += "日付,曜日,担当客室一覧,その日の支給額(円),所属週の支給額(円),所属月の支給額(円)\r\n";

      staffMonthRecords.forEach((r) => {
        csvContent += `${r.date},${r.weekday},"${r.rooms.join(", ")}",${r.dailyTotal},${r.weeklyTotal.sum},${r.monthlyTotal}\r\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filename = `cleaning-rewards-${activeTab}-${targetYear}-${targetMonth}.csv`;
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="cleaning-dashboard-container">
      
      {/* 1. Header Overview & Control Strip */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-500" />
              清掃報酬・手当 管理ダッシュボード
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            清掃室ごとの単価（手当）をベースに、シフト実績から報酬支払を自動集計します。
            「カレンダーで見る全体報酬」と「日・週・月で見るスタッフ別支給額」に対応しています。
          </p>
        </div>

        {/* Month Selector Control */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
          <button
            onClick={() => handleMonthShift(-1)}
            className="p-1 px-2.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition text-xs font-bold flex items-center gap-0.5 cursor-pointer"
            title="前月へ移動"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            前月
          </button>
          
          <span className="font-mono font-black text-xs text-slate-700 bg-white shadow-3xs border border-slate-150 px-3 py-1 rounded-xl">
            {targetYear}年 {targetMonth}月
          </span>
          
          <button
            onClick={() => handleMonthShift(1)}
            className="p-1 px-2.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition text-xs font-bold flex items-center gap-0.5 cursor-pointer"
            title="翌月へ移動"
          >
            翌月
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top-Level High Contrast KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Total month payout */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {targetMonth}月度 報酬支払総額 (費用)
            </span>
            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {formatYen(monthlyStats.totalPayout)}
            </div>
            <p className="text-[10px] text-slate-400">実績完了済みの清掃単価合計</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Coins className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 2: Total completed rooms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {targetMonth}月度 合計清掃客室数
            </span>
            <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
              {monthlyStats.totalRooms} <span className="text-xs font-bold text-slate-400">部屋</span>
            </div>
            <p className="text-[10px] text-slate-400">客室別割り当て登録件数</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 3: Total active staff members */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {targetMonth}月度 稼働清掃スタッフ
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              {monthlyStats.activeStaffCount} <span className="text-xs font-bold text-slate-400">名</span>
            </div>
            <p className="text-[10px] text-slate-400">今月1回以上清掃を担当した人数</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* 3. Sub-navigation tabs & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        
        {/* Toggle tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("overall")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "overall"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            全体カレンダー表示
          </button>
          
          <button
            onClick={() => setActiveTab("individual")}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "individual"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            スタッフ個人別報酬・支給分析
          </button>
        </div>

        {/* Common CSV Download */}
        <div>
          <button
            onClick={handleCsvDownload}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-3xs"
          >
            <Download className="w-3.5 h-3.5" />
            {activeTab === "overall" ? `${targetMonth}月実績CSVダウンロード` : "個人別明細CSVダウンロード"}
          </button>
        </div>

      </div>

      {/* ============================== TAB 1: OVERALL CALENDAR VIEW ============================== */}
      {activeTab === "overall" && (
        <div className="space-y-6" id="dashboard-tab-overall">
          
          {/* Calendar visual wrapper */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            
            {/* Header / Weekday Indicator */}
            <div className="bg-slate-50/80 border-b border-slate-200/60 py-3.5 px-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                {targetYear}年{targetMonth}月 清掃アサインカレンダー（誰が、どこの部屋を、いくらで）
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                1日ずつクリックしてアサイン日に設定可能
              </span>
            </div>

            {/* Weekday grid headings */}
            <div className="grid grid-cols-7 border-b border-slate-150 bg-slate-100/30 text-center py-2.5 text-xs font-bold text-slate-500">
              {dayNames.map((name, idx) => (
                <div 
                  key={name}
                  className={`py-1 ${
                    idx === 0 ? "text-rose-600" :
                    idx === 6 ? "text-blue-600" : "text-slate-500"
                  }`}
                >
                  {name}曜日
                </div>
              ))}
            </div>

            {/* Target month Grid days */}
            <div className="grid grid-cols-7 border-collapse bg-slate-50/50">
              {calendarCells.map((cell, idx) => {
                const { dateStr, dayNum } = cell;

                if (!dateStr || !dayNum) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="border-b border-r border-slate-150/80 min-h-[140px] bg-slate-100/40 opacity-50"
                    />
                  );
                }

                // Filter assignments specifically for this calendar day
                const dayAssignments = assignments.filter((a) => a.date === dateStr);
                const dayTotal = dayAssignments.reduce((sum, a) => sum + a.appliedPrice, 0);

                const weekName = getWeekDayJP(dateStr);
                const isSelectedDay = dateStr === selectedDate;
                const isToday = dateStr === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`border-b border-r border-slate-200 min-h-[155px] p-2 flex flex-col justify-between transition-all relative select-none group cursor-pointer ${
                      isSelectedDay 
                        ? "bg-indigo-50/60 ring-2 ring-indigo-600/35 z-10" 
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {/* Top row: day label & highlight */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span 
                        className={`text-xs font-extrabold w-5.5 h-5.5 flex items-center justify-center rounded-full font-mono ${
                          isToday 
                            ? "bg-indigo-600 text-white font-black" 
                            : weekName === "日" 
                              ? "text-rose-600 font-bold bg-rose-50" 
                              : weekName === "土" 
                                ? "text-blue-600 font-bold bg-blue-50" 
                                : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {dayNum}
                      </span>
                      
                      {isToday && (
                        <span className="text-[8px] bg-indigo-100 text-indigo-700 font-mono font-bold px-1 rounded-sm scale-90 leading-none">
                          TODAY
                        </span>
                      )}
                      
                      {isSelectedDay && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono font-black px-1 rounded-sm scale-90 leading-none">
                          選択中
                        </span>
                      )}
                    </div>

                    {/* Middle: list of room cleanings on this day */}
                    <div className="space-y-1 overflow-y-auto max-h-[90px] pr-0.5 custom-scrollbar flex-1">
                      {dayAssignments.length === 0 ? (
                        <div className="text-[9px] text-slate-300 italic py-1 pl-1">
                          清掃なし (-)
                        </div>
                      ) : (
                        dayAssignments.map((a) => {
                          const cleaner = staff.find((s) => s.id === a.staffId);
                          return (
                            <div
                              key={a.id}
                              className="text-[9px] bg-slate-50 border border-slate-150/70 rounded px-1.5 py-1 flex items-center justify-between gap-1 leading-none hover:border-slate-350 transition shadow-3xs"
                              title={`${a.roomNumber}号室: ${cleaner ? cleaner.name : "削除済"}（${formatYen(a.appliedPrice)}）`}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="font-extrabold text-slate-700 font-mono shrink-0">{a.roomNumber}</span>
                                <span className="text-indigo-600 font-bold truncate pl-0.5">{cleaner ? cleaner.name : "不明"}</span>
                              </div>
                              <span className="font-mono text-[9px] text-emerald-600 font-bold shrink-0">{formatYen(a.appliedPrice)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Bottom: Daily Cost Summary */}
                    {dayTotal > 0 && (
                      <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px]">
                        <span className="text-slate-400 font-semibold">日当計</span>
                        <span className="font-mono font-black text-slate-800 bg-slate-100 px-1 py-0.2 rounded">
                          {formatYen(dayTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900 leading-relaxed">
            <Layers className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
            <span>
              💡 <b>全体カレンダーの活用方法:</b> 縦・横が整列されたこのカレンダーで、毎日どのスタッフがどの部屋を清掃し、その日の総支給額がいくら掛かったかを見渡せます。
              各マスの日付をタップすると、その日付が<b>基準アサイン日</b>に指定されます。
            </span>
          </div>

        </div>
      )}

      {/* ============================== TAB 2: INDIVIDUAL STAFF REWARD ANALYTICS ============================== */}
      {activeTab === "individual" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="dashboard-tab-individual">
          
          {/* Left Column: Staff Directory Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-500" />
                清掃スタッフ一覧
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                明細を見たいスタッフを選択してください。
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="清掃員の名前やIDで検索..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-505 focus:border-indigo-500 transition-all text-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Directory List Container */}
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {filteredStaffList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  該当する清掃スタッフがいません
                </div>
              ) : (
                filteredStaffList.map((s) => {
                  const isSelected = s.id === selectedStaffId;
                  
                  // Compute month payout size for badge
                  const monthPrefix = `${targetYear}-${targetMonth}`;
                  const monthPayout = assignments
                    .filter((a) => a.staffId === s.id && a.date.startsWith(monthPrefix))
                    .reduce((sum, a) => sum + a.appliedPrice, 0);

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStaffId(s.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-100"
                          : "bg-slate-50 border-slate-205 border-slate-100 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <span className="font-extrabold text-xs block truncate">
                          {s.name}
                        </span>
                        <span className={`text-[10px] font-mono block ${isSelected ? "text-slate-350" : "text-slate-400"}`}>
                          ID: {s.id}
                        </span>
                      </div>

                      {monthPayout > 0 ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black shrink-0 ${
                          isSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {formatYen(monthPayout)}
                        </span>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] shrink-0 font-medium ${
                          isSelected ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-400 bg-white"
                        }`}>
                          稼働なし
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed wages statement (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Guide message if none selected */}
            {!selectedStaffId ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl py-20 text-center text-slate-400">
                <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h4 className="font-extrabold text-sm text-slate-650 text-slate-600">スタッフが選択されていません</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  左のリストから清掃スタッフを選んでください。
                  選んだ人の「日・週・月」それぞれの総支給額と、どの日に何号室を掃除したかの明細がここにリアルタイム表示されます。
                </p>
              </div>
            ) : (() => {
              const activeStaff = staff.find((s) => s.id === selectedStaffId);
              const monthPrefix = `${targetYear}-${targetMonth}`;

              // Selected month total calculated for easy indicator directly from assignments
              const activeStaffWads = assignments
                .filter((a) => a.staffId === selectedStaffId && a.date.startsWith(monthPrefix))
                .reduce((sum, a) => sum + a.appliedPrice, 0);
              const activeStaffRooms = assignments
                .filter((a) => a.staffId === selectedStaffId && a.date.startsWith(monthPrefix))
                .length;

              return (
                <div className="space-y-6">
                  
                  {/* Selected Staff Profile Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-250 border-slate-200 text-indigo-600 flex items-center justify-center font-black text-base shadow-3xs">
                        {activeStaff ? activeStaff.name.charAt(0) : "野"}
                      </div>
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-800 text-sm block">
                          {activeStaff ? activeStaff.name : "不明なスタッフ"} 様
                        </span>
                        <span className="text-xs text-slate-400 font-mono block">
                          📞 TEL: {activeStaff?.phone || "未設定"} &nbsp;|&nbsp; ID: {selectedStaffId}
                        </span>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-center gap-6 text-xs text-indigo-950 font-mono self-start sm:self-auto shadow-3xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">今月の総支給報酬額</span>
                        <span className="font-black text-base text-emerald-600 mt-0.5 block">{formatYen(activeStaffWads)}</span>
                      </div>
                      <div className="w-[1px] h-8 bg-indigo-200" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">今月の清掃客室数</span>
                        <span className="font-black text-base text-slate-800 mt-0.5 block">{activeStaffRooms}部屋</span>
                      </div>
                    </div>
                  </div>

                  {/* Wage Statement Table */}
                  <div className="bg-white rounded-3xl border border-slate-200/95 shadow-sm overflow-hidden space-y-4">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          報酬支給実績明細（日当、週総額、月総額）
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {targetYear}年{targetMonth}月度のすべての稼働実績日に対する報酬対照表です。
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-200/60 text-slate-700 px-2.5 py-1 rounded-md font-bold font-mono">
                        稼働日数: {staffMonthRecords.length}日
                      </span>
                    </div>

                    {/* Table section replaced with Calendar */}
                    <div className="p-4 pt-0">
                      {/* Weekday titles */}
                      <div className="grid grid-cols-8 border border-slate-150 bg-slate-100/30 text-center py-2 text-[10px] font-bold text-slate-500 rounded-t-xl">
                        <div className="text-indigo-700 bg-indigo-50/40 py-1 border-r border-slate-150 flex items-center justify-center font-extrabold text-[9px]">
                          週合計金額
                        </div>
                        {dayNames.map((name, idx) => (
                          <div 
                            key={name}
                            className={`${
                              idx === 0 ? "text-rose-600" :
                              idx === 6 ? "text-blue-600" : "text-slate-500"
                            }`}
                          >
                            {name}曜日
                          </div>
                        ))}
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-8 border-l border-r border-b border-slate-150 rounded-b-xl bg-slate-50/30">
                        {(() => {
                          const weeks: { dateStr: string | null; dayNum: number | null }[][] = [];
                          for (let i = 0; i < calendarCells.length; i += 7) {
                            weeks.push(calendarCells.slice(i, i + 7));
                          }

                          return weeks.map((week, wIdx) => {
                            // Calculate weekly rewards and room count of this specific calendar week row (Sunday to Saturday)
                            const rowDates: string[] = [];
                            const firstValidCell = week.find((cell) => cell.dateStr !== null);
                            if (firstValidCell && firstValidCell.dateStr) {
                              const baseDate = new Date(firstValidCell.dateStr);
                              const firstValidIdx = week.findIndex((cell) => cell.dateStr !== null);
                              for (let i = 0; i < 7; i++) {
                                const d = new Date(baseDate.getTime());
                                d.setDate(baseDate.getDate() + (i - firstValidIdx));
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(2, "0");
                                const dd = String(d.getDate()).padStart(2, "0");
                                rowDates.push(`${yyyy}-${mm}-${dd}`);
                              }
                            }

                            const weeklyWagesSum = rowDates.length > 0
                              ? assignments
                                  .filter((a) => a.staffId === selectedStaffId && rowDates.includes(a.date))
                                  .reduce((sum, a) => sum + a.appliedPrice, 0)
                              : 0;

                            const weeklyRoomsCount = rowDates.length > 0
                              ? assignments
                                  .filter((a) => a.staffId === selectedStaffId && rowDates.includes(a.date))
                                  .length
                              : 0;

                            const isLastWeekRow = wIdx === weeks.length - 1;

                            return (
                              <React.Fragment key={`week-row-${wIdx}`}>
                                {/* Column 1: 週合計金額 (Weekly Total) adjacent to Sunday */}
                                <div className={`p-2.5 min-h-[140px] flex flex-col justify-between bg-indigo-50/15 border-r border-slate-150 ${!isLastWeekRow ? "border-b border-slate-200" : ""}`}>
                                  <div className="space-y-1">
                                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider block w-max">
                                      第{wIdx + 1}週
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-medium block">
                                      週累計報酬
                                    </span>
                                  </div>

                                  {weeklyWagesSum > 0 ? (
                                    <div className="space-y-1">
                                      <span className="text-[8px] text-slate-500 font-bold block">
                                        清掃: <span className="font-extrabold text-slate-700">{weeklyRoomsCount}部屋</span>
                                      </span>
                                      <span className="font-mono font-black text-[10px] text-indigo-700 bg-indigo-50/80 px-1 py-1 rounded block text-center border border-indigo-150">
                                        {formatYen(weeklyWagesSum)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-[8px] text-slate-350 italic">
                                      清掃なし (-)
                                    </div>
                                  )}
                                </div>

                                {/* Columns 2-8: 7 days of the week */}
                                {week.map((cell, idx) => {
                                  const { dateStr, dayNum } = cell;

                                  if (!dateStr || !dayNum) {
                                    return (
                                      <div 
                                        key={`empty-cell-${wIdx}-${idx}`} 
                                        className={`min-h-[140px] bg-slate-100/30 opacity-40 border-r border-slate-150 last:border-r-0 ${!isLastWeekRow ? "border-b border-slate-200" : ""}`}
                                      />
                                    );
                                  }

                                  const dayAssignments = assignments.filter((a) => a.staffId === selectedStaffId && a.date === dateStr);
                                  const dayTotal = dayAssignments.reduce((sum, a) => sum + a.appliedPrice, 0);
                                  const roomsCount = dayAssignments.length;

                                  const weekName = getWeekDayJP(dateStr);
                                  const isToday = dateStr === new Date().toISOString().split("T")[0];
                                  const hasWages = dayTotal > 0;
                                  
                                  const isLastCol = (idx + 1) % 7 === 0;

                                  return (
                                    <div
                                      key={dateStr}
                                      className={`p-2 min-h-[140px] flex flex-col justify-between transition-all relative ${
                                        isLastCol ? "" : "border-r border-slate-150"
                                      } ${
                                        !isLastWeekRow ? "border-b border-slate-200" : ""
                                      } ${
                                        hasWages 
                                          ? "bg-emerald-50/15" 
                                          : "bg-white"
                                      }`}
                                    >
                                      {/* Top row: day number label & room count badge */}
                                      <div className="flex items-center justify-between">
                                        <span 
                                          className={`text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full font-mono ${
                                            isToday 
                                              ? "bg-indigo-600 text-white font-black" 
                                              : weekName === "日" 
                                                ? "text-rose-600 font-bold bg-rose-50" 
                                                : weekName === "土" 
                                                  ? "text-blue-600 font-bold bg-blue-50" 
                                                  : "text-slate-600"
                                          }`}
                                        >
                                          {dayNum}
                                        </span>
                                        {roomsCount > 0 ? (
                                          <span className="text-[8px] bg-emerald-150 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                            {roomsCount}部屋
                                          </span>
                                        ) : isToday ? (
                                          <span className="text-[7px] bg-indigo-100 text-indigo-700 font-bold px-1 rounded-sm scale-90">
                                            今日
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* Middle: Cleaned Room Cards List */}
                                      <div className="my-1.5 flex-1 overflow-y-auto max-h-[70px] space-y-1">
                                        {dayAssignments.length > 0 ? (
                                          <div className="flex flex-col gap-0.5">
                                            {dayAssignments.map((a) => (
                                              <div 
                                                key={a.id}
                                                className="text-[8px] bg-slate-50 border border-slate-200 text-slate-700 px-1 py-0.5 rounded flex items-center justify-between font-medium"
                                              >
                                                <span className="font-bold">🏠{a.roomNumber}</span>
                                                <span className="font-mono text-slate-500 font-semibold text-[7.5px]">{formatYen(a.appliedPrice)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-[8px] text-slate-300 italic pl-0.5 mt-0.5">
                                            清掃なし (-)
                                          </div>
                                        )}
                                      </div>

                                      {/* Bottom: day-specific total wage */}
                                      {hasWages && (
                                        <div className="pt-1 border-t border-slate-100 mt-1 flex items-center justify-between">
                                          <span className="text-[8px] text-rose-500 font-bold">日当:</span>
                                          <span className="font-mono font-black text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                            {formatYen(dayTotal)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Monthly Summary Banner under the calendar */}
                    <div className="mx-4 mb-4 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                          月別総支払報酬
                        </span>
                        <p className="text-xs text-slate-700 font-bold">
                          {targetYear}年{targetMonth}月度 の手当・報酬支給総額
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-slate-500 font-sans pr-1">
                          担当客室数: <span className="font-extrabold text-slate-800">{activeStaffRooms} 部屋</span>
                        </div>
                        <div className="h-4 w-[1px] bg-emerald-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block text-right leading-none">計支払金</span>
                          <span className="text-lg font-black text-emerald-600 leading-none mt-1 block">
                            {formatYen(activeStaffWads)}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Summary Information Disclaimer block */}
                  <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-650 text-slate-600 leading-normal space-y-1">
                    <span className="font-extrabold text-slate-800 block">ℹ️ 支給額の定義について:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1 text-[11px]">
                      <li><b>① その日の支給額:</b> 該当日に清掃を完了した客室すべての単価（手当）を合算した日給です。</li>
                      <li><b>② その週の支給額:</b> 該当の日付が含まれる週（月曜日から日曜日までの7日間）の、累積支給合計金額です。</li>
                      <li><b>③ その月の支給額:</b> 該当の日付が含まれる月全体の累積給与総額となります。</li>
                    </ul>
                  </div>

                </div>
              );
            })()}

          </div>

        </div>
      )}

    </div>
  );
};
