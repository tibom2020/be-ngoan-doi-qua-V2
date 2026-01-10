import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Wand2, PartyPopper, Calendar as CalendarIcon, History, X, Trophy, AlertTriangle } from 'lucide-react';
import KidCard from './components/KidCard';
import HabitList from './components/HabitList';
import StatsChart from './components/StatsChart';
import { Kid, Habit, ActivityLog, ActivitySuggestion, RewardSuggestion, HabitPeriod } from './types';
import { suggestActivities, suggestRewards } from './services/geminiService';

// Initial Data
const INITIAL_KIDS: Kid[] = [
  { id: 'k1', name: 'Tí Nị', avatar: 'https://picsum.photos/id/64/200/200', themeColor: 'pink', currentScore: 0, redeemedPoints: 0 },
  { id: 'k2', name: 'Bơm', avatar: 'https://picsum.photos/id/237/200/200', themeColor: 'blue', currentScore: 0, redeemedPoints: 0 },
];

const INITIAL_HABITS: Habit[] = [
  { id: 'h5', title: 'Thức dậy đúng giờ', icon: '⏰', assignedTo: ['k1', 'k2'], period: 'morning', order: 0 },
  { id: 'h1', title: 'Đánh răng buổi sáng', icon: '🦷', assignedTo: ['k1', 'k2'], period: 'morning', order: 1 },
  { id: 'h2', title: 'Ăn hết phần rau', icon: '🥦', assignedTo: ['k1', 'k2'], period: 'afternoon', order: 0 },
  { id: 'h4', title: 'Hoàn thành nhiệm vụ trước khi ngủ', icon: '📝', assignedTo: ['k1', 'k2'], period: 'evening', order: 0 },
  { id: 'h3', title: 'Đi ngủ trước 9h', icon: '😴', assignedTo: ['k1', 'k2'], period: 'evening', order: 1 },
  { id: 'h6', title: 'Không xem iPad và ti vi quá 1H giờ', icon: '📵', assignedTo: ['k1', 'k2'], period: 'evening', order: 2 },
];

