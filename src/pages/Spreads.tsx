import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronDown, ChevronUp, Sparkles, LayoutGrid } from 'lucide-react'
import type { Spread } from '@/data/spreads'
import { SPREADS, matchSpreads } from '@/data/spreads'
import Layout from '@/components/Layout'

/* ------------------------------------------------------------------ */
/*  Spread geometry visuals (SVG)                                     */
/* ------------------------------------------------------------------ */

function SingleSpreadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.8" />
      <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  )
}

function TriangleSpreadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <polygon points="60,20 100,90 20,90" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="20" r="5" fill="currentColor" opacity="0.8" />
      <circle cx="20" cy="90" r="5" fill="currentColor" opacity="0.8" />
      <circle cx="100" cy="90" r="5" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function DiamondSpreadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <polygon points="60,15 105,60 60,105 15,60" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="15" r="5" fill="currentColor" opacity="0.8" />
      <circle cx="105" cy="60" r="5" fill="currentColor" opacity="0.8" />
      <circle cx="60" cy="105" r="5" fill="currentColor" opacity="0.8" />
      <circle cx="15" cy="60" r="5" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function HexagramSpreadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <polygon points="60,10 105,35 105,85 60,110 15,85 15,35" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <polygon points="60,30 90,50 90,90 60,110 30,90 30,50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="60" cy="10" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="105" cy="35" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="105" cy="85" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="60" cy="110" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="15" cy="85" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="15" cy="35" r="4" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function CrossSpreadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <line x1="60" y1="15" x2="60" y2="105" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="15" y1="60" x2="105" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <circle cx="60" cy="15" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="60" cy="60" r="6" fill="currentColor" opacity="0.9" />
      <circle cx="60" cy="105" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="15" cy="60" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="105" cy="60" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="60" cy="35" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="60" cy="85" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="35" cy="60" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="85" cy="60" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

const SPREAD_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  single: SingleSpreadIcon,
  three: TriangleSpreadIcon,
  choice: DiamondSpreadIcon,
  hexagram: HexagramSpreadIcon,
  celtic: CrossSpreadIcon,
}

/* ------------------------------------------------------------------ */
/*  Keyword detection (mirrors Home logic)                            */
/* ------------------------------------------------------------------ */

const KEYWORD_TAGS = [
  { label: '感情', keywords: ['感情', '爱情', '恋爱', '婚姻', '分手', '复合', '桃花', '对象', '姻缘', '情侣', '他', '她', '对方'] },
  { label: '事业', keywords: ['事业', '工作', '职场', '升职', '跳槽', '创业', '项目', '领导', '同事', '面试', 'offer', '职业', '发展'] },
  { label: '财富', keywords: ['财富', '钱', '财运', '投资', '理财', '收入', '工资', '赚钱', '生意', '股票', '基金', '经济', '财务'] },
  { label: '学业', keywords: ['学业', '考试', '学习', '学校', '录取', '成绩', '考研', '留学', '论文', '专业', '毕业', '升学'] },
  { label: '健康', keywords: ['健康', '身体', '疾病', '生病', '康复', '体检', '症状', '医院', '医生', '养生'] },
  { label: '抉择', keywords: ['选择', '抉择', '二选一', '选哪个', '决定', '怎么办', '要不要', '是否', '该'] },
]

