import React from 'react';
import { Check, Trash2, Copy, Sun, Sunset, Moon, ArrowUp, ArrowDown } from 'lucide-react';
import { Habit, Kid, HabitPeriod } from '../types';

interface HabitListProps {
  kid: Kid;
  habits: Habit[];
  completedHabitIds: Set<string>; // Set of habit IDs completed today by this kid
  onToggleHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onCopyHabitToSibling: (habit: Habit) => void;
  onMoveHabit: (kidId: string, habit: Habit, direction: 'up' | 'down') => void;
}

const HabitList: React.FC<HabitListProps> = ({ 
  kid, 
  habits, 
  completedHabitIds, 
  onToggleHabit,
  onDeleteHabit,
  onCopyHabitToSibling,
  onMoveHabit
}) => {
  const kidHabits = habits.filter(h => h.assignedTo.includes(kid.id));
  
  const checkColor = kid.themeColor === 'pink' ? 'text-pink-600 bg-pink-100' : 'text-blue-600 bg-blue-100';
  const borderColor = kid.themeColor === 'pink' ? 'hover:border-pink-300' : 'hover:border-blue-300';

  if (kidHabits.length === 0) {
    return (
      <div className="text-center py-10 opacity-50 bg-white/50 rounded-xl border border-dashed border-gray-300">
        <p>Chưa có hoạt động nào.</p>
        <p className="text-sm">Hãy thêm hoạt động mới cho bé!</p>
      </div>
    );
  }

  const renderSection = (period: HabitPeriod, icon: React.ReactNode, title: string) => {
    const periodHabits = kidHabits.filter(h => h.period === period);
    
    // Sort by order instead of completion status
    const sortedHabits = [...periodHabits].sort((a, b) => a.order - b.order);

    if (sortedHabits.length === 0) return null;

    return (
      <div className="mb-4 last:mb-0">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
            {icon} {title}
        </h4>
        <div className="space-y-3">
          {sortedHabits.map((habit, index) => {
            const isCompleted = completedHabitIds.has(habit.id);
            const isFirst = index === 0;
            const isLast = index === sortedHabits.length - 1;
            const points = habit.points || 1;
            
            return (
              <div 
                key={habit.id}
                className={`group flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border-2 border-transparent ${borderColor} transition-all ${isCompleted ? 'opacity-75 bg-gray-50' : 'hover:shadow-md'}`}
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onToggleHabit(habit.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${isCompleted ? 'bg-green-100 grayscale' : 'bg-gray-100 group-hover:bg-yellow-100'}`}>
                    {habit.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-gray-800 transition-all ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                      {habit.title}
                    </span>
                    {isCompleted ? (
                      <span className="text-xs text-green-600 font-bold">Đã xong! +{points} điểm</span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">+{points} điểm</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex flex-col mr-2">
                     {!isFirst && (
                       <button
                         onClick={(e) => { e.stopPropagation(); onMoveHabit(kid.id, habit, 'up'); }}
                         className="p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full"
                         title="Di chuyển lên"
                       >
                         <ArrowUp size={12} />
                       </button>
                     )}
                     {!isLast && (
                       <button
                         onClick={(e) => { e.stopPropagation(); onMoveHabit(kid.id, habit, 'down'); }}
                         className="p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full"
                         title="Di chuyển xuống"
                       >
                         <ArrowDown size={12} />
                       </button>
                     )}
                   </div>

                   <button 
                    onClick={(e) => { e.stopPropagation(); onCopyHabitToSibling(habit); }}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full"
                    title="Sao chép cho bé còn lại"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                    title="Xóa hoạt động"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div 
                    onClick={() => onToggleHabit(habit.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-transparent hover:border-gray-300'}`}
                  >
                    <Check size={16} strokeWidth={4} />
                  </div>
                </div>
                 {/* Mobile Checkbox always visible fallback */}
                 <div 
                    onClick={() => onToggleHabit(habit.id)}
                    className={`md:hidden w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ml-2 ${isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-transparent'}`}
                  >
                    <Check size={16} strokeWidth={4} />
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection('morning', <Sun size={16} className="text-orange-400" />, 'Buổi Sáng')}
      {renderSection('afternoon', <Sunset size={16} className="text-yellow-500" />, 'Buổi Trưa')}
      {renderSection('evening', <Moon size={16} className="text-indigo-500" />, 'Buổi Tối')}
      
      {/* Render uncategorized or legacy habits if any */}
      {renderSection(undefined as any, <Check size={16} />, 'Khác')}
    </div>
  );
};

export default HabitList;