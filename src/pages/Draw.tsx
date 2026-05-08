import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tarotCards } from '@/data/tarotData';
import type { TarotCard } from '@/data/tarotData';
import { SPREADS } from '@/data/spreads';
import type { Spread } from '@/data/spreads';
import { setCurrentReading } from '@/utils/session';
import { generateReading } from '@/utils/interpreter';
import type { DrawnCard } from '@/utils/draw';

interface DeckCard extends TarotCard {
  selected: boolean;
  isReversed: boolean;
}

/* ------------------------------------------------------------------ */
/*  Card Back Design (lightweight for 78 instances)                   */
/* ------------------------------------------------------------------ */

function CardBackFace({ mini = false }: { mini?: boolean }) {
  return (
    <div
      className={`relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center select-none
        ${mini ? 'border border-purple-200/50' : 'border border-purple-300/50'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, #f0e6ff 50%, #ffe6f0 100%)',
        boxShadow: 'inset 0 0 20px rgba(123,44,191,0.05), inset 0 0 40px rgba(196,79,212,0.03)',
      }}
    >
      {/* Pink-purple sheen */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(196,79,212,0.06) 0%, rgba(196,79,212,0) 50%)' }}
      />
      {/* Star dust */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(123,44,191,0.2) 1px, transparent 1px), radial-gradient(circle, rgba(196,79,212,0.12) 2px, transparent 2px)',
          backgroundSize: '30px 30px, 50px 50px',
          backgroundPosition: '0 0, 15px 15px',
        }}
      />
      {/* Center symbol */}
      <div className={`text-[#c44fd4]/30 ${mini ? 'text-lg' : 'text-3xl md:text-4xl'}`}>&#10041;</div>
      {/* Corner ornaments */}
      <div className="absolute top-1 left-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
      <div className="absolute top-1 right-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
      <div className="absolute bottom-1 left-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
      <div className="absolute bottom-1 right-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Draw Page                                                     */
/* ------------------------------------------------------------------ */

export default function Draw() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spreadId = searchParams.get('spreadId') || 'three';
  const question = searchParams.get('question') || sessionStorage.getItem('mystictarot_question') || '';

  const spread = SPREADS.find((s) => s.id === spreadId);

  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [flashCardId, setFlashCardId] = useState<number | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  // Guard: invalid spread
  useEffect(() => {
    if (!spread) {
      navigate('/');
    }
  }, [spread, navigate]);

  // Initialize & shuffle
  useEffect(() => {
    const initial: DeckCard[] = tarotCards.map((card) => ({
      ...card,
      selected: false,
      isReversed: false,
    }));
    // Fisher-Yates shuffle
    for (let i = initial.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initial[i], initial[j]] = [initial[j], initial[i]];
    }
    setDeck(initial);
    const timer = setTimeout(() => setIsShuffling(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const onCardClick = useCallback(
    (id: number) => {
      if (isShuffling || isRevealing || allRevealed) return;
      
      setDeck((prev) => {
        const card = prev.find((c) => c.id === id);
        if (!card) return prev;
        if (card.selected) {
          setSelectedCount((c) => c - 1);
          return prev.map((c) => (c.id === id ? { ...c, selected: false } : c));
        }
        const currentSelected = prev.filter((c) => c.selected).length;
        if (currentSelected >= (spread?.cardCount ?? 0)) {
          setToastMsg(`本阵法仅需 ${spread?.cardCount ?? 0} 张牌`);
          return prev;
        }
        
        // Haptic feedback on selection
        if (navigator.vibrate) navigator.vibrate(50);
        setLastSelectedId(id);
        
        setSelectedCount((c) => c + 1);
        return prev.map((c) => (c.id === id ? { ...c, selected: true } : c));
      });
    },
    [isShuffling, isRevealing, allRevealed, spread]
  );

  const revealCards = useCallback(() => {
    if (!spread) return;
    setIsRevealing(true);

    // Assign orientation randomly
    setDeck((prev) =>
      prev.map((card) =>
        card.selected ? { ...card, isReversed: Math.random() < 0.5 } : card
      )
    );

    const selectedIds = deck
      .filter((c) => c.selected)
      .map((c) => c.id);

    // Staggered reveal with enhanced animations
    selectedIds.forEach((id, i) => {
      setTimeout(() => {
        setFlashCardId(id);
        setRevealedIds((prev) => new Set(prev).add(id));
        // Haptic feedback on reveal
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => setFlashCardId(null), 400);
      }, i * 500 + 400);
    });

    setTimeout(() => {
      setIsRevealing(false);
      setAllRevealed(true);
    }, selectedIds.length * 500 + 1400);
  }, [deck, spread]);

  const goToResult = useCallback(() => {
    if (!spread) return;
    const selectedCards: DrawnCard[] = deck
      .filter((c) => c.selected)
      .map(({ selected: _s, ...card }) => card as DrawnCard);

    const reading = generateReading(question, spread as Spread, selectedCards);
    setCurrentReading({
      id: Date.now().toString(),
      timestamp: Date.now(),
      question,
      spread,
      cards: selectedCards,
      reading,
    });
    navigate('/result');
  }, [deck, question, spread, navigate]);

  if (!spread) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
      {/* Top Info Bar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-purple-200/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#7B2CBF]">{spread.name}</h2>
            <p className="text-sm text-[#8888a0]">
              已选 {selectedCount}/{spread.cardCount} 张牌
              {selectedCount === spread.cardCount && (
                <span className="text-[#c44fd4] ml-1">· 点击「揭示牌面」</span>
              )}
            </p>
          </div>
          <div className="hidden sm:block text-xs text-[#8888a0]">
            点击牌背选中，再次点击取消
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#c44fd4]/15 border border-[#c44fd4]/30 text-[#c44fd4] text-sm font-medium"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash overlay for card reveal */}
      <AnimatePresence>
        {flashCardId !== null && (
          <motion.div
            key={`flash-${flashCardId}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[55] pointer-events-none bg-white"
          />
        )}
      </AnimatePresence>

      {/* Shuffling Overlay */}
      <AnimatePresence>
        {isShuffling && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-40 h-56 md:w-48 md:h-72">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-xl"
                  style={{ perspective: '1000px' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 15), (i % 2 === 0 ? -1 : 1) * (20 + i * 10), 0],
                    y: [0, -20 - i * 8, 10 + i * 5, 0],
                    rotate: [0, (i % 2 === 0 ? 1 : -1) * (180 + i * 40), (i % 2 === 0 ? -1 : 1) * (90 + i * 30), 0],
                    opacity: [0.8, 1, 0.6, 0.8],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                >
                  <CardBackFace />
                </motion.div>
              ))}
            </div>
            <motion.p
              className="mt-8 text-[#c44fd4] text-lg font-medium tracking-wider"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              正在洗牌...
            </motion.p>
            <p className="mt-2 text-xs text-[#8888a0]">请聚集意念</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 78-Card Grid */}
      {!isShuffling && (
        <div className="px-2 py-4 md:px-4 md:py-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3 max-w-7xl mx-auto">
            {deck.map((card, index) => {
              const isRevealed = revealedIds.has(card.id);
              const isSelected = card.selected && !isRevealed;
              const isJustSelected = lastSelectedId === card.id && isSelected;

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.008, duration: 0.35 }}
                  onClick={() => onCardClick(card.id)}
                  className={`
                    relative aspect-[2/3] rounded-lg cursor-pointer select-none
                    transition-transform duration-300
                    ${isSelected ? 'ring-2 ring-[#c44fd4] shadow-[0_0_20px_rgba(196,79,212,0.35)] -translate-y-2 scale-105 z-10' : ''}
                    ${!card.selected && !isRevealed ? 'hover:scale-105 hover:-translate-y-1' : ''}
                  `}
                  style={{ perspective: '1000px' }}
                >
                  <AnimatePresence mode="wait">
                    {!isRevealed ? (
                      <motion.div
                        key="back"
                        className="absolute inset-0"
                        exit={{ rotateY: 90, opacity: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <CardBackFace mini />
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#c44fd4] text-white flex items-center justify-center text-[10px] font-bold shadow-lg"
                          >
                            {deck.filter((c) => c.selected).findIndex((c) => c.id === card.id) + 1}
                          </motion.div>
                        )}
                        {/* Glow effect on just selected */}
                        {isJustSelected && (
                          <motion.div
                            initial={{ opacity: 0.6, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{
                              boxShadow: '0 0 20px 5px rgba(196,79,212,0.4)',
                            }}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="front"
                        className={`absolute inset-0 rounded-lg overflow-hidden border-2 ${
                          card.isReversed ? 'border-rose-400/60' : 'border-emerald-400/60'
                        }`}
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.45, delay: 0.05 }}
                        style={{
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}
                      >
                        <div className="relative w-full h-full flex flex-col">
                          {/* Image area */}
                          <div className="relative flex-1 overflow-hidden min-h-0 bg-gradient-to-b from-purple-50 to-pink-50">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className={`w-full h-full object-contain ${card.isReversed ? 'rotate-180' : ''}`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
                                <span className="text-4xl">{card.visualSymbol}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Orientation badge */}
                        <div
                          className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold z-10 ${
                            card.isReversed
                              ? 'bg-rose-500/80 text-white'
                              : 'bg-emerald-500/80 text-white'
                          }`}
                        >
                          {card.isReversed ? '逆' : '正'}
                        </div>
                        {/* Number badge */}
                        <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] font-medium bg-black/40 text-white/70 z-10">
                          {card.romanNumeral || card.number}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Action Area */}
      <div className="sticky bottom-0 z-40 bg-white/70 backdrop-blur-md border-t border-purple-200/50 px-4 py-3 flex justify-center gap-3">
        {selectedCount === spread.cardCount && !isRevealing && !allRevealed && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={revealCards}
            className="px-8 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#c44fd4] text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(123,44,191,0.3)] tracking-wide"
          >
            揭示牌面
          </motion.button>
        )}
        {allRevealed && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToResult}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(196,79,212,0.35)] tracking-wide"
          >
            查看解读
          </motion.button>
        )}
      </div>
    </div>
  );
}
