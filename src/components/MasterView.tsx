import React, { useState } from "react";
import { Staff, Room } from "../types";
import { Users, Bed, CreditCard, Plus, Trash2, Edit2, Check, DollarSign, Sliders, Sparkles } from "lucide-react";

interface MasterViewProps {
  staff: Staff[];
  rooms: Room[];
  onAddStaff: (name: string, phone: string, weeklyDesire?: boolean[], specificOffs?: string[]) => void;
  onUpdateStaff: (id: string, name: string, phone: string, weeklyDesire?: boolean[], specificOffs?: string[]) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateRoomPrice: (roomNumber: string, price: number) => void;
  onBulkUpdatePrices: (prices: { [roomNumber: string]: number }) => void;
}

export const MasterView: React.FC<MasterViewProps> = ({
  staff,
  rooms,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onUpdateRoomPrice,
  onBulkUpdatePrices,
}) => {
  // Staff form state
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");

  // Preference states for editing staff: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  const [editingWeeklyDesire, setEditingWeeklyDesire] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [editingSpecificOffs, setEditingSpecificOffs] = useState<string>("");

  // Room pricing states for toast feedback
  const [updatedRoomNum, setUpdatedRoomNum] = useState<string | null>(null);

  // Handle staff addition/submission
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;
    onAddStaff(staffName.trim(), staffPhone.trim());
    setStaffName("");
    setStaffPhone("");
  };

  // Convert editing
  const startEditStaff = (s: Staff) => {
    setEditingStaffId(s.id);
    setEditingName(s.name);
    setEditingPhone(s.phone);
    setEditingWeeklyDesire(s.weeklyDesire || [true, true, true, true, true, true, true]);
    setEditingSpecificOffs((s.specificOffs || []).join(", "));
  };

  const handleUpdateStaffSubmit = (id: string) => {
    if (!editingName.trim()) return;

    // Parse list of specific off dates (matches YYYY-MM-DD pattern)
    const parsedOffs = editingSpecificOffs
      .split(/[\s,，、\n]+/)
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

    onUpdateStaff(id, editingName.trim(), editingPhone.trim(), editingWeeklyDesire, parsedOffs);
    setEditingStaffId(null);
  };

  // Trigger individual price change
  const handlePriceChange = (roomNo: string, priceStr: string) => {
    const num = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num)) return;
    onUpdateRoomPrice(roomNo, num);

    // Provide quick visual toast effect
    setUpdatedRoomNum(roomNo);
    setTimeout(() => {
      setUpdatedRoomNum((curr) => (curr === roomNo ? null : curr));
    }, 1500);
  };

  // Set standard bulk templates
  const applyPriceTemplate = (type: "standard" | "premium" | "boost") => {
    const newPrices: { [roomNumber: string]: number } = {};
    rooms.forEach((r) => {
      if (type === "standard") {
        newPrices[r.number] = 1200;
      } else if (type === "premium") {
        // Larger rooms or suite get premium pricing
        if (r.number.endsWith("5")) {
          newPrices[r.number] = r.number === "405" ? 1600 : 1400;
        } else if (r.number.startsWith("4")) {
          newPrices[r.number] = 1300;
        } else {
          newPrices[r.number] = 1200;
        }
      } else {
        // High inflation/season pattern
        newPrices[r.number] = r.number === "405" ? 1800 : r.number.endsWith("5") ? 1500 : 1350;
      }
    });

    onBulkUpdatePrices(newPrices);
  };

  // Format currency helper
  const formatYen = (num: number) => `¥${num.toLocaleString("ja-JP")}`;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="master-view-root">
      
      {/* 1. 左側: スタッフ登録・一覧 (7 columns) */}
      <div className="lg:col-span-7 space-y-6" id="staff-master-panel">
        
        {/* 新規スタッフ登録カード */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            清掃スタッフ新規登録
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            新しく清掃業務を担当するスタッフの氏名と連絡先をマスター登録します（氏名は必須です）。
          </p>

          <form onSubmit={handleAddStaffSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3" id="add-staff-form">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">氏名 (必須)</label>
              <input
                type="text"
                placeholder="例: 佐藤 二郎"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-800"
                id="staff-name-input"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">連絡先電話番号 (任意)</label>
              <input
                type="tel"
                placeholder="例: 090-1234-5678"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-800"
                id="staff-phone-input"
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer h-[34px] shadow-sm shadow-indigo-150"
                id="submit-staff-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                追加
              </button>
            </div>
          </form>
        </div>

        {/* スタッフ一覧カード */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">登録済み清掃スタッフ一覧</h3>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full font-mono">
              全 {staff.length} 名が登録中
            </span>
          </div>

          <div className="overflow-x-auto" id="staff-master-table-wrapper">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">スタッフID</th>
                  <th className="py-2.5 px-3">清掃員氏名</th>
                  <th className="py-2.5 px-3">電話番号</th>
                  <th className="py-2.5 px-3 min-w-[200px]">シフト稼働希望</th>
                  <th className="py-2.5 px-3 text-right">管理操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      スタッフが登録されていません。上の新規登録フォームより追加してください。
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => {
                    const isEditing = editingStaffId === s.id;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors" id={`staff-row-${s.id}`}>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {s.id}
                        </td>
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 w-full outline-none focus:border-indigo-500"
                              id={`edit-staff-name-${s.id}`}
                            />
                          ) : (
                            <span className="text-slate-700 font-bold block">{s.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editingPhone}
                              onChange={(e) => setEditingPhone(e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono text-slate-850 w-full outline-none focus:border-indigo-500"
                              id={`edit-staff-phone-${s.id}`}
                            />
                          ) : (
                            <span className="text-slate-500 font-mono block">{s.phone || "---"}</span>
                          )}
                        </td>
                        
                        {/* 希望シフトのカラム */}
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <div className="space-y-2 py-1">
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block mb-1">希望出勤曜日:</span>
                                <div className="flex gap-1 flex-wrap">
                                  {["日", "月", "火", "水", "木", "金", "土"].map((dayName, idx) => (
                                    <label key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] select-none cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editingWeeklyDesire[idx]}
                                        onChange={(e) => {
                                          const updated = [...editingWeeklyDesire];
                                          updated[idx] = e.target.checked;
                                          setEditingWeeklyDesire(updated);
                                        }}
                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                      />
                                      <span>{dayName}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold block mb-1">個別休み希望日 (YYYY-MM-DD 形式, カンマ等区切り):</span>
                                <input
                                  type="text"
                                  placeholder="例: 2026-06-15, 2026-06-25"
                                  value={editingSpecificOffs}
                                  onChange={(e) => setEditingSpecificOffs(e.target.value)}
                                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-800 w-full outline-none focus:border-indigo-500"
                                  id={`edit-staff-specificOffs-${s.id}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 py-1">
                              {/* 曜日表示 */}
                              <div className="flex gap-0.5">
                                {["日", "月", "火", "水", "木", "金", "土"].map((dayName, idx) => {
                                  const desires = s.weeklyDesire || [true, true, true, true, true, true, true];
                                  const isDesired = desires[idx];
                                  return (
                                    <span
                                      key={idx}
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                        isDesired
                                          ? idx === 0 
                                            ? "bg-rose-50 border border-rose-100 text-rose-600 font-bold"
                                            : idx === 6
                                              ? "bg-blue-50 border border-blue-100 text-blue-600 font-bold"
                                              : "bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold"
                                          : "bg-slate-100 text-slate-300 line-through"
                                      }`}
                                    >
                                      {dayName}
                                    </span>
                                  );
                                })}
                              </div>
                              {/* 特定日・希望休の日程表示 */}
                              {s.specificOffs && s.specificOffs.length > 0 ? (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100/50 px-1 py-0.5 rounded">
                                    希望休
                                  </span>
                                  <div className="flex gap-1 flex-wrap">
                                    {s.specificOffs.slice(0, 5).map((d) => (
                                      <span key={d} className="text-[9px] text-slate-550 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded font-mono">
                                        {d.split("-")[1]}/{d.split("-")[2]}
                                      </span>
                                    ))}
                                    {s.specificOffs.length > 5 && (
                                      <span className="text-[9px] text-slate-400 font-semibold font-mono">
                                        +{s.specificOffs.length - 5}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-normal block leading-none">
                                  （特定日の休み希望なし）
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5 select-none">
                              <button
                                onClick={() => handleUpdateStaffSubmit(s.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                                id={`save-staff-btn-${s.id}`}
                              >
                                <Check className="w-3 h-3" /> 保存
                              </button>
                              <button
                                onClick={() => setEditingStaffId(null)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded transition-colors cursor-pointer"
                                id={`cancel-staff-btn-${s.id}`}
                              >
                                キャル
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5 select-none">
                              <button
                                onClick={() => startEditStaff(s)}
                                className="p-1 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                id={`edit-staff-btn-${s.id}`}
                              >
                                <Edit2 className="w-3 h-3" />
                                編集
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`${s.name}様を削除しますか？これまでの清掃割当データ上でスタッフ名称が見つからない場合があります。`)) {
                                    onDeleteStaff(s.id);
                                  }
                                }}
                                className="p-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                id={`delete-staff-btn-${s.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                                削除
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. 右側: 客室設定・単価管理 (5 columns) */}
      <div className="lg:col-span-5 space-y-6" id="room-master-panel">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Bed className="w-4 h-4 text-indigo-600" />
              客室・基本清掃単価設定
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              12室固定仕様
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            部屋ごとの清掃基本単価を設定します。変更した値は即時保存され、次回以降に割り当てられる客室の単価に反映されます。
          </p>

          {/* クイックセットテンプレート */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              単価テンプレートの適用（一括改定）
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyPriceTemplate("standard")}
                className="py-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-[10px] font-bold rounded-lg transition-all text-slate-600 cursor-pointer"
                id="tmpl-standard-btn"
              >
                標準 ¥1,200
              </button>
              <button
                onClick={() => applyPriceTemplate("premium")}
                className="py-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-[10px] font-bold rounded-lg transition-all text-slate-600 cursor-pointer"
                id="tmpl-premium-btn"
              >
                角室・大部屋割増
              </button>
              <button
                onClick={() => applyPriceTemplate("boost")}
                className="py-1.5 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-[10px] font-bold rounded-lg transition-all text-slate-600 cursor-pointer"
                id="tmpl-boost-btn"
              >
                繁忙期インフレ
              </button>
            </div>
          </div>

          {/* 12部屋インプット一覧 */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1" id="rooms-price-rows">
            {rooms.map((room) => {
              const isUpdated = updatedRoomNum === room.number;

              return (
                <div
                  key={room.number}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isUpdated
                      ? "bg-emerald-50 border-emerald-250 shadow-3xs"
                      : "bg-slate-50 hover:bg-slate-100/55 border-slate-200/60"
                  }`}
                  id={`room-price-row-${room.number}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs bg-slate-900 text-white font-bold px-2 py-0.5 rounded font-mono">
                      {room.number}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold font-display">号室</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-mono">
                        ¥
                      </span>
                      <input
                        type="text"
                        value={room.defaultPrice}
                        onChange={(e) => handlePriceChange(room.number, e.target.value)}
                        className="w-24 bg-white border border-slate-200 rounded-lg pl-6 pr-2.5 py-1 text-right text-xs font-semibold font-mono focus:outline-none focus:border-indigo-500 transition-all text-slate-800"
                        id={`room-defaultPrice-input-${room.number}`}
                      />
                    </div>

                    <div className="w-5 h-5 flex items-center justify-center">
                      {isUpdated ? (
                        <span className="text-emerald-600 animate-pulse font-bold text-xs">✓</span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[10px] font-bold">JPY</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
