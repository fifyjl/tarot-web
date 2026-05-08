import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Trash2, Eye, Sparkles, ArrowLeft, Search, X, MessageCircle } from 'lucide-react'

import { getHistory, deleteReading, clearHistory } from '@/utils/storage'
import type { SavedReading } from '@/utils/storage'
import { getCurrentUser, logout } from '@/utils/userAuth'

const mysticEase = [0.19, 1, 0.22, 1] as [number, number, number, number]

/* ------------------------------------------------------------------ */
/*  Broken Mirror Icon (Empty State)                                  */
/* ------------------------------------------------------------------ */

function BrokenMirrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      className={className}
    >
      <circle cx="60" cy="60" r="48" stroke="#d4c0e0" strokeWidth="2" />
      <path
        d="M60 12 L60 108"
        stroke="#9b8bb0"
        strokeWidth="1"
        strokeDasharray="4 4"
        className="animate-pulse"
      />
      <path
        d="M24 36 L96 84"
        stroke="#9b8bb0"
        strokeWidth="1"
        strokeDasharray="4 4"
        style={{ animationDelay: '1s' }}
        className="animate-pulse"
      />
      <path
        d="M96 36 L24 84"
        stroke="#9b8bb0"
        strokeWidth="1"
        strokeDasharray="4 4"
        style={{ animationDelay: '2s' }}
        className="animate-pulse"
      />
      <circle cx="42" cy="48" r="2" fill="#c44fd4" className="animate-pulse" />
      <circle cx="78" cy="72" r="2" fill="#c44fd4" style={{ animationDelay: '1.5s' }} className="animate-pulse" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  History Record Card                                               */
/* ------------------------------------------------------------------ */

function HistoryRecordCard({
  record,
  index,
  onDelete,
}: {
  record: SavedReading
  index: number
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ts = record.timestamp || Date.now()
  let dateStr = '未知日期'
  let timeStr = '--:--'
  try {
    dateStr = format(ts, 'yyyy.MM.dd', { locale: zhCN })
    timeStr = format(ts, 'HH:mm', { locale: zhCN })
  } catch {
    // 使用默认显示
  }

  const handleClick = () => {
    if (!showDelete) {
      navigate(`/history/${record.id}`)
    }
  }

  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowDelete(true)
    }, 600)
  }, [])

  const endLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const cardsToShow = record.cards.slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: mysticEase }}
      className="group relative overflow-hidden rounded-xl border border-purple-200/50 bg-white/60 transition-all hover:border-[#7B2CBF] hover:bg-white/80 backdrop-blur-sm"
      onClick={handleClick}
      onMouseDown={startLongPress}
      onMouseUp={endLongPress}
      onMouseLeave={endLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={endLongPress}
    >
      <div className="p-4 md:px-6 md:py-4">
        {/* Time label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#c44fd4] text-xs font-bold">{dateStr}</span>
          <span className="text-[#8888a0] text-xs">{timeStr}</span>
          <span className="ml-auto text-[#8888a0] text-[10px] uppercase tracking-wider">
            {record.spread.name}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-[#4a4a6a] font-bold text-sm mb-1 truncate">
          「{record.question}」
        </h3>
        <p className="text-[#8888a0] text-xs mb-3">
          {record.cards.length}张牌
        </p>

        {/* Card thumbnails */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1">
            {cardsToShow.map((card, cidx) => {
              const isRev = record.reading?.cardReadings?.[cidx]?.isReversed ?? card.isReversed ?? false
              return (
                <div
                  key={card.id}
                  className="w-10 h-14 rounded overflow-hidden relative border border-purple-200/50 bg-white/50 shrink-0"
                >
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className={`w-full h-full object-cover ${isRev ? 'rotate-180' : ''}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#c44fd4] text-[10px]">
                      {card.visualSymbol}
                    </div>
                  )}
                  <div
                    className={`absolute top-0 right-0 text-[8px] px-1 rounded ${
                      isRev
                        ? 'bg-rose-500/60 text-white'
                        : 'bg-emerald-500/60 text-white'
                    }`}
                  >
                    {isRev ? '逆' : '正'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Follow-up badge */}
          {record.followUps && record.followUps.length > 0 && (
            <div className="flex items-center gap-1 text-[#c44fd4] text-xs shrink-0">
              <MessageCircle size={14} />
              <span>{record.followUps.length}条追问</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/history/${record.id}`)
              }}
              className="rounded p-1.5 text-[#8888a0] transition-all hover:scale-110 hover:text-[#c44fd4]"
              aria-label="查看详情"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDelete(true)
              }}
              className="rounded p-1.5 text-[#8888a0] transition-all hover:text-[#ff3864]"
              aria-label="删除记录"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete overlay */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-[rgba(255,255,255,0.92)] backdrop-blur-sm"
          >
            <span className="text-sm text-[#4a4a6a]">抹除这段记忆？</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(record.id)
              }}
              className="rounded bg-[#ff3864] px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110"
            >
              抹除
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDelete(false)
              }}
              className="rounded border border-purple-200/60 px-3 py-1.5 text-xs font-medium text-[#4a4a6a] transition-all hover:border-[#7B2CBF]"
            >
              保留
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main History Page                                                 */
/* ------------------------------------------------------------------ */

