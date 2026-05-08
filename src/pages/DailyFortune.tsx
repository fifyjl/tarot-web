import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tarotCards } from '@/data/tarotData';
import type { TarotCard } from '@/data/tarotData';
import { generateFortuneReading } from '@/utils/dailyFortune';
import type { FortuneReading } from '@/utils/dailyFortune';
import { saveDailyFortuneCache, getDailyFortuneCache } from '@/utils/storage';
import { canDailyFortune, markDailyFortuneUsed, getVipStatus } from '@/utils/vip';
import PaywallModal from '@/components/PaywallModal';

export default function DailyFortune() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'idle' | 'shuffling' | 'revealed'>('idle');
  const [card, setCard] = useState<(TarotCard & { isReversed: boolean }) | null>(null);
  const [reading, setReading] = useState<FortuneReading | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // 组件加载时检查云端/本地缓存
  useEffect(() => {
    const checkCache = async () => {
      const cache = await getDailyFortuneCache();
      if (cache) {
        const foundCard = tarotCards.find(c => c.id === cache.cardId);
        if (foundCard) {
          const drawnCard = { ...foundCard, isReversed: cache.isReversed };
          const fortuneReading = generateFortuneReading(drawnCard);
          setCard(drawnCard);
          setReading(fortuneReading);
          setStep('revealed');
          setIsFromCache(true);
        }
      }
      setIsLoadingCache(false);
    };
    checkCache();
  }, []);

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const startFortune = async () => {
    // 检查免费次数
    const check = canDailyFortune();
    if (!check.allowed) {
      setShowPaywall(true);
      return;
    }

    setStep('shuffling');

    // 2.5秒洗牌动画后自动抽牌
    setTimeout(() => {
      const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
      const drawn = shuffled[0];
      const isReversed = Math.random() < 0.5;
      const drawnCard = { ...drawn, isReversed };
      const fortuneReading = generateFortuneReading(drawnCard);

      setCard(drawnCard);
      setReading(fortuneReading);
      setStep('revealed');
      setIsFromCache(false);

      // 保存到本地缓存 + 云端
      saveDailyFortuneCache(drawnCard.id, isReversed);

      // 标记今日运势已使用
      markDailyFortuneUsed();

      // 震动反馈
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }, 2500);
  };

  const handleReset = () => {
    setStep('idle');
    setCard(null);
    setReading(null);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)',
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* 加载缓存中 */}
        {isLoadingCache && (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-4 text-4xl"
            >
              🔮
            </motion.div>
            <p className="text-sm text-gray-400">正在同步云端数据...</p>
          </div>
        )}

        {/* 标题 */}
        {!isLoadingCache && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-[#7B2CBF]">✨ 今日运势</h1>
          <p className="mt-2 text-gray-500">{today}</p>
        </motion.div>
        )}

        {/* 状态1： idle - 显示一键抽牌按钮 */}
        <AnimatePresence>
          {step === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-20"
            >
              {/* 装饰性水晶球 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="mb-8 text-8xl"
              >
                🔮
              </motion.div>

              <p className="mb-8 max-w-sm text-center text-gray-600">
                塔罗牌将为你揭示今天的运势走向
                <br />
                点击按钮，抽取属于你的今日指引牌
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startFortune}
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-purple-300/50"
              >
                🔮 一键测算今日运势
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 状态2：shuffling - 洗牌动画 */}
        <AnimatePresence>
          {step === 'shuffling' && (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative h-72 w-48">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 shadow-xl"
                    style={{
                      backgroundImage:
                        i === 0
                          ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 8px)'
                          : undefined,
                    }}
                    animate={{
                      x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 8), (i % 2 === 0 ? -1 : 1) * (15 + i * 5), 0],
                      y: [0, (i % 3 === 0 ? -1 : 1) * (10 + i * 5), (i % 3 === 0 ? 1 : -1) * (8 + i * 3), 0],
                      rotate: [0, 180, -180, 360],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                  >
                    {/* 牌背花纹 */}
                    <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-white/20">
                      <span className="text-4xl opacity-30">🌙</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.p
                className="mt-8 text-lg font-medium text-[#7B2CBF]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                正在感应你的能量...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 状态3：revealed - 显示牌面+运势分析 */}
        <AnimatePresence>
          {step === 'revealed' && card && reading && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* 牌面展示 */}
              <div className="flex flex-col items-center">
                {/* 今天已抽过的提示 */}
                {isFromCache && (
                  <div className="mb-4 text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-sm font-bold">
                      ✓ 这是你今天的运势牌
                    </span>
                    <p className="mt-1 text-xs text-gray-400">今天已经抽过牌了，以下是今日运势</p>
                  </div>
                )}

                {/* 3D 翻转容器 */}
                <div className="group" style={{ perspective: '1000px' }}>
                  <motion.div
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="relative h-72 w-48 overflow-hidden rounded-2xl shadow-2xl"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className={`h-full w-full object-contain ${card.isReversed ? 'rotate-180' : ''}`}
                    />
                    {/* 正逆位标签 */}
                    <div
                      className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                        card.isReversed
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {card.isReversed ? '逆位' : '正位'}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-center"
                >
                  <h2 className="text-xl font-bold text-[#7B2CBF]">{card.name}</h2>
                  <p className="text-sm text-gray-500">{card.englishName}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {card.isReversed ? card.keywordsReversed.join(' · ') : card.keywordsUpright.join(' · ')}
                  </p>
                </motion.div>
              </div>

              {/* 综合运势 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-purple-200/50 bg-white/60 p-5 backdrop-blur-md"
              >
                <h3 className="mb-2 text-lg font-bold text-[#7B2CBF]">
                  🌟 综合运势
                </h3>
                <p className="leading-relaxed text-gray-700">{reading.overall}</p>
              </motion.div>

              {/* 四维运势 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: '💕',
                    title: '爱情运势',
                    text: reading.love,
                    color: 'text-pink-500',
                    bg: 'bg-pink-50/60',
                    delay: 0.5,
                  },
                  {
                    icon: '💼',
                    title: '事业运势',
                    text: reading.career,
                    color: 'text-blue-500',
                    bg: 'bg-blue-50/60',
                    delay: 0.6,
                  },
                  {
                    icon: '💰',
                    title: '财富运势',
                    text: reading.wealth,
                    color: 'text-amber-500',
                    bg: 'bg-amber-50/60',
                    delay: 0.7,
                  },
                  {
                    icon: '🏥',
                    title: '健康运势',
                    text: reading.health,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-50/60',
                    delay: 0.8,
                  },
                ].map((item) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay }}
                    className={`rounded-xl border border-purple-100/50 ${item.bg} p-4 backdrop-blur-sm`}
                  >
                    <h4 className={`mb-1 text-sm font-bold ${item.color}`}>
                      {item.icon} {item.title}
                    </h4>
                    <p className="text-xs leading-relaxed text-gray-600">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* 幸运信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="rounded-xl border border-purple-200/50 bg-gradient-to-r from-purple-100/60 to-pink-100/60 p-4"
              >
                <h4 className="mb-2 text-sm font-bold text-[#7B2CBF]">
                  🍀 今日幸运指南
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-gray-400">幸运色</span>
                    <br />
                    <span className="font-bold text-gray-700">
                      {reading.lucky.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">幸运数字</span>
                    <br />
                    <span className="font-bold text-gray-700">
                      {reading.lucky.number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">幸运方位</span>
                    <br />
                    <span className="font-bold text-gray-700">
                      {reading.lucky.direction}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">吉时</span>
                    <br />
                    <span className="font-bold text-gray-700">
                      {reading.lucky.time}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* 建议列表 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="rounded-2xl border border-purple-200/50 bg-white/60 p-5 backdrop-blur-md"
              >
                <h3 className="mb-3 text-lg font-bold text-[#7B2CBF]">
                  💡 今日建议（{reading.suggestions.length}条）
                </h3>
                <div className="space-y-3">
                  {reading.suggestions.map((sg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-gray-700">
                        {sg}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* 底部按钮 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="flex gap-3 pt-4 pb-8"
              >
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl border border-purple-300 py-3 font-bold text-[#7B2CBF] transition hover:bg-purple-50"
                >
                  🔄 再测一次
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-bold text-white transition hover:opacity-90"
                >
                  🏠 返回首页
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        spreadName="每日运势"
        cardCount={1}
      />
    </div>
  );
}
