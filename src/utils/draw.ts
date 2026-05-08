import { tarotCards } from '@/data/tarotData';
import type { TarotCard } from '@/data/tarotData';

export interface DrawnCard extends TarotCard {
  isReversed: boolean;
}

export function drawCards(slotCount: number): DrawnCard[] {
  const deck = JSON.parse(JSON.stringify(tarotCards)) as TarotCard[];

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const drawn = deck.slice(0, slotCount);
  return drawn.map((card) => ({
    ...card,
    isReversed: Math.random() < 0.5,
  }));
}
