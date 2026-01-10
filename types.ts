export interface Kid {
  id: string;
  name: string;
  avatar: string; // URL or emoji
  themeColor: string; // Tailwind color class prefix (e.g., 'pink', 'blue')
  currentScore: number;
  redeemedPoints: number; // Total points spent on rewards
}

export type HabitPeriod = 'morning' | 'afternoon' | 'evening';

export interface Habit {
  id: string;
  title: string;
  icon: string; // Emoji
  assignedTo: string[]; // Array of Kid IDs
  period: HabitPeriod;
  order: number;
  date?: string; // Optional: YYYY-MM-DD. If present, only applies to this date. If undefined, applies every day.
}

// A record of a completed habit
export interface ActivityLog {
  id: string;
  habitId: string;
  kidId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface RewardSuggestion {
  title: string;
  description: string;
  pointsCost: number;
}

export interface ActivitySuggestion {
  title: string;
  icon: string;
  reason: string;
}