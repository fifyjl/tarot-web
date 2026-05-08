import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tarotCards } from '@/data/tarotData';
import type { TarotCard } from '@/data/tarotData';
import { SPREADS } from '@/data/spreads';
import type { Spread } from '@/data/spreads';
import { getCurrentReading, setCurrentReading } from '@/utils/session';
import type { DrawnCard } from '@/utils/draw';
import {
  generateCombinedReading,
  recommendFollowUpSpread,
  type FollowUpRecord,
} from '@/utils/followup';

interface DeckCard extends TarotCard {
  selected: boolean;
  isReversed: boolean;
}

/* ------------------------------------------------------------------ */
/*  Card Back                                                          */
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
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(157,78,221,0.06) 0%, rgba(157,78,221,0) 50%)' }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(123,44,191,0.2) 1px, transparent 1px), radial-gradient(circle, rgba(196,79,212,0.12) 2px, transparent 2px)',
          backgroundSize: '30px 30px, 50px 50px',
          backgroundPosition: '0 0, 15px 15px',
        }}
      />
      <div className="flex flex-col items-center gap-1">
        <div className={`text-[#c44fd4]/30 ${mini ? 'text-sm' : 'text-2xl md:text-3xl'}`}>&#10041;</div>
        <div className={`text-[#7B2CBF]/30 font-bold ${mini ? 'text-[8px]' : 'text-xs'}`}>二</div>
      </div>
      <div className="absolute top-1 left-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
      <div className="absolute top-1 right-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
      <div className="absolute bottom-1 left-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
      <div className="absolute bottom-1 right-1 text-[#7B2CBF]/20 text-[8px]">&#9672;</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main FollowUp Draw Page                                            */
/* ------------------------------------------------------------------ */

