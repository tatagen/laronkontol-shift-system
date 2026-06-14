import React, { useState } from "react";
import { Staff, Shift } from "../types";
import { 
  User, 
  Calendar, 
  Clock, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Smile, 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  CalendarCheck
} from "lucide-react";

interface StaffPortalViewProps {
  staff: Staff[];
  shifts: Shift[];
  selectedDate: string;
  onUpdateStaff: (id: string, name: string, phone: string, weeklyDesire?: boolean[], specificOffs?: string[]) => void;
  onToggleShift: (date: string, staffId: string) => void;
  onUpdateShifts: (shifts: Shift[]) => void;
}

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({
  staff,
  shifts,
  selectedDate,
  onUpdateStaff,
  onToggleShift,
  onUpdateShifts,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [activeMonthDate, setActiveMonthDate] = useState<string>(selectedDate);
  const [newOffDate, setNewOffDate] = useState<string>("");

  const currentStaff = staff.find((s) => s.id === selectedStaffId);

  // Constants
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const getWeekDayJP = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : dayNames[d.getDay()];
  };

  const getMonthDays = (baseDateStr: string) => {
    const baseDate = new Date(baseDateStr);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const daysList: string[] = [];
    for (let i = 1; i <= lastDay; i++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(i).padStart(2, "0");
      daysList.push(`${year}-${mm}-${dd}`);
    }
    return daysList;
  };

  const navigateMonth = (direction: number) => {
    const base = new Date(activeMonthDate);
    base.setMonth(base.getMonth() + direction);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    setActiveMonthDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleToggleWeeklyDesire = (dayIdx: number) => {
    if (!currentStaff) return;
    const currentDesires = currentStaff.weeklyDesire || [true, true, true, true, true, true, true];
    const updated = [...currentDesires];
    updated[dayIdx] = !updated[dayIdx];
    
    onUpdateStaff(
      currentStaff.id,
      currentStaff.name,
      currentStaff.phone,
      updated,
      currentStaff.specificOffs
    );
  };

  const handleAddOffDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff || !newOffDate) return;

    const currentOffs = currentStaff.specificOffs || [];
    if (currentOffs.includes(newOffDate)) {
      alert("この日付は既に休み希望に入っています。");
      return;
    }

    const updated = [...currentOffs, newOffDate].sort();
    
    // Auto-remove shift if they had it scheduled on this day
    const updatedShifts = shifts.map(sh => {
      if (sh.date === newOffDate) {
        return {
          ...sh,
          staffIds: sh.staffIds.filter(id => id !== currentStaff.id)
        };
      }
      return sh;
    });
    
    onUpdateStaff(
      currentStaff.id,
      currentStaff.name,
      currentStaff.phone,
      currentStaff.weeklyDesire,
      updated
    );
    onUpdateShifts(updatedShifts);
    setNewOffDate("");
  };

  const handleRemoveOffDate = (dateToRemove: string) => {
    if (!currentStaff) return;
    const currentOffs = currentStaff.specificOffs || [];
    const updated = currentOffs.filter((d) => d !== dateToRemove);

    onUpdateStaff(
      currentStaff.id,
      currentStaff.name,
      currentStaff.phone,
      currentStaff.weeklyDesire,
      updated
    );
  };

  return (
    <div className="space-y-6" id="staff-portal-view">
      
      {/* イントロ案内カード */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-500" />
              清掃スタッフ用・自己申告シフト登録ポータル
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            清掃員の皆様が自分自身で「曜日別の希望スケジュール」「特定の日付の休み希望（希望休）」「今月の各日の出勤希望」をいつでも申請・登録できる画面です。
          </p>
        </div>
        <div className="w-full md:w-auto">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full md:w-[260px] bg-indigo-50 border border-indigo-200/60 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">-- あなたの名前を選択してください --</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 未選択時のガイド表示 */}
      {!selectedStaffId && (
        <div className="bg-slate-100/60 border border-dashed border-slate-200 rounded-2xl py-20 text-center space-y-3">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-500">
            お名前が選択されていません
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            右上のプルダウンからあなたのお名前を選択して下さい。
            基本曜日希望や、今月の出勤希望スケジュールを自分でスマホやPCからポチポチ入力変更できます。
          </p>
        </div>
      )}

      {/* 選択された場合のメインシフト入力盤 */}
      {selectedStaffId && currentStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* 左カラム：基本設定（毎週の希望、特定の日付の休み希望） */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. 毎週の希望スケジュール */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Clock className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. 定常の毎週希望曜日（基本設定）
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                毎週決まって出勤できる曜日、または休みたい曜日を設定します。「自動作成ツール」を実行する際のベース希望になります。
              </p>

              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((name, idx) => {
                  const isDesire = (currentStaff.weeklyDesire || [true, true, true, true, true, true, true])[idx];
                  return (
                    <button
                      key={name}
                      onClick={() => handleToggleWeeklyDesire(idx)}
                      className={`py-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isDesire
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-150 text-slate-400"
                      }`}
                    >
                      <span>{name}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded-md ${isDesire ? "bg-emerald-100" : "bg-slate-200 text-slate-400"}`}>
                        {isDesire ? "出勤" : "休み"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-normal">
                💡 <b>ヒント:</b> 曜日マークをタップするだけで切替可能です。お休みの曜日から「休み」と登録してください。
              </p>
            </div>

            {/* 2. 特定の日付の休み希望（有給や用事） */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  2. イレギュラーな特定休・有休希望
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                通院、私用などで「この日は絶対に休みたい」という特定の日付を設定します。登録すると、その日付のシフトが優先的にお休みになります。
              </p>

              <form onSubmit={handleAddOffDate} className="flex gap-2">
                <input
                  type="date"
                  value={newOffDate}
                  onChange={(e) => setNewOffDate(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  希望休を追加
                </button>
              </form>

              {/* 登録中の休み希望一覧 */}
              <div className="space-y-1.5" id="staff-portal-specific-offs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  現在申請済みの休み希望一覧
                </span>
                
                {(currentStaff.specificOffs || []).length === 0 ? (
                  <p className="text-xs text-slate-300 italic py-2">
                    登録されている特定休み希望はありません。
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {(currentStaff.specificOffs || []).map((dateStr) => (
                      <div
                        key={dateStr}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-lg font-mono"
                      >
                        <span>{dateStr.replace(/-/g, "/")} ({getWeekDayJP(dateStr)})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOffDate(dateStr)}
                          className="hover:bg-rose-200/50 p-0.5 rounded text-rose-500 hover:text-rose-700 transition"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5 cursor-pointer" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 右カラム：今月のカレンダーシフト */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            
            {/* 年月ナビゲーション */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-500" />
                  3. {activeMonthDate.split("-")[0]}年 {activeMonthDate.split("-")[1]}月の出勤表
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  日付ごとの出勤/お休み希望をいつでも変更できます（タップで即時登録保存されます）。
                </p>
              </div>

              {/* ナビゲーター */}
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  前月
                </button>
                <span className="font-mono font-bold text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-250">
                  {activeMonthDate.split("-")[1]}月
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  翌月
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 日付別タイルリスト */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {getMonthDays(activeMonthDate).map((dayStr) => {
                const dayObj = new Date(dayStr);
                const dayNum = dayStr.split("-")[2];
                const weekName = getWeekDayJP(dayStr);
                
                const sh = shifts.find((s) => s.date === dayStr);
                const isWorking = sh ? sh.staffIds.includes(currentStaff.id) : false;
                
                // Specific Off Day Check
                const isRequestedOff = (currentStaff.specificOffs || []).includes(dayStr);

                return (
                  <button
                    key={dayStr}
                    type="button"
                    disabled={isRequestedOff}
                    onClick={() => onToggleShift(dayStr, currentStaff.id)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-[80px] transition-all relative select-none ${
                      isRequestedOff
                        ? "bg-rose-50/50 border-rose-100/50 text-rose-450 cursor-not-allowed opacity-70"
                        : isWorking
                          ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 shadow-3xs cursor-pointer"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-400 cursor-pointer"
                    }`}
                  >
                    {/* 日記・曜日 */}
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-extrabold text-slate-700">
                        {dayNum}日
                      </span>
                      <span className={`text-[10px] font-bold px-1 rounded ${
                        weekName === "日" ? "text-rose-500 bg-rose-50" :
                        weekName === "土" ? "text-blue-500 bg-blue-50" : "text-slate-500"
                      }`}>
                        ({weekName})
                      </span>
                    </div>

                    {/* ステータスバナー */}
                    <div className="flex items-center justify-between w-full">
                      {isRequestedOff ? (
                        <span className="text-[10px] text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded font-black">
                          希望休(休業)
                        </span>
                      ) : isWorking ? (
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                          <Check className="w-3 h-3 shrink-0" />
                          出勤 (ON)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-200/50 rounded">
                          休み (-)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-emerald-50/50 border border-emerald-150 p-3.5 rounded-2xl flex items-start gap-2 text-xs text-emerald-900 leading-normal">
              <Smile className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <b>保存について:</b> スタッフポータル内のすべての変更は、クリックした瞬間に **リアルタイムでシフト表に直接保存** されます。
                「出勤 (ON)」にした日程は、管理者のシフトマトリクス上でも即座に「出勤」に反映されます。
              </span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
