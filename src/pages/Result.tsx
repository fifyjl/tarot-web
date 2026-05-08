import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { generateFollowUpAnswer } from '@/utils/followup';
import type { FollowUpRecord } from '@/utils/followup';
import { generateAIReading, generateAISynthesis } from '@/utils/kimiApi';
import { getCurrentReading, clearCurrentReading, setCurrentReading } from '@/utils/session';
import { saveReading } from '@/utils/storage';
import type { CurrentReading } from '@/utils/session';
import { getCurrentUser } from '@/utils/userAuth';

/* ------------------------------------------------------------------ */
/*  Reusable animated section wrapper                                 */
/* ------------------------------------------------------------------ */

function FadeInSection({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.19, 1, 0.22, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Celebration Particles                                            */
/* ------------------------------------------------------------------ */

function CelebrationParticles({ show }: { show: boolean }) {
  if (!show) return null;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    size: 4 + Math.random() * 8,
    emoji: ['&#10024;', '&#11088;', '&#127775;', '&#127752;', '&#128171;'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-particle"
          style={{
            left: p.left,
            top: '-20px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
          }}
          dangerouslySetInnerHTML={{ __html: p.emoji }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card face component with error fallback                            */
/* ------------------------------------------------------------------ */

function RevealedCard({
  card,
  isReversed,
  size = 'large',
}: {
  card: CurrentReading['cards'][number];
  isReversed: boolean;
  size?: 'large' | 'medium';
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const containerSize =
    size === 'large'
      ? 'w-full max-w-[260px] aspect-[2/3]'
      : 'w-full max-w-[200px] aspect-[2/3]';

  return (
    <div
      className={`${containerSize} rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-2 ${
        isReversed ? 'border-rose-400/50' : 'border-emerald-400/50'
      } relative bg-white/50 flex flex-col`}
    >
      {/* 正逆位徽章 */}
      <div
        className={`absolute top-3 right-3 z-20 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
          isReversed ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}
      >
        {isReversed ? '逆位' : '正位'}
      </div>

      {/* 图片区域 */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        {!imgFailed && card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={`w-full h-full object-contain ${isReversed ? 'rotate-180' : ''}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-purple-100 to-pink-100 flex flex-col items-center justify-center relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 40%, rgba(123,44,191,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(196,79,212,0.1) 0%, transparent 40%)',
              }}
            />
            <span className="text-5xl md:text-6xl drop-shadow-[0_0_15px_rgba(196,79,212,0.3)] select-none z-10">
              {card.visualSymbol}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Keyword tag                                                        */
/* ------------------------------------------------------------------ */

function KeywordTag({ text, isReversed }: { text: string; isReversed: boolean }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isReversed
          ? 'bg-rose-500/10 border-rose-400/40 text-rose-500'
          : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-600'
      }`}
    >
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Result Page                                                   */
/* ------------------------------------------------------------------ */

export default function Result() {
  const navigate = useNavigate();
  const [reading, setReading] = useState<CurrentReading | null>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // AI Reading states
  const [aiReadings, setAiReadings] = useState<Record<number, string>>({});
  const [aiSynthesis, setAiSynthesis] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Follow-up states
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpResults, setFollowUpResults] = useState<FollowUpRecord[]>([]);
  const [showFollowUpInput, setShowFollowUpInput] = useState(true);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  useEffect(() => {
    const r = getCurrentReading();
    if (r) {
      setReading(r);
      if (r.followUps && r.followUps.length > 0) {
        setFollowUpResults(r.followUps);
      }
      // Check if overall trend is positive for celebration
      const positive = !r.reading.cardReadings.some(cr => cr.isReversed && cr.meaning.includes('逆位')) ||
        r.reading.overall.includes('好') ||
        r.reading.overall.includes('顺') ||
        r.reading.overall.includes('积极');
      if (positive) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      // Generate AI readings
      const user = getCurrentUser();
      if (user) {
        setIsLoadingAI(true);
        
        // Generate AI reading for each card
        const generateAI = async () => {
          const newAiReadings: Record<number, string> = {};
          
          for (let i = 0; i < r.reading.cardReadings.length; i++) {
            const cr = r.reading.cardReadings[i];
            const card = r.cards[i];
            if (!card) continue;
            
            try {
              const aiText = await generateAIReading(
                r.question,
                r.spread.name,
                cr.positionName,
                card.name,
                card.isReversed,
                card.isReversed ? card.meaningReversed : card.meaningUpright,
                card.isReversed ? card.keywordsReversed : card.keywordsUpright,
                user.username,

                );
              newAiReadings[i] = aiText;
            } catch {
              // Keep default reading on error
            }
          }
          
          setAiReadings(newAiReadings);
          
          // Generate AI synthesis
          try {
            const synthesisText = await generateAISynthesis(
              r.question,
              r.spread.name,
              r.reading.cardReadings.map((cr, i) => ({
                name: r.cards[i]?.name || '',
                isReversed: cr.isReversed,
                positionName: cr.positionName,
                meaning: cr.meaning,
                keywords: cr.keywords,
              })),
              user.username,

              );
            setAiSynthesis(synthesisText);
          } catch {
            // Keep default synthesis on error
          }
          
          setIsLoadingAI(false);
        };
        
        generateAI();
      }

      // 自动保存到历史记录
      const autoSave = async () => {
        try {
          await saveReading({
            id: r.id || Date.now().toString(),
            timestamp: r.timestamp || Date.now(),
            question: r.question,
            spread: r.spread,
            cards: r.cards,
            reading: r.reading,
            followUps: r.followUps,
          });
          setSaved(true);
          setToast('已自动保存至历史记录');
        } catch {
          // 静默失败，不干扰用户体验
        }
      };
      autoSave();
    }
  }, []);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFollowUp = useCallback(
    (approach: 'deep-dive' | 'new-draw') => {
      if (!reading || !followUpQuestion.trim()) return;

      if (approach === 'new-draw') {
        const q = encodeURIComponent(followUpQuestion);
        navigate(`/followup-draw?question=${q}`);
        return;
      }

      setIsGeneratingFollowUp(true);

      setTimeout(() => {
        const result = generateFollowUpAnswer({
          originalQuestion: reading.question,
          followUpQuestion: followUpQuestion.trim(),
          cards: reading.cards,
          reading: reading.reading,
          spread: reading.spread,
        });

        const updatedResults = [...followUpResults, result];
        setFollowUpResults(updatedResults);

        const current = getCurrentReading();
        if (current) {
          setCurrentReading({
            ...current,
            followUps: updatedResults,
          });
        }

        setFollowUpQuestion('');
        setIsGeneratingFollowUp(false);
      }, 600);
    },
    [reading, followUpQuestion, followUpResults, navigate]
  );

  const handleSave = useCallback(async () => {
    if (!reading) return;
    try {
      await saveReading({
        id: reading.id || Date.now().toString(),
        timestamp: reading.timestamp || Date.now(),
        question: reading.question,
        spread: reading.spread,
        cards: reading.cards,
        reading: reading.reading,
        followUps: reading.followUps,
      });
      setSaved(true);
      setToast('已保存至历史记录');
    } catch {
      setToast('保存失败，请检查浏览器存储设置');
    }
  }, [reading]);

  const handleRestart = useCallback(() => {
    clearCurrentReading();
    navigate('/');
  }, [navigate]);

  const handleChangeSpread = useCallback(() => {
    if (!reading) return;
    const q = encodeURIComponent(reading.question);
    navigate(`/spreads?question=${q}`);
  }, [reading, navigate]);

  if (!reading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="text-center"
        >
          <div className="mb-4 text-4xl">&#128302;</div>
          <h2 className="text-xl font-bold text-[#4a4a6a] mb-2">请先进行占卜</h2>
          <p className="text-sm text-[#8888a0] mb-6">
            没有检测到牌阵数据。你需要先提问、选阵、抽牌，才能查看解读结果。
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:opacity-90 transition"
          >
            去提问
          </button>
        </motion.div>
      </div>
    );
  }

  const { question: rawQuestion, spread, cards, reading: readingData, timestamp } = reading;
  const question = rawQuestion || sessionStorage.getItem('mystictarot_question') || '（未记录问题）';
  const dateStr = format(timestamp, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });

  // Check overall trend for celebration message
  const hasPositiveTrend = !readingData.cardReadings.some(cr => cr.isReversed) ||
    readingData.overall.includes('好') || readingData.overall.includes('顺');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
      {/* Celebration Particles */}
      <CelebrationParticles show={showCelebration} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full border border-emerald-400 bg-white/95 backdrop-blur px-6 py-2.5 text-sm text-emerald-600 shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Positive Trend Banner */}
      <AnimatePresence>
        {hasPositiveTrend && showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.5 }}
            className="fixed left-1/2 top-28 z-[55] -translate-x-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-purple-300/40"
          >
            &#127881; 整体趋势向好！
          </motion.div>
        )}
      </AnimatePresence>

      {/* 顶部导航栏 - 返回主页 */}
      <div className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-purple-200/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-[#7B2CBF] font-bold text-sm hover:opacity-80 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            返回首页
          </button>
          <h2 className="text-sm font-medium text-[#8888a0]">{spread.name}</h2>
        </div>
      </div>

      {/* Top Info */}
      <FadeInSection className="px-4 py-6 md:py-8 border-b border-purple-200/50">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#7B2CBF] mb-2">
            {spread.name} · 解读
          </h1>
          <p className="text-[#8888a0] text-sm md:text-base mb-1">
            关于你的提问：「{question}」
          </p>
          <p className="text-[#8888a0]/70 text-xs">{dateStr}</p>
        </div>
      </FadeInSection>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8 md:space-y-10">
        {/* Overall Summary */}
        <FadeInSection delay={0.1}>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-purple-200/50">
            <h3 className="text-[#7B2CBF] font-bold text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">&#128214;</span>
              阵法总括
            </h3>
            <p className="text-[#4a4a6a] leading-relaxed text-sm md:text-base">
              {readingData.overall}
            </p>
          </div>
        </FadeInSection>

        {/* Card-by-card readings: left-right split */}
        {readingData.cardReadings.map((cr, i) => {
          const card = cards[i];
          if (!card) return null;
          const isReversed = cr.isReversed;

          return (
            <FadeInSection key={i} delay={0.15 + i * 0.12}>
              <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-purple-200/40 overflow-hidden">
                {/* Mobile: stacked / Desktop: side-by-side */}
                <div className="flex flex-col md:flex-row">
                  {/* Left: Card image (40%) */}
                  <div className="md:w-[40%] p-4 md:p-6 flex flex-col items-center bg-white/30 border-b md:border-b-0 md:border-r border-purple-200/30">
                    <div className="text-[#8888a0] text-xs md:text-sm mb-3 tracking-wider uppercase">
                      {cr.positionName}
                    </div>

                    <RevealedCard card={card} isReversed={isReversed} size="large" />

                    {/* Card name */}
                    <div className="mt-4 text-center">
                      <div className="text-[#4a4a6a] font-bold text-base md:text-lg">
                        {card.name}
                      </div>
                      <div className="text-[#8888a0] text-xs md:text-sm italic">
                        {card.englishName}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center max-w-[260px]">
                      {cr.keywords.slice(0, 6).map((kw, ki) => (
                        <KeywordTag key={ki} text={kw} isReversed={isReversed} />
                      ))}
                    </div>
                  </div>

                  {/* Right: Interpretation (60%) */}
                  <div className="md:w-[60%] p-4 md:p-6 space-y-4">
                    {/* Meaning */}
                    <div className="border-l-4 border-[#7B2CBF] pl-4 py-1">
                      <h4 className="text-[#7B2CBF] font-bold text-sm mb-1.5 flex items-center gap-1.5">
                        <span>&#128220;</span>
                        牌义
                      </h4>
                      <p className="text-[#4a4a6a] text-sm leading-relaxed">
                        {cr.meaning}
                      </p>
                    </div>

                    {/* AI Deep Reading */}
                    <div className="border-l-4 border-[#c44fd4] pl-4 py-1">
                      <h4 className="text-[#c44fd4] font-bold text-sm mb-1.5 flex items-center gap-1.5">
                        <span>&#129302;</span>
                        AI 深度解读
                        {isLoadingAI && !aiReadings[i] && (
                          <span className="text-xs text-gray-400 font-normal">(生成中...)</span>
                        )}
                      </h4>
                      <p className="text-[#4a4a6a] text-sm leading-relaxed">
                        {aiReadings[i] || cr.questionContext || cr.story || cr.meaning}
                      </p>
                    </div>

                    {/* Advice */}
                    {cr.advice && (
                      <div className="border-l-4 border-[#00d9a3] pl-4 py-1">
                        <h4 className="text-[#00d9a3] font-bold text-sm mb-1.5 flex items-center gap-1.5">
                          <span>&#128161;</span>
                          建议
                        </h4>
                        <p className="text-[#4a4a6a] text-sm leading-relaxed">
                          {cr.advice}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FadeInSection>
          );
        })}

        {/* Synthesis */}
        {readingData.synthesis && (
          <FadeInSection delay={0.5}>
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-purple-200/50">
              <h3 className="text-[#7B2CBF] font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-xl">&#129302;</span>
                AI 综合分析
                {isLoadingAI && !aiSynthesis && (
                  <span className="text-xs text-gray-400 font-normal">(生成中...)</span>
                )}
              </h3>
              <p className="text-[#4a4a6a] leading-relaxed text-sm md:text-base">
                {aiSynthesis || readingData.synthesis}
              </p>
            </div>
          </FadeInSection>
        )}

        {/* Timing */}
        {readingData.timing && (
          <FadeInSection delay={0.55}>
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-emerald-200/40">
              <h3 className="text-[#00d9a3] font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-xl">&#9200;</span>
                时机指引
              </h3>
              <p className="text-[#4a4a6a] leading-relaxed text-sm md:text-base">
                {readingData.timing}
              </p>
            </div>
          </FadeInSection>
        )}

        {/* Affirmation */}
        {readingData.affirmation && (
          <FadeInSection delay={0.6}>
            <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-white/40 backdrop-blur-md p-6 md:p-8 text-center">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(196,79,212,0.2) 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-3 text-2xl">&#11088;</div>
                <p className="text-[#c44fd4] font-medium text-base md:text-lg leading-relaxed italic">
                  {readingData.affirmation}
                </p>
              </div>
            </div>
          </FadeInSection>
        )}

        {/* Suggestions */}
        {readingData.suggestions && readingData.suggestions.length > 0 && (
          <FadeInSection delay={0.65}>
            <div className="rounded-2xl p-5 md:p-6 border border-purple-200/50 bg-white/40 backdrop-blur-md">
              <h3 className="text-[#c44fd4] font-bold text-lg mb-4 flex items-center gap-2">
                <span className="text-xl">&#10024;</span>
                星辰的指引
              </h3>
              <div className="space-y-3">
                {readingData.suggestions.map((sg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + i * 0.08, duration: 0.5 }}
                    className="flex gap-3 items-start"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#c44fd4]/10 text-[#c44fd4] flex items-center justify-center text-xs font-bold border border-[#c44fd4]/30">
                      {i + 1}
                    </span>
                    <p className="text-[#4a4a6a] text-sm leading-relaxed pt-1">
                      {sg}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeInSection>
        )}

        {/* Follow-up Section */}
        <FadeInSection delay={0.9}>
          <div className="mt-8 border-t border-purple-200/50 pt-6">
            <h3 className="text-[#c44fd4] font-bold text-lg mb-4">
              &#128173; 还有疑问？
            </h3>

            {/* Follow-up input */}
            {showFollowUpInput && (
              <div className="space-y-3">
                <textarea
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="输入你的进一步问题（如：那我具体该怎么做？）"
                  className="w-full bg-white/60 border border-purple-200/60 rounded-xl p-3 text-[#4a4a6a] text-sm placeholder:text-[#8888a0] min-h-[80px] resize-none focus:outline-none focus:border-[#7B2CBF] backdrop-blur-sm"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => handleFollowUp('deep-dive')}
                    disabled={!followUpQuestion.trim() || isGeneratingFollowUp}
                    className="flex-1 px-4 py-2.5 bg-white/50 border border-[#7B2CBF]/40 text-[#7B2CBF] rounded-lg text-sm font-bold hover:bg-[#7B2CBF]/10 transition disabled:opacity-50 backdrop-blur-sm"
                  >
                    {isGeneratingFollowUp ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#7B2CBF] border-t-transparent rounded-full animate-spin" />
                        解读中...
                      </span>
                    ) : (
                      <>&#128269; 基于当前牌阵解读</>
                    )}
                  </button>
                  <button
                    onClick={() => handleFollowUp('new-draw')}
                    disabled={!followUpQuestion.trim() || isGeneratingFollowUp}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                  >
                    <>&#127924; 再抽牌深入</>
                  </button>
                </div>
              </div>
            )}

            {/* Previous follow-up results */}
            {followUpResults.length > 0 && (
              <div className="mt-6 space-y-4">
                {followUpResults.map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-purple-200/40"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#7B2CBF]/10 text-[#7B2CBF] border border-[#7B2CBF]/30">
                        {result.approach === 'deep-dive' ? '深度解读' : '再抽牌'}
                      </span>
                      <h4 className="text-[#7B2CBF] font-bold text-sm">
                        &#128302; 追问{idx + 1}：「{result.question}」
                      </h4>
                    </div>
                    <p className="text-[#4a4a6a] text-sm leading-relaxed whitespace-pre-line">
                      {result.answer}
                    </p>

                    {result.focusCard !== undefined && result.approach === 'deep-dive' && (
                      <div className="mt-3 text-xs text-[#8888a0]">
                        聚焦牌：{cards[result.focusCard]?.name}（{cards[result.focusCard]?.isReversed ? '逆位' : '正位'}）
                      </div>
                    )}

                    {result.newCards && result.approach === 'new-draw' && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {result.newCards.map((nc, ni) => (
                          <span key={ni} className="text-xs px-2 py-1 rounded-full bg-[#c44fd4]/10 text-[#c44fd4] border border-[#c44fd4]/20">
                            {nc.name}（{nc.isReversed ? '逆位' : '正位'}）
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Continue asking */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowFollowUpInput(true);
                      setFollowUpQuestion('');
                    }}
                    className="text-xs text-[#8888a0] hover:text-[#c44fd4] transition"
                  >
                    &#128260; 继续追问
                  </button>
                </div>
              </div>
            )}
          </div>
        </FadeInSection>

        {/* Bottom Actions */}
        <FadeInSection delay={1.0}>
          <div className="flex flex-wrap gap-3 justify-center pt-4 pb-12">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 border border-purple-200/60 text-[#c44fd4] rounded-full font-bold text-sm hover:bg-white/50 transition-colors"
            >
              &#128260; 再算一次
            </button>
            <button
              onClick={handleChangeSpread}
              className="px-5 py-2.5 border border-purple-200/60 text-[#c44fd4] rounded-full font-bold text-sm hover:bg-white/50 transition-colors"
            >
              &#127924; 换阵法
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-400/40'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
              }`}
            >
              {saved ? '&#9989; 已保存' : '&#128190; 保存结果'}
            </button>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
