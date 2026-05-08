import type { Spread } from '@/data/spreads';
import type { DrawnCard } from '@/utils/draw';
import type { Reading } from '@/utils/interpreter';
import type { FollowUpRecord } from '@/utils/followup';

export interface CurrentReading {
  id: string;
  question: string;
  spread: Spread;
  cards: DrawnCard[];
  reading: Reading;
  timestamp: number;
  followUps?: FollowUpRecord[];
}

let currentReading: CurrentReading | null = null;

export function setCurrentReading(r: CurrentReading): void {
  currentReading = r;
}

export function getCurrentReading(): CurrentReading | null {
  return currentReading;
}

export function clearCurrentReading(): void {
  currentReading = null;
}