function App() {
  // --- State ---
  const [kids, setKids] = useState<Kid[]>(() => {
    try {
      const saved = localStorage.getItem('kids');
      return saved ? JSON.parse(saved) : INITIAL_KIDS;
    } catch (e) {
      console.error("Lỗi đọc dữ liệu kids:", e);
      return INITIAL_KIDS;
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem('habits');
      // Migration for old data without period/order
      let parsed: Habit[] = saved ? JSON.parse(saved) : INITIAL_HABITS;
      
      // Auto-migration: Ensure "Không xem iPad" exists if missing in old data
      const noIpadHabit = INITIAL_HABITS.find(h => h.id === 'h6');
      if (noIpadHabit && !parsed.some(h => h.id === 'h6' || h.title === 'Không xem iPad')) {
        parsed.push(noIpadHabit);
      }

      return parsed.map((h, index) => ({
        ...h, 
        period: h.period || 'morning',
        order: h.order !== undefined ? h.order : index
      }));
    } catch (e) {
      return INITIAL_HABITS;
    }
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isStatsView, setIsStatsView] = useState(false);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState<{kid: Kid, suggestions: RewardSuggestion[]} | null>(null);
  
  // Penalty State
  const [showPenaltyModal, setShowPenaltyModal] = useState<Kid | null>(null);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(5);

  const [isGenerating, setIsGenerating] = useState(false);

  // New Habit State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🌟');
  const [newHabitAssignee, setNewHabitAssignee] = useState<string>('all');
  const [newHabitPeriod, setNewHabitPeriod] = useState<HabitPeriod>('morning');
  const [aiSuggestions, setAiSuggestions] = useState<ActivitySuggestion[]>([]);

  // --- Effects ---
  useEffect(() => {
    try {
      localStorage.setItem('kids', JSON.stringify(kids));
    } catch (e) {
      alert("Bộ nhớ trình duyệt đã đầy! Không thể lưu ảnh mới. Vui lòng thử ảnh nhỏ hơn hoặc xóa bớt dữ liệu cũ.");
      console.error("Quota exceeded:", e);
    }
  }, [kids]);

  useEffect(() => {
    try {
      localStorage.setItem('habits', JSON.stringify(habits));
    } catch (e) { console.error(e); }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem('logs', JSON.stringify(logs));
    } catch (e) { console.error(e); }
  }, [logs]);

  // --- Helpers ---
  
  // Filter habits that apply to the current date (either specific date or recurring)
  const getHabitsForCurrentDate = () => {
    return habits.filter(h => !h.date || h.date === currentDate);
  };

  const getTodayCompletedHabitIds = (kidId: string) => {
    return new Set(
      logs
        .filter(l => l.date === currentDate && l.kidId === kidId)
        .map(l => l.habitId)
    );
  };

  const handleUpdateKid = (updatedKid: Kid) => {
    setKids(kids.map(k => k.id === updatedKid.id ? updatedKid : k));
  };

  const handleToggleHabit = (kidId: string, habitId: string) => {
    const existingLogIndex = logs.findIndex(
      l => l.date === currentDate && l.kidId === kidId && l.habitId === habitId
    );

    let newLogs = [...logs];
    let scoreDelta = 0;

    if (existingLogIndex >= 0) {
      // Uncheck: Remove log, decrease score
      newLogs.splice(existingLogIndex, 1);
      scoreDelta = -1;
    } else {
      // Check: Add log, increase score
      newLogs.push({
        id: Date.now().toString(),
        date: currentDate,
        kidId,
        habitId,
        timestamp: Date.now(),
      });
      scoreDelta = 1;
    }

    setLogs(newLogs);
    setKids(kids.map(k => 
      k.id === kidId ? { ...k, currentScore: Math.max(0, k.currentScore + scoreDelta) } : k
    ));
  };

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Bạn có chắc muốn xóa hoạt động này không?')) {
      setHabits(habits.filter(h => h.id !== habitId));
    }
  };

  const handleCopyHabitToSibling = (habit: Habit) => {
    // If assigned to all, do nothing. If assigned to one, add the other.
    if (habit.assignedTo.length === kids.length) return;
    
    const missingKidId = kids.find(k => !habit.assignedTo.includes(k.id))?.id;
    if (missingKidId) {
        const updatedHabit = { ...habit, assignedTo: [...habit.assignedTo, missingKidId] };
        setHabits(habits.map(h => h.id === habit.id ? updatedHabit : h));
    }
  };

  const handleMoveHabit = (kidId: string, habit: Habit, direction: 'up' | 'down') => {
    // We only reorder within the context of the current kid, period, AND date visibility
    const relevantHabits = habits
      .filter(h => 
        h.assignedTo.includes(kidId) && 
        h.period === habit.period &&
        (!h.date || h.date === currentDate)
      )
      .sort((a, b) => a.order - b.order);

    const currentIndex = relevantHabits.findIndex(h => h.id === habit.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= relevantHabits.length) return;

    const targetHabit = relevantHabits[targetIndex];

    // Swap orders
    const newHabits = habits.map(h => {
      if (h.id === habit.id) return { ...h, order: targetHabit.order };
      if (h.id === targetHabit.id) return { ...h, order: habit.order };
      return h;
    });

    setHabits(newHabits);
  };

  const handleAddHabit = () => {
    if (!newHabitTitle.trim()) return;

    const assignedTo = newHabitAssignee === 'all' ? kids.map(k => k.id) : [newHabitAssignee];
    
    // Find max order in this period to append to end
    const maxOrder = habits
      .filter(h => h.period === newHabitPeriod)
      .reduce((max, h) => Math.max(max, h.order), 0);

    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newHabitTitle,
      icon: newHabitIcon,
      assignedTo,
      period: newHabitPeriod,
      order: maxOrder + 1,
      date: currentDate // STRICTLY BIND TO CURRENT DATE
    };

    setHabits([...habits, newHabit]);
    setNewHabitTitle('');
    setShowAddModal(false);
  };

  const handleAiSuggestActivities = async () => {
    setIsGenerating(true);
    const suggestions = await suggestActivities(kids.map(k => k.name));
    setAiSuggestions(suggestions);
    setIsGenerating(false);
  };

  const handleApplySuggestion = (sug: ActivitySuggestion) => {
    setNewHabitTitle(sug.title);
    setNewHabitIcon(sug.icon);
    // Suggest a period based on keywords (simple heuristic)
    if (sug.title.toLowerCase().includes('ngủ') || sug.title.toLowerCase().includes('tối')) {
      setNewHabitPeriod('evening');
    } else if (sug.title.toLowerCase().includes('ăn') || sug.title.toLowerCase().includes('trưa')) {
      setNewHabitPeriod('afternoon');
    } else {
      setNewHabitPeriod('morning');
    }
  };

  const handleRedeemReward = async (kid: Kid) => {
    setIsGenerating(true);
    const suggestions = await suggestRewards(kid.currentScore, kid.name);
    setIsGenerating(false);
    setShowRewardModal({ kid, suggestions });
  };

  const confirmRedeem = (cost: number) => {
    if (!showRewardModal) return;
    const { kid } = showRewardModal;
    
    setKids(kids.map(k => 
      k.id === kid.id 
        ? { ...k, currentScore: k.currentScore - cost, redeemedPoints: k.redeemedPoints + cost } 
        : k
    ));
    setShowRewardModal(null);
  };

  // Penalty Logic
  const handleOpenPenaltyModal = (kid: Kid) => {
    setPenaltyPoints(5);
    setPenaltyReason('');
    setShowPenaltyModal(kid);
  };

  const handleConfirmPenalty = () => {
    if (!showPenaltyModal) return;
    
    setKids(kids.map(k => 
      k.id === showPenaltyModal.id
      ? { ...k, currentScore: Math.max(0, k.currentScore - penaltyPoints) }
      : k
    ));
    setShowPenaltyModal(null);
  };

  // --- Render ---

  const visibleHabits = getHabitsForCurrentDate();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-2 rounded-lg text-white">
              <Trophy size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 leading-tight">Bé Ngoan Đổi Quà</h1>
              <p className="text-xs text-gray-500 font-semibold">{new Date(currentDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsStatsView(!isStatsView)}
              className={`p-2 rounded-xl transition-colors ${isStatsView ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isStatsView ? <CalendarIcon size={24} /> : <History size={24} />}
            </button>
            <input 
              type="date" 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-gray-100 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 outline-none"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Score Board */}
        {!isStatsView && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kids.map(kid => (
              <KidCard 
                key={kid.id} 
                kid={kid} 
                onRedeem={handleRedeemReward}
                onUpdateKid={handleUpdateKid}
                onPenalty={handleOpenPenaltyModal}
              />
            ))}
          </div>
        )}

        {/* Content Area */}
        {isStatsView ? (
          <StatsChart logs={logs} kids={kids} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {kids.map(kid => (
              <div key={kid.id} className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${kid.themeColor === 'pink' ? 'text-pink-600' : 'text-blue-600'}`}>
                    Hoạt động của {kid.name}
                  </h3>
                  <span className="text-xs font-semibold bg-white px-2 py-1 rounded-md shadow-sm text-gray-500">
                    {getTodayCompletedHabitIds(kid.id).size}/{visibleHabits.filter(h => h.assignedTo.includes(kid.id)).length} hoàn thành
                  </span>
                </div>
                
                <HabitList 
                  kid={kid}
                  habits={visibleHabits}
                  completedHabitIds={getTodayCompletedHabitIds(kid.id)}
                  onToggleHabit={(habitId) => handleToggleHabit(kid.id, habitId)}
                  onDeleteHabit={handleDeleteHabit}
                  onCopyHabitToSibling={handleCopyHabitToSibling}
                  onMoveHabit={handleMoveHabit}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button 
        onClick={() => { setShowAddModal(true); setAiSuggestions([]); }}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-400/50 hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95 z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus size={24} /> Thêm Hoạt Động Mới
              </h3>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-indigo-500 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 border border-blue-100 flex items-start gap-2">
                 <CalendarIcon size={16} className="mt-0.5 shrink-0"/>
                 <span>Hoạt động này sẽ chỉ được thêm vào ngày <b>{new Date(currentDate).toLocaleDateString('vi-VN')}</b>.</span>
              </div>

              {/* AI Suggestion Section */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                    < Wand2 size={16} /> Gợi ý thông minh
                  </h4>
                  <button 
                    onClick={handleAiSuggestActivities}
                    disabled={isGenerating}
                    className="text-xs bg-white border border-indigo-200 px-3 py-1 rounded-full text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? 'Đang suy nghĩ...' : 'Hỏi AI Gemini'}
                  </button>
                </div>
                {aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((sug, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleApplySuggestion(sug)}
                        className="text-xs bg-white shadow-sm border border-indigo-100 px-3 py-2 rounded-lg text-left hover:border-indigo-300 transition-colors flex items-center gap-2"
                      >
                        <span>{sug.icon}</span>
                        <span>{sug.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên hoạt động</label>
                  <input 
                    type="text" 
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    placeholder="Ví dụ: Đọc sách 15 phút"
                    className="w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 bg-gray-50"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biểu tượng</label>
                    <input 
                      type="text" 
                      value={newHabitIcon}
                      onChange={(e) => setNewHabitIcon(e.target.value)}
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 bg-gray-50 text-center text-2xl"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                    <select 
                      value={newHabitPeriod}
                      onChange={(e) => setNewHabitPeriod(e.target.value as HabitPeriod)}
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 bg-gray-50"
                    >
                      <option value="morning">Buổi Sáng</option>
                      <option value="afternoon">Buổi Trưa</option>
                      <option value="evening">Buổi Tối</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Dành cho</label>
                    <select 
                      value={newHabitAssignee}
                      onChange={(e) => setNewHabitAssignee(e.target.value)}
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 bg-gray-50"
                    >
                      <option value="all">Cả hai bé</option>
                      {kids.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddHabit}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
              >
                Thêm Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
            <div className="bg-red-500 p-6 text-white">
              <AlertTriangle size={48} className="mx-auto mb-2 opacity-90" />
              <h3 className="text-xl font-bold">Trừ điểm vi phạm</h3>
              <p className="text-red-100">{showPenaltyModal.name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Lý do vi phạm</label>
                <input 
                  type="text" 
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="Ví dụ: Không nghe lời, Đánh nhau..."
                  className="w-full border-red-200 rounded-xl shadow-sm focus:border-red-500 focus:ring-red-500 px-4 py-2 bg-red-50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Số điểm phạt</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 justify-center">
                    {[5, 10, 20].map(points => (
                      <button
                        key={points}
                        onClick={() => setPenaltyPoints(points)}
                        className={`flex-1 py-2 rounded-xl font-bold transition-all ${penaltyPoints === points ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-red-100'}`}
                      >
                        -{points}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                      className="w-full border-red-200 rounded-xl shadow-sm focus:border-red-500 focus:ring-red-500 pl-4 pr-4 py-2 bg-red-50 text-center font-bold text-red-600 text-lg"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400 font-bold">-</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button 
                onClick={() => setShowPenaltyModal(null)}
                className="flex-1 py-3 text-gray-500 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Bỏ qua
              </button>
              <button 
                onClick={handleConfirmPenalty}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors"
              >
                Xác nhận phạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-yellow-400/80 to-orange-500/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-center relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
            
            <div className="p-8">
              <div className="mb-6 inline-block p-4 rounded-full bg-yellow-100 text-yellow-600">
                <PartyPopper size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Chúc Mừng {showRewardModal.kid.name}!</h2>
              <p className="text-gray-500 text-lg mb-6">Bé đã xuất sắc đạt 100 điểm!</p>

              <div className="bg-orange-50 rounded-2xl p-4 mb-6 text-left">
                <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                  <Wand2 size={16} /> Gợi ý phần thưởng từ AI
                </h4>
                {isGenerating ? (
                  <div className="text-center py-4 text-gray-500">Đang tìm ý tưởng hay ho...</div>
                ) : (
                  <div className="space-y-2">
                    {showRewardModal.suggestions.map((sug, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
                        <p className="font-bold text-gray-800">{sug.title}</p>
                        <p className="text-xs text-gray-500">{sug.description}</p>
                      </div>
                    ))}
                    {showRewardModal.suggestions.length === 0 && (
                      <p className="text-sm text-gray-400 text-center">Không có gợi ý nào lúc này.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                  onClick={() => confirmRedeem(100)}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-extrabold text-xl rounded-2xl shadow-xl hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  Nhận Quà & Trừ 100 Điểm
                </button>
                <button 
                  onClick={() => setShowRewardModal(null)}
                  className="w-full py-3 text-gray-400 font-semibold hover:text-gray-600"
                >
                  Để dành điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;