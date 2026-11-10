import type { UserProgress } from '../types';

const XP_VALUES = {
  flashcardEasy: 15,
  flashcardGood: 10,
  flashcardHard: 5,
  flashcardAgain: 0,
  writeCorrect: 15,
  writeClose: 10,
  writeWrong: 0,
  quizCorrect: 10,
  quizWrong: 0,
  speedMatchComplete: 20,
  wordDropCorrect: 10,
  streakBonus: 25,
} as const;

export { XP_VALUES };

export function getToday(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = getToday();
  const previous = new Date();
  previous.setDate(previous.getDate() - 1);
  const yesterday = getToday(previous);

  if (progress.lastStudyDate === today) {
    return progress;
  }

  let newStreak: number;
  let xpBonus = 0;

  if (progress.lastStudyDate === yesterday) {
    newStreak = progress.streak + 1;
    xpBonus = XP_VALUES.streakBonus;
  } else if (!progress.lastStudyDate) {
    newStreak = 1;
  } else {
    newStreak = 1;
  }

  return {
    ...progress,
    streak: newStreak,
    lastStudyDate: today,
    xp: progress.xp + xpBonus,
    dailyProgress: progress.dailyProgressDate === today ? progress.dailyProgress : 0,
    dailyProgressDate: today,
  };
}

export function ensureDailyProgress(progress: UserProgress): UserProgress {
  const today = getToday();
  if (progress.dailyProgressDate === today) {
    return progress;
  }
  return {
    ...progress,
    dailyProgress: 0,
    dailyProgressDate: today,
  };
}

export function addXP(progress: UserProgress, amount: number): UserProgress {
  const today = getToday();
  return {
    ...progress,
    xp: progress.xp + amount,
    dailyProgress: (progress.dailyProgressDate === today ? progress.dailyProgress : 0) + 1,
    dailyProgressDate: today,
    lastStudyDate: today,
  };
}