export default function History() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [records, setRecords] = useState<SavedReading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showClearAll, setShowClearAll] = useState(false)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getHistory()
        setRecords(data)
      } catch {
        setRecords([])
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [])

  const handleDelete = async (id: string) => {
    await deleteReading(id)
    setRecords(await getHistory())
  }

  const handleClearAll = async () => {
    await clearHistory()
    setRecords([])
    setShowClearAll(false)
  }

  const handleLogout = () => {
    logout()
    setRecords([])
  }

  // Filter records by search query
  const filteredRecords = searchQuery.trim()
    ? records.filter((r) =>
        r.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.spread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cards.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : records

  // Not logged in state
  if (!user) {
    return (
      <div className="relative min-h-[100dvh] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: mysticEase }}
          className="text-center px-4"
        >
          <div className="text-4xl mb-4">&#128302;</div>
          <p className="text-[#8888a0] mb-6 text-sm">
            请先登录查看您的测算历史
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 shadow-lg shadow-purple-300/30"
          >
            <Sparkles size={16} />
            去登录
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[100dvh]">
      {/* Top Bar */}
      <motion.div
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: mysticEase }}
        className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-purple-200/60 bg-white/70 px-4 backdrop-blur-[10px] md:px-8"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-[#8888a0] transition-colors hover:text-[#4a4a6a]"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">返回</span>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-display text-lg uppercase tracking-wider text-[#4a4a6a]">
          历史记录
        </h1>
        {records.length > 0 && (
          <button
            onClick={() => setShowClearAll(true)}
            className="flex items-center gap-1 text-[#8888a0] transition-colors hover:text-[#ff3864]"
            aria-label="清空全部"
          >
            <Trash2 size={18} />
            <span className="text-sm">清空</span>
          </button>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        {/* User info header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#c44fd4] text-sm font-bold">
                {user.username}
              </h2>
              <p className="text-[#8888a0] text-xs mt-0.5">
                {records.length} 条测算记录
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#8888a0] text-xs border border-purple-200/60 rounded px-3 py-1.5 hover:border-[#ff3864] hover:text-[#ff3864] transition bg-white/50"
            >
              退出登录
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索问题、牌阵或牌名..."
              className="w-full bg-white/60 border border-purple-200/60 rounded-xl pl-9 pr-9 py-2.5 text-sm text-[#4a4a6a] placeholder:text-[#8888a0] focus:outline-none focus:border-[#7B2CBF] transition backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888a0] hover:text-[#4a4a6a]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-200 border-t-[#7B2CBF]" />
            <p className="text-sm text-[#8888a0]">正在加载历史记录...</p>
          </div>
        ) : records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center"
          >
            <BrokenMirrorIcon />
            <h2 className="font-serif text-xl text-[#4a4a6a]">
              记忆尚未在时空中留下印记
            </h2>
            <p className="max-w-[360px] text-sm text-[#8888a0]">
              完成一次占卜后，你的命运轨迹将在此显现。
            </p>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 shadow-lg shadow-purple-300/30"
            >
              <Sparkles size={16} />
              开始第一次占卜
            </button>
          </motion.div>
        ) : filteredRecords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Search size={40} className="text-purple-200 mb-4" />
            <p className="text-[#8888a0] text-sm">
              未找到与「{searchQuery}」相关的记录
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-[#c44fd4] text-sm hover:underline"
            >
              清除搜索
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredRecords.map((record, idx) => (
                <HistoryRecordCard
                  key={record.id}
                  record={record}
                  index={idx}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Clear All Modal */}
      <AnimatePresence>
        {showClearAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[5px]"
            onClick={() => setShowClearAll(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
              className="mx-4 w-full max-w-sm rounded-xl border border-[#ff3864] bg-white/90 p-8 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex justify-center">
                <BrokenMirrorIcon className="h-16 w-16 [&_circle]:stroke-[#ff3864] [&_path]:stroke-[#ff3864]" />
              </div>
              <h3 className="mb-2 text-center font-serif text-lg text-[#ff3864]">
                抹除所有记忆？
              </h3>
              <p className="mb-6 text-center text-sm text-[#8888a0]">
                {records.length} 条占卜记录将被永久删除，无法恢复。
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowClearAll(false)}
                  className="rounded border border-purple-200/60 px-5 py-2 text-sm font-medium text-[#4a4a6a] transition-all hover:border-[#7B2CBF]"
                >
                  保留
                </button>
                <button
                  onClick={handleClearAll}
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
