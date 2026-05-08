import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, Trash2, ChevronDown, Sparkles, Zap, Clock, BookOpen, Star, Heart, Lightbulb, Compass, Scroll, Target, Wand2, MessageCircle } from 'lucide-react'

import TarotCardComponent from '@/components/TarotCard'
import { getHistory, deleteReading } from '@/utils/storage'
import { getCurrentUser } from '@/utils/userAuth'
import type { SavedReading } from '@/utils/storage'

const mysticEase = [0.19, 1, 0.22, 1] as [number, number, number, number]

const SUGGESTION_ICONS = [
  <Sparkles key={0} size={16} className="text-[#c44fd4]" />,
  <Compass key={1} size={16} className="text-[#c44fd4]" />,
  <Lightbulb key={2} size={16} className="text-[#c44fd4]" />,
  <Heart key={3} size={16} className="text-[#c44fd4]" />,
  <Star key={4} size={16} className="text-[#c44fd4]" />,
]

function useToast() {
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500)
      return () => clearTimeout(t)
    }
  }, [toast])
  return { toast, setToast }
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                               */
/* ------------------------------------------------------------------ */

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  borderColor?: string
  defaultOpen?: boolean
  delay?: number
}

function CollapsibleSection({
  title,
  icon,
  children,
  borderColor = '#d4c0e0',
  defaultOpen = true,
  delay = 0,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: mysticEase }}
      className="rounded-xl border bg-white/60 p-5 md:p-6 backdrop-blur-sm"
      style={{ borderColor }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-serif text-base font-semibold text-[#4a4a6a] md:text-lg">
            {title}
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} className="text-[#8888a0]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: mysticEase }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

/* ------------------------------------------------------------------ */
/*  Three-Tier Card Reading Detail                                    */
/* ------------------------------------------------------------------ */

function CardReadingDetail({
  cr,
  idx,
  card,
}: {
  cr: SavedReading['reading']['cardReadings'][number]
  idx: number
  card: SavedReading['cards'][number] & { isReversed: boolean }
}) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.6 + idx * 0.15,
        ease: mysticEase,
      }}
      className="rounded-xl border border-purple-200/50 bg-white/60 p-5 md:p-6 backdrop-blur-sm"
    >
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#c44fd4]">
        第{idx + 1}张 &#183; {cr.positionName}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="shrink-0">
          <TarotCardComponent card={card} size="sm" showName={false} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-[#4a4a6a]">
            {cr.cardName}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {cr.keywords.map((kw) => (
              <span
                key={kw}
                className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  cr.isReversed
                    ? 'border-[#ff3864] bg-[rgba(255,56,100,0.1)] text-[#ff3864]'
                    : 'border-[#00d9a3] bg-[rgba(0,217,163,0.1)] text-[#00b386]'
                }`}
              >
                #{kw}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-[#8888a0]">
            {cr.isReversed ? '逆位' : '正位'}
          </div>
        </div>
      </div>

      {/* Three-tier interpretation structure */}
      <div className="space-y-3">
        {/* Tier 1: Card Meaning */}
        <div
          className="rounded-xl border-l-[3px] bg-[rgba(123,44,191,0.05)] pl-4 pr-3 py-3"
          style={{ borderLeftColor: '#7B2CBF' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Scroll size={13} className="text-[#7B2CBF]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B2CBF]">
              牌义解读
            </span>
          </div>
          <p className="text-sm leading-[1.8] text-[#4a4a6a]">
            {cr.meaning}
          </p>
        </div>

        {/* Tier 2: Question Context */}
        <div
          className="rounded-xl border-l-[3px] bg-[rgba(0,217,163,0.05)] pl-4 pr-3 py-3"
          style={{ borderLeftColor: '#00d9a3' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target size={13} className="text-[#00d9a3]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00d9a3]">
              问题关联
            </span>
          </div>
          <p className="text-sm leading-[1.8] text-[#4a4a6a]">
            {cr.questionContext}
          </p>
          {cr.story && (
            <p className="mt-2 text-xs italic leading-[1.7] text-[#8888a0]">
              {cr.story}
            </p>
          )}
        </div>

        {/* Tier 3: Actionable Advice */}
        <div
          className="rounded-xl border-l-[3px] bg-[rgba(196,79,212,0.05)] pl-4 pr-3 py-3"
          style={{ borderLeftColor: '#c44fd4' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Wand2 size={13} className="text-[#c44fd4]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c44fd4]">
              具体建议
            </span>
          </div>
          <p className="text-sm leading-[1.8] text-[#4a4a6a]">
            {cr.advice}
          </p>
        </div>
      </div>
    </motion.article>
  )
}

/* ------------------------------------------------------------------ */
/*  Main History Detail Page                                          */
/* ------------------------------------------------------------------ */

export default function HistoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast, setToast } = useToast()
  const [record, setRecord] = useState<SavedReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const user = getCurrentUser()

  useEffect(() => {
    const loadRecord = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      const all = await getHistory()
      const found = all.find((r) => r.id === id)
      setRecord(found ?? null)
      setLoading(false)
    }
    loadRecord()
  }, [id, user])

  const handleDelete = useCallback(async () => {
    if (!id) return
    await deleteReading(id)
    setToast('记录已删除')
    setTimeout(() => navigate('/history'), 800)
  }, [id, navigate, setToast])

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7B2CBF] border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: mysticEase }}
          className="text-center"
        >
          <div className="mb-4 text-4xl">&#128302;</div>
          <h2 className="mb-2 font-serif text-2xl text-[#4a4a6a]">
            请先登录
          </h2>
          <p className="mb-8 text-sm text-[#8888a0]">
            登录后即可查看您的占卜记录详情。
          </p>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 shadow-lg shadow-purple-300/30"
          >
            <Sparkles size={16} />
            去登录
          </button>
        </motion.div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: mysticEase }}
          className="text-center"
        >
          <div className="mb-4 text-4xl">&#128205;</div>
          <h2 className="mb-2 font-serif text-2xl text-[#4a4a6a]">
            记录未找到
          </h2>
          <p className="mb-8 text-sm text-[#8888a0]">
            这条占卜记录可能已被删除或不存在。
          </p>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 rounded border border-purple-200/60 bg-white/50 px-6 py-3 text-sm font-medium text-[#4a4a6a] transition-all hover:border-[#7B2CBF] hover:bg-white/80"
          >
            <ArrowLeft size={16} />
            返回历史列表
          </button>
        </motion.div>
      </div>
    )
  }

  const dateStr = format(record.timestamp, 'yyyy.MM.dd HH:mm', { locale: zhCN })
  const cardsWithReversed = record.cards.map((card, idx) => ({
    ...card,
    isReversed: record.reading.cardReadings[idx]?.isReversed ?? false,
  }))

  // Ensure 5 suggestions
  const suggestions = record.reading.suggestions || []
  const paddedSuggestions = [
    ...suggestions,
    ...Array(Math.max(0, 5 - suggestions.length)).fill('保持耐心和信心，生命的发展有其自然的节奏。'),
  ].slice(0, 5)

  return (
    <div className="relative min-h-[100dvh]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded border border-emerald-400 bg-white/95 px-5 py-2.5 text-sm text-emerald-600 shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <motion.div
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: mysticEase }}
        className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-purple-200/60 bg-white/70 px-4 backdrop-blur-[10px] md:px-8"
      >
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-1 text-[#8888a0] transition-colors hover:text-[#4a4a6a]"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">历史</span>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-display text-lg uppercase tracking-wider text-[#4a4a6a]">
          占卜详情
        </h1>
        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-1 text-[#8888a0] transition-colors hover:text-[#ff3864]"
          aria-label="删除此记录"
        >
          <Trash2 size={18} />
          <span className="text-sm">删除</span>
        </button>
      </motion.div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: mysticEase }}
        className="mx-auto max-w-6xl px-4 pt-24 pb-8 text-center md:pt-28 md:pb-10"
      >
        <h1 className="font-display text-2xl uppercase tracking-wider text-[#4a4a6a] md:text-3xl">
          {record.spread.name}解读
        </h1>
        <p className="mt-2 font-serif italic text-base text-[#8888a0]">
          关于你的提问：「{record.question}」
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-[#8888a0] opacity-70">
          {dateStr}
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-[#c44fd4]" />
      </motion.header>

      {/* Card Overview */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: mysticEase }}
        className="mx-auto max-w-6xl px-4 pb-8"
      >
        <div className="flex gap-4 overflow-x-auto pb-4 md:justify-center md:gap-6">
          {cardsWithReversed.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.15, duration: 0.5, ease: mysticEase }}
              className="flex shrink-0 flex-col items-center"
            >
              <span className="mb-2 text-center text-[10px] uppercase tracking-wider text-[#c44fd4]">
                {record.spread.positions[idx]?.name ?? `第${idx + 1}张`}
              </span>
              <TarotCardComponent card={card} size="sm" showName={true} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Left: Cards */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: mysticEase }}
            className="lg:sticky lg:top-24 lg:h-fit lg:w-[40%]"
          >
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {cardsWithReversed.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, rotateY: 180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.4 + idx * 0.4,
                    ease: mysticEase,
                  }}
                  className="flex flex-col items-center"
                >
                  <span className="mb-2 text-center text-[10px] uppercase tracking-wider text-[#c44fd4]">
                    {record.spread.positions[idx]?.name ?? `第${idx + 1}张`}
                  </span>
                  <TarotCardComponent card={card} size="lg" showName={false} />
                </motion.div>
              ))}
            </div>
          </motion.aside>

          {/* Right: Interpretations */}
          <div className="flex-1 lg:w-[60%] space-y-6">
            {/* Overall */}
            <motion.section
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.5, ease: mysticEase }}
              className="rounded-xl border border-purple-200/50 bg-white/50 p-6 md:p-8 backdrop-blur-sm"
              style={{ borderLeft: '3px solid #c44fd4' }}
            >
              <div className="mb-3 flex items-center gap-2 text-[#c44fd4]">
                <BookOpen size={20} />
                <span className="font-serif text-lg font-semibold">阵法总括</span>
              </div>
              <p className="text-base leading-[1.8] text-[#4a4a6a]">
                {record.reading.overall}
              </p>
            </motion.section>

            {/* Energy Analysis */}
            <CollapsibleSection
              title="能量分析"
              icon={<Zap size={20} className="text-[#7B2CBF]" />}
              borderColor="#d4c0e0"
              delay={0.6}
            >
              <p className="text-sm leading-[1.8] text-[#4a4a6a]">
                {record.reading.energyAnalysis}
              </p>
            </CollapsibleSection>

            {/* Per-Card with three-tier structure */}
            <div className="space-y-6">
              {record.reading.cardReadings.map((cr, idx) => (
                <CardReadingDetail
                  key={idx}
                  cr={cr}
                  idx={idx}
                  card={cardsWithReversed[idx]}
                />
              ))}
            </div>

            {/* Cross Analysis */}
            <CollapsibleSection
              title="牌阵关联"
              icon={<Sparkles size={20} className="text-[#c44fd4]" />}
              borderColor="#d4c0e0"
              delay={0.8}
            >
              <p className="text-sm leading-[1.8] text-[#4a4a6a]">
                {record.reading.crossAnalysis}
              </p>
            </CollapsibleSection>

            {/* Synthesis */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: mysticEase }}
              className="rounded-xl border border-purple-200/50 bg-white/50 p-6 md:p-8 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2 text-[#7B2CBF]">
                <Sparkles size={20} />
                <span className="font-serif text-lg font-semibold">综合分析</span>
              </div>
              <p className="text-base leading-[1.8] text-[#4a4a6a]">
                {record.reading.synthesis}
              </p>
            </motion.section>

            {/* Timing */}
            <CollapsibleSection
              title="时机指引"
              icon={<Clock size={20} className="text-[#00d9a3]" />}
              borderColor="#d4c0e0"
              delay={1.0}
            >
              <p className="text-sm leading-[1.8] text-[#4a4a6a]">
                {record.reading.timing}
              </p>
            </CollapsibleSection>

            {/* Affirmation */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1, ease: mysticEase }}
              className="relative overflow-hidden rounded-xl border border-purple-200/50 bg-white/40 p-6 text-center md:p-8 backdrop-blur-sm"
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(196,79,212,0.2) 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-3 text-2xl">&#127775;</div>
                <p className="font-serif text-lg font-semibold leading-[1.8] text-[#c44fd4] md:text-xl">
                  {record.reading.affirmation}
                </p>
              </div>
            </motion.section>

            {/* Suggestions */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2, ease: mysticEase }}
              className="rounded-xl border-t border-[#c44fd4]/30 bg-white/50 p-6 md:p-8 backdrop-blur-sm"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.2))' }}
            >
              <h2 className="mb-5 font-display text-xl uppercase tracking-wider text-[#c44fd4]">
                星辰的指引
              </h2>
              <ol className="space-y-4">
                {paddedSuggestions.map((s, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 1.3 + idx * 0.1,
                      ease: mysticEase,
                    }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-[#c44fd4]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 shrink-0">{SUGGESTION_ICONS[idx]}</span>
                    <span className="text-sm leading-[1.8] text-[#4a4a6a]">{s}</span>
                  </motion.li>
                ))}
              </ol>
            </motion.section>

            {/* Follow-up Records */}
            {record.followUps && record.followUps.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.3, ease: mysticEase }}
                className="rounded-xl border border-purple-200/50 bg-white/50 p-6 md:p-8 backdrop-blur-sm"
              >
                <div className="mb-5 flex items-center gap-2 text-[#7B2CBF]">
                  <MessageCircle size={20} />
                  <span className="font-display text-lg uppercase tracking-wider">追问记录</span>
                  <span className="ml-2 text-[10px] text-[#8888a0] bg-[#7B2CBF]/10 rounded-full px-2 py-0.5">
                    {record.followUps.length} 条
                  </span>
                </div>
                {/* Timeline */}
                <div className="relative space-y-0">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#7B2CBF]/15" />
                  {record.followUps.map((fu, idx) => {
                    const fuDate = format(fu.timestamp, 'MM.dd HH:mm', { locale: zhCN })
                    return (
                      <motion.div
                        key={fu.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 1.4 + idx * 0.1, ease: mysticEase }}
                        className="relative pl-8 pb-6 last:pb-0"
                      >
                        <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-[#7B2CBF]/15 border border-[#7B2CBF]/30 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#7B2CBF]">{idx + 1}</span>
                        </div>

                        <div className="rounded border border-purple-200/40 bg-white/50 p-4 backdrop-blur-sm">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] text-[#8888a0]">{fuDate}</span>
                            <span className="rounded-full bg-[#7B2CBF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7B2CBF] border border-[#7B2CBF]/20">
                              {(fu as any)?.approach === 'deep-dive' ? '深度解读' : '再抽牌'}
                            </span>
                          </div>
                          <h4 className="font-serif text-sm font-semibold text-[#4a4a6a] mb-3">
                            「{fu.question}」
                          </h4>
                          <p className="text-sm leading-[1.8] text-[#4a4a6a] whitespace-pre-line">
                            {fu.answer}
                          </p>
                          {(fu as any)?.newCards && (fu as any)?.newCards.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {(fu as any)?.newCards.map((nc: any, ni: number) => (
                                <span
                                  key={ni}
                                  className="rounded-full bg-[#c44fd4]/10 px-2.5 py-1 text-[10px] text-[#c44fd4] border border-[#c44fd4]/20"
                                >
                                  {nc.name}（{nc.isReversed ? '逆位' : '正位'}）
                                </span>
                              ))}
                            </div>
                          )}
                          {(fu as any)?.focusCard !== undefined && record.cards[(fu as any)?.focusCard] && (
                            <div className="mt-2 text-[10px] text-[#8888a0]">
                              聚焦牌：第{(fu as any)?.focusCard + 1}张 · {record.cards[(fu as any)?.focusCard].name}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}

            {/* Bottom Actions (read-only) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 rounded bg-[#ff3864] px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,56,100,0.4)]"
              >
                <Trash2 size={16} />
                删除此记录
              </button>
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-2 rounded border border-purple-200/60 bg-white/50 px-5 py-2.5 text-sm font-medium text-[#4a4a6a] transition-all hover:border-[#7B2CBF] hover:bg-white/80"
              >
                <ArrowLeft size={16} />
                返回列表
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[5px]"
            onClick={() => setShowDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
              className="mx-4 w-full max-w-sm rounded-xl border border-[#ff3864] bg-white/95 p-8 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex justify-center">
                <svg width="64" height="64" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="48" stroke="#ff3864" strokeWidth="2" />
                  <path d="M60 12 L60 108" stroke="#ff3864" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M24 36 L96 84" stroke="#ff3864" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M96 36 L24 84" stroke="#ff3864" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>
              <h3 className="mb-2 text-center font-serif text-lg text-[#ff3864]">
                抹除这段记忆？
              </h3>
              <p className="mb-6 text-center text-sm text-[#8888a0]">
                这条占卜记录将被永久删除，无法恢复。
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="rounded border border-purple-200/60 px-5 py-2 text-sm font-medium text-[#4a4a6a] transition-all hover:border-[#7B2CBF]"
                >
                  保留
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded bg-[#ff3864] px-5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,56,100,0.4)]"
                >
                  抹除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