export default function FollowUpDraw() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const followUpQuestion = searchParams.get('question') || '';

  const [prevReading, setPrevReading] = useState<ReturnType<typeof getCurrentReading>>(null);
  const [spread, setSpread] = useState<Spread | null>(null);

  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [combinedResult, setCombinedResult] = useState<{
    newCards: DrawnCard[];
    combinedReading: string;
    followUpRecord: FollowUpRecord;
  } | null>(null);

  // Load previous reading and determine spread
  useEffect(() => {
    const prev = getCurrentReading();
    if (!prev) {
      navigate('/');
      return;
    }
    setPrevReading(prev);

    const recommended = recommendFollowUpSpread(prev.spread);
    setSpread(recommended);
  }, [navigate]);

  // Initialize & shuffle
  useEffect(() => {
    if (!spread) return;
    const initial: DeckCard[] = tarotCards.map((card) => ({
      ...card,
      selected: false,
      isReversed: false,
    }));
    for (let i = initial.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initial[i], initial[j]] = [initial[j], initial[i]];
    }
    setDeck(initial);
    const timer = setTimeout(() => setIsShuffling(false), 2500);
    return () => clearTimeout(timer);
  }, [spread]);

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
        setSelectedCount((c) => c + 1);
        return prev.map((c) => (c.id === id ? { ...c, selected: true } : c));
      });
    },
    [isShuffling, isRevealing, allRevealed, spread]
  );

  const revealCards = useCallback(() => {
    if (!spread) return;
    setIsRevealing(true);

    setDeck((prev) =>
      prev.map((card) =>
        card.selected ? { ...card, isReversed: Math.random() < 0.5 } : card
      )
    );

    const selectedIds = deck.filter((c) => c.selected).map((c) => c.id);

    selectedIds.forEach((id, i) => {
      setTimeout(() => {
        setRevealedIds((prev) => new Set(prev).add(id));
      }, i * 500 + 400);
    });

    setTimeout(() => {
      setIsRevealing(false);
      setAllRevealed(true);
    }, selectedIds.length * 500 + 1400);
  }, [deck, spread]);

  const generateFollowUpResult = useCallback(() => {
    if (!spread || !prevReading) return;

    const newCards: DrawnCard[] = deck
      .filter((c) => c.selected)
      .map(({ selected: _s, ...card }) => card as DrawnCard);

    const combinedReading = generateCombinedReading(
      prevReading.cards,
      newCards,
      prevReading.reading,
      spread,
      prevReading.spread
    );

    const followUpRecord: FollowUpRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      question: followUpQuestion,
      approach: 'new-draw',
      answer: combinedReading,
      newCards,
      combinedReading,
    };

    const followUps = prevReading.followUps || [];
    setCurrentReading({
      ...prevReading,
      followUps: [...followUps, followUpRecord],
    });

    setCombinedResult({
      newCards,
      combinedReading,
      followUpRecord,
    });
  }, [deck, spread, prevReading, followUpQuestion]);

  const handleReturnToMain = useCallback(() => {
    navigate('/result');
  }, [navigate]);

  const handleSaveAll = useCallback(() => {
    navigate('/result');
  }, [navigate]);

  if (!spread || !prevReading) return null;

  const prevKeyCards = prevReading.cards.slice(0, 3).map((c) => c.name).join('、');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
      {/* Top Info Bar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-purple-200/50 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#7B2CBF]">&#128302; 二次占卜 &#183; 深入探索</h2>
              <p className="text-sm text-[#8888a0]">
                已选 {selectedCount}/{spread.cardCount} 张牌
                {selectedCount === spread.cardCount && (
                  <span className="text-[#c44fd4] ml-1">&#183; 点击「揭示牌面」</span>
                )}
              </p>
            </div>
          </div>

          {/* Previous reading summary */}
          <div className="mt-2 px-3 py-2 rounded-lg bg-white/50 border border-purple-200/40 backdrop-blur-sm">
            <p className="text-xs text-[#8888a0]">
              <span className="text-[#c44fd4]">前一次：</span>
              {prevReading.spread.name} &#183; &#12300;{prevReading.question.slice(0, 30)}
              {prevReading.question.length > 30 ? '...' : ''}&#12301;
              <span className="text-[#8888a0]/60 ml-2">关键牌：{prevKeyCards}</span>
            </p>
            <p className="text-xs text-[#7B2CBF] mt-1">
              <span className="text-[#c44fd4]">本次追问：</span>&#12300;{followUpQuestion}&#12301;
            </p>
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-[#7B2CBF]/15 border border-[#7B2CBF]/30 text-[#7B2CBF] text-sm font-medium"
          >
            {toastMsg}
          </motion.div>
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
            <p className="mt-2 text-xs text-[#8888a0]">聚焦你的追问，感受能量的流动</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combined Result Display */}
      <AnimatePresence>
        {combinedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-6 md:py-8"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#7B2CBF] mb-2">&#128302; 结合前后两次牌面的解读</h2>
                <p className="text-sm text-[#8888a0]">
                  追问：「{followUpQuestion}」&#183; {spread.name}
                </p>
              </div>

              {/* New cards display */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                {combinedResult.newCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.2, duration: 0.5 }}
                    className="text-center"
                  >
                    <div
                      className={`w-[140px] md:w-[180px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-2 relative bg-white/50 mx-auto flex flex-col
                        ${card.isReversed ? 'border-rose-400/50' : 'border-emerald-400/50'}`}
                    >
                      <div
                        className={`absolute top-2 right-2 z-20 px-2 py-0.5 rounded text-xs font-bold
                          ${card.isReversed ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}
                      >
                        {card.isReversed ? '逆位' : '正位'}
                      </div>

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
                    <p className="mt-2 text-sm text-[#4a4a6a] font-bold">{card.name}</p>
                    <p className="text-xs text-[#8888a0]">{spread.positions[i]?.name || `第${i + 1}张`}</p>
                  </motion.div>
                ))}
              </div>

              {/* Combined reading text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/60 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-purple-200/50"
              >
                <h3 className="text-[#7B2CBF] font-bold text-lg mb-4">&#128220; 深度解读</h3>
                <div className="text-[#4a4a6a] text-sm leading-relaxed whitespace-pre-line space-y-4">
                  {combinedResult.combinedReading.split('\n').map((line, idx) => {
                    if (line.startsWith('&#12304;') && line.endsWith('&#12305;')) {
                      return (
                        <h4 key={idx} className="text-[#c44fd4] font-bold text-sm mt-4">
                          {line}
                        </h4>
                      );
                    }
                    if (line.startsWith('&#12300;') && line.includes('&#12301;')) {
                      return (
                        <p key={idx} className="font-bold text-[#4a4a6a]">
                          {line}
                        </p>
                      );
                    }
                    if (!line.trim()) return null;
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </motion.div>

              {/* Bottom actions */}
              <div className="flex flex-wrap gap-3 justify-center pt-4 pb-8">
                <button
                  onClick={handleReturnToMain}
                  className="px-6 py-2.5 border border-purple-200/60 text-[#c44fd4] rounded-full font-bold text-sm hover:bg-white/50 transition-colors"
                >
                  &#8617; 返回主解读
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-sm hover:opacity-90 transition shadow-lg shadow-purple-300/30"
                >
                  &#128190; 保存全部
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 78-Card Grid (hidden when result shown) */}
      {!isShuffling && !combinedResult && (
        <div className="px-2 py-4 md:px-4 md:py-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3 max-w-7xl mx-auto">
            {deck.map((card, index) => {
              const isRevealed = revealedIds.has(card.id);
              const isSelected = card.selected && !isRevealed;

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
                    ${isSelected ? 'ring-2 ring-[#7B2CBF] shadow-[0_0_20px_rgba(123,44,191,0.35)] -translate-y-2 scale-105 z-10' : ''}
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
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#c44fd4] text-white flex items-center justify-center text-[10px] font-bold shadow-lg">
                            {deck.filter((c) => c.selected).findIndex((c) => c.id === card.id) + 1}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="front"
                        className={`absolute inset-0 rounded-lg overflow-hidden border-2 ${
                          card.isReversed ? 'border-rose-400/50' : 'border-emerald-400/50'
                        }`}
                        initial={{ rotateY: -90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.45, delay: 0.05 }}
                        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      >
                        <div className="relative w-full h-full flex flex-col">
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
                        <div
                          className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold z-10 ${
                            card.isReversed
                              ? 'bg-rose-500/80 text-white'
                              : 'bg-emerald-500/80 text-white'
                          }`}
                        >
                          {card.isReversed ? '逆' : '正'}
                        </div>
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
      {!combinedResult && (
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
              onClick={generateFollowUpResult}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(196,79,212,0.35)] tracking-wide"
            >
              查看结合解读
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