function detectKeywords(text: string): string[] {
  const q = text.toLowerCase()
  return KEYWORD_TAGS.filter((tag) =>
    tag.keywords.some((kw) => q.includes(kw))
  ).map((tag) => tag.label)
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function Spreads() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const question = searchParams.get('question') || sessionStorage.getItem('mystictarot_question') || ''
  const [showAll, setShowAll] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const truncatedQuestion = useMemo(() => {
    if (question.length <= 30) return question
    return question.slice(0, 30) + '...'
  }, [question])

  const keywords = useMemo(() => detectKeywords(question), [question])

  const recommended = useMemo(() => {
    if (!question.trim()) return SPREADS
    return matchSpreads(question)
  }, [question])

  const allSpreads = SPREADS

  const handleSelect = useCallback((spread: Spread) => {
    if (selectedId === spread.id) {
      navigate(`/meditation?spreadId=${spread.id}&spreadName=${encodeURIComponent(spread.name)}&question=${encodeURIComponent(question)}`)
    } else {
      setSelectedId(spread.id)
    }
  }, [selectedId, navigate, question])

  const handleBack = useCallback(() => {
    navigate(`/?question=${encodeURIComponent(question)}`)
  }, [navigate, question])

  return (
    <Layout>
      <div className="relative flex min-h-[100dvh] flex-col items-center px-4 pb-12 pt-24 md:pt-32">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          onClick={handleBack}
          className="absolute left-4 top-20 flex items-center gap-2 text-sm text-[#8888a0] transition-colors hover:text-[#7B2CBF] md:left-8 md:top-24"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>返回</span>
        </motion.button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          className="mb-6 text-center"
        >
          <h1 className="font-display text-2xl uppercase tracking-wider text-[#4a4a6a] md:text-3xl">
            选择牌阵
          </h1>
        </motion.div>

        {/* Question review */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 max-w-[600px] text-center"
        >
          <p className="mb-2 text-xs uppercase tracking-wider text-[#8888a0]">
            你的提问
          </p>
          <p className="font-serif text-base italic text-[#4a4a6a]">
            <span className="text-[#c44fd4]">&ldquo;</span>
            {truncatedQuestion}
            <span className="text-[#c44fd4]">&rdquo;</span>
          </p>
          {keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {keywords.map((kw, i) => (
                <motion.span
                  key={kw}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                  className="rounded-full border border-purple-200/60 bg-white/50 px-3 py-1 text-xs uppercase tracking-wider text-[#7B2CBF] backdrop-blur-sm"
                >
                  #{kw}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recommended section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          className="mb-8 w-full max-w-[900px]"
        >
          <div className="mb-4 flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-[#c44fd4]" />
            <h2 className="text-sm uppercase tracking-wider text-[#4a4a6a]">
              为您推荐
            </h2>
          </div>

          {/* Horizontal scroll container */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-2 md:gap-6 md:overflow-visible">
            {recommended.map((spread, i) => (
              <SpreadCard
                key={spread.id}
                spread={spread}
                index={i}
                isRecommended
                isMostRecommended={i === 0}
                isSelected={selectedId === spread.id}
                hasAnySelected={selectedId !== null}
                onSelect={() => handleSelect(spread)}
              />
            ))}
          </div>
        </motion.div>

        {/* Toggle all spreads */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-6 w-full max-w-[900px]"
        >
          <button
            onClick={() => setShowAll((s) => !s)}
            className="flex w-full items-center justify-between rounded-lg border border-purple-200/60 bg-white/50 px-5 py-3 text-sm text-[#4a4a6a] transition-colors hover:border-[#7B2CBF] hover:bg-white/70 backdrop-blur-sm"
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[#8888a0]" />
              查看全部阵法
            </span>
            {showAll ? <ChevronUp className="h-4 w-4 text-[#8888a0]" /> : <ChevronDown className="h-4 w-4 text-[#8888a0]" />}
          </button>
        </motion.div>

        {/* Expanded all spreads */}
        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
              className="w-full max-w-[900px] overflow-hidden"
            >
              <div className="flex flex-col gap-4 pb-8 md:grid md:grid-cols-2 md:gap-6">
                {allSpreads.map((spread, i) => (
                  <SpreadCard
                    key={spread.id}
                    spread={spread}
                    index={i}
                    isRecommended={false}
                    isMostRecommended={false}
                    isSelected={selectedId === spread.id}
                    hasAnySelected={selectedId !== null}
                    onSelect={() => handleSelect(spread)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA for selected spread */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4"
            >
              <button
                onClick={() => {
                  const spread = SPREADS.find((s) => s.id === selectedId)
                  if (spread) {
                    navigate(`/meditation?spreadId=${spread.id}&spreadName=${encodeURIComponent(spread.name)}&question=${encodeURIComponent(question)}`)
                  }
                }}
                className="relative rounded-full bg-[#c44fd4] px-8 py-4 text-sm font-medium uppercase tracking-wider text-white shadow-glow transition-all hover:bg-[#7B2CBF] hover:shadow-[0_0_30px_rgba(196,79,212,0.4)]"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  开始抽牌仪式
                </span>
                {/* Ripple ring */}
                <span className="absolute inset-0 -z-10 animate-ripple rounded-full" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

/* ------------------------------------------------------------------ */
/*  Spread Card Component                                              */
/* ------------------------------------------------------------------ */

interface SpreadCardProps {
  spread: Spread
  index: number
  isRecommended: boolean
  isMostRecommended: boolean
  isSelected: boolean
  hasAnySelected: boolean
  onSelect: () => void
}

function SpreadCard({
  spread,
  index,
  isRecommended,
  isMostRecommended,
  isSelected,
  hasAnySelected,
  onSelect,
}: SpreadCardProps) {
  const Icon = SPREAD_ICON_MAP[spread.id] || SingleSpreadIcon
  const isDimmed = hasAnySelected && !isSelected

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, rotateX: 15 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{
        duration: 0.8,
        delay: isRecommended ? index * 0.15 : 0,
        ease: [0.19, 1, 0.22, 1] as [number, number, number, number],
      }}
      onClick={onSelect}
      className="relative flex-shrink-0 cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-[280px] overflow-hidden rounded-xl border p-5 transition-all duration-300 md:w-full backdrop-blur-sm ${
          isSelected
            ? 'border-[#c44fd4] border-2 bg-white/80'
            : 'border-purple-200/60 bg-white/50 hover:border-[#7B2CBF] hover:bg-white/70'
        } ${isDimmed ? 'opacity-40 blur-[2px]' : ''}`}
      >
        {/* Purple sheen sweep on selected */}
        {isSelected && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(196,79,212,0.08) 45%, rgba(196,79,212,0.15) 50%, rgba(196,79,212,0.08) 55%, transparent 60%)',
            }}
          />
        )}

        {/* Most recommended badge */}
        {isMostRecommended && (
          <div className="absolute -right-1 -top-1 z-20 rounded-bl-lg rounded-tr-lg bg-[#c44fd4] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            最推荐
          </div>
        )}

        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="font-serif text-lg font-semibold text-[#4a4a6a]">
            {spread.name}
          </h3>
          <span className="rounded-full border border-[#c44fd4] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#c44fd4]">
            {spread.cardCount} 张牌
          </span>
        </div>

        {/* Geometry visual */}
        <div className="mb-3 flex justify-center">
          <Icon
            className={`h-20 w-20 transition-all duration-500 ${
              isSelected ? 'text-[#c44fd4] drop-shadow-[0_0_8px_rgba(123,44,191,0.4)]' : 'text-[#8888a0]'
            }`}
          />
        </div>

        {/* Description */}
        <p className="mb-3 text-sm leading-relaxed text-[#8888a0]">
          {spread.description}
        </p>

        {/* Position tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {spread.positions.slice(0, 4).map((pos) => (
            <span
              key={pos.index}
              className="rounded border border-purple-200/50 px-2 py-0.5 text-[10px] text-[#7B2CBF] bg-white/40"
            >
              {pos.name}
            </span>
          ))}
          {spread.positions.length > 4 && (
            <span className="rounded border border-purple-200/50 px-2 py-0.5 text-[10px] text-[#7B2CBF] bg-white/40">
              +{spread.positions.length - 4}
            </span>
          )}
        </div>

        {/* Best for tags */}
        <div className="flex flex-wrap gap-2">
          {spread.keywords.slice(0, 4).map((kw) => (
            <span key={kw} className="text-[10px] uppercase tracking-wider text-[#8888a0]">
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
