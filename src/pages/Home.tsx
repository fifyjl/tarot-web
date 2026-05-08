import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import { preloadCardImages } from '@/utils/imagePreloader'
import { getVipStatus } from '@/utils/vip'

/* ------------------------------------------------------------------ */
/*  示例问题池（50条）- 每次首页随机抽取6条展示                       */
/* ------------------------------------------------------------------ */

const EXAMPLE_POOL = [
  // 感情类（10条）
  '我和他会复合吗？',
  '我的正缘什么时候出现？',
  '这段感情值得继续吗？',
  '他对我是什么感觉？',
  '我们什么时候能在一起？',
  '前任还会回来找我吗？',
  '异地恋有结果吗？',
  '我该主动表白吗？',
  '暧昧期会转正吗？',
  '婚姻运势怎么样？',

  // 事业类（10条）
  '我这次面试能成功吗？',
  '这份工作适合我吗？',
  '什么时候能升职加薪？',
  '创业会不会成功？',
  '该跳槽还是留下？',
  '领导怎么看我？',
  '转行做哪个方向好？',
  '项目能顺利完成吗？',
  '副业能不能做起来？',
  '未来三年事业走向如何？',

  // 财富类（8条）
  '今年的财运怎么样？',
  '这笔投资能赚钱吗？',
  '什么时候能还清债务？',
  '买房时机到了吗？',
  '偏财运有吗？',
  '副业收入能有多少？',
  '股票现在该买还是卖？',
  '理财选什么产品好？',

  // 学业类（8条）
  '考试能过吗？',
  '考研能不能上岸？',
  '选这个专业对吗？',
  '论文能顺利完成吗？',
  '出国留学合适吗？',
  '考证能不能通过？',
  '什么时候能找到实习？',
  '未来的学业运势如何？',

  // 健康类（6条）
  '身体状况需要注意什么？',
  '失眠问题能改善吗？',
  '这病什么时候能好？',
  '心理压力怎么缓解？',
  '适合什么运动方式？',
  '养生需要注意什么？',

  // 通用类（8条）
  '今年整体运势如何？',
  '下个月有什么需要注意的？',
  '最近有什么机遇？',
  '搬家/旅行合适吗？',
  '和朋友的矛盾能化解吗？',
  '家庭关系能改善吗？',
  '人生方向迷茫怎么办？',
  '适合做重大决定吗？',
]

/** 从问题池中随机抽取指定数量 */
function getRandomExamples(count: number = 6): string[] {
  const shuffled = [...EXAMPLE_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

const KEYWORD_TAGS = [
  { label: '感情', emoji: '💕', keywords: ['感情', '爱情', '恋爱', '婚姻', '分手', '复合', '桃花', '对象', '姻缘', '情侣', '他', '她', '对方'] },
  { label: '事业', emoji: '💼', keywords: ['事业', '工作', '职场', '升职', '跳槽', '创业', '项目', '领导', '同事', '面试', 'offer', '职业', '发展'] },
  { label: '财富', emoji: '💰', keywords: ['财富', '钱', '财运', '投资', '理财', '收入', '工资', '赚钱', '生意', '股票', '基金', '经济', '财务'] },
  { label: '学业', emoji: '📚', keywords: ['学业', '考试', '学习', '学校', '录取', '成绩', '考研', '留学', '论文', '专业', '毕业', '升学'] },
  { label: '健康', emoji: '🏥', keywords: ['健康', '身体', '疾病', '生病', '康复', '体检', '症状', '医院', '医生', '养生'] },
  { label: '人际', emoji: '🤝', keywords: ['人际', '朋友', '社交', '关系', '沟通', '人脉', '圈子', '相处'] },
]

function detectKeywords(text: string): string[] {
  const q = text.toLowerCase()
  return KEYWORD_TAGS.filter((tag) =>
    tag.keywords.some((kw) => q.includes(kw))
  ).map((tag) => tag.label)
}

export default function Home() {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [detected, setDetected] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [examples, setExamples] = useState<string[]>([])

  const charCount = question.length
  const isValid = charCount >= 5 && charCount <= 200

  // 页面加载时随机抽取示例问题 + 预加载牌面图片
  useEffect(() => {
    setExamples(getRandomExamples(6))
    // 后台预加载牌面图片（前10张优先）
    preloadCardImages(10)
  }, [])

  // Debounced keyword detection
  useEffect(() => {
    if (question.length < 2) {
      setShowHint(false)
      return
    }
    const timer = setTimeout(() => {
      const kw = detectKeywords(question)
      setDetected(kw)
      setShowHint(kw.length > 0)
    }, 1500)
    return () => clearTimeout(timer)
  }, [question])

  const handleQuestionChange = useCallback((value: string) => {
    if (value.length > 200) return
    setQuestion(value)
    if (value.length < 2) {
      setShowHint(false)
      setDetected([])
    }
  }, [])

  const handleExampleClick = useCallback((q: string) => {
    setQuestion(q)
    const kw = detectKeywords(q)
    setDetected(kw)
    setShowHint(kw.length > 0)
    // Auto-navigate after short delay to show the filled text
    setTimeout(() => {
      navigate('/spreads?question=' + encodeURIComponent(q))
    }, 400)
  }, [navigate])

  const handleSubmit = useCallback(() => {
    if (!isValid) return
    setIsLoading(true)
    setTimeout(() => {
      navigate('/spreads?question=' + encodeURIComponent(question))
    }, 600)
  }, [isValid, question, navigate])

  // Character counter color logic
  const getCounterColor = () => {
    if (charCount > 180) return '#ff3864'
    if (charCount > 100) return '#c44fd4'
    return '#8888a0'
  }

  const counterShake = charCount > 180 && charCount <= 200

  return (
    <Layout>
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-20">
        {/* Glow Orbs */}
        <div
          className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[300px] animate-float rounded-full opacity-70 md:h-[400px] md:w-[400px]"
          style={{ background: 'radial-gradient(circle, rgba(123,44,191,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-[15%] right-[15%] h-[200px] w-[200px] animate-float-delayed rounded-full opacity-70 md:h-[300px] md:w-[300px]"
          style={{ background: 'radial-gradient(circle, rgba(196,79,212,0.08) 0%, transparent 70%)' }}
        />

        {/* Main Content */}
        <div
          className="relative z-10 flex w-full max-w-[720px] flex-col items-center gap-8 md:gap-10"
          style={{
            filter: isFocused ? 'brightness(0.95)' : 'brightness(1)',
            transition: 'filter 0.3s ease',
          }}
        >
          {/* 今日运势 — 醒目大按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <motion.button
              onClick={() => navigate('/daily')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-5 text-white shadow-lg shadow-purple-400/40 transition hover:shadow-xl hover:shadow-purple-400/50"
              style={{
                backgroundSize: '200% 100%',
                animation: 'gradient-shift 3s ease infinite',
              }}
            >
              {/* 背景光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              
              <div className="relative flex items-center justify-center gap-3">
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl"
                >
                  ✨
                </motion.span>
                <div className="text-left">
                  <div className="text-lg font-bold">一键测算今日运势</div>
                  <div className="text-xs text-white/80">塔罗牌揭示今天的爱情、事业、财富、健康</div>
                </div>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl"
                >
                  →
                </motion.span>
              </div>
            </motion.button>
            {/* 免费次数提示 */}
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-xs text-gray-500">
                每日1次免费
                {getVipStatus().isUnlimited && <span className="text-amber-500 font-bold ml-1">VIP无限</span>}
              </span>
              {!getVipStatus().isUnlimited && getVipStatus().freeRemaining === 0 && (
                <span className="text-xs text-purple-500 font-medium">今日已用完</span>
              )}
              {!getVipStatus().isUnlimited && getVipStatus().freeRemaining > 0 && (
                <span className="text-xs text-emerald-500 font-medium">剩余{getVipStatus().freeRemaining}次</span>
              )}
            </div>
          </motion.div>

          {/* Moon Logo */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
            className="animate-breathe"
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 0 8px rgba(196,79,212,0.4))' }}
            >
              <path
                d="M24 8C15.16 8 8 15.16 8 24C8 32.84 15.16 40 24 40V8Z"
                stroke="#c44fd4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M24 40C32.84 40 40 32.84 40 24"
                stroke="#c44fd4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="font-display text-center text-[24px] font-normal uppercase tracking-[2px] text-[#4a4a6a] md:text-[40px] md:tracking-[4px]"
            style={{ textShadow: '0 0 20px rgba(123, 44, 191, 0.15)' }}
          >
            {'向星辰倾诉你的疑惑'.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: 20, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 1.2 + i * 0.05,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.0 }}
            className="max-w-[480px] text-center font-serif text-[16px] italic leading-relaxed text-[#8888a0] md:text-[18px]"
          >
            塔罗不是预言，而是潜意识的镜像。在静谧中写下你的问题，星辰将为你指引方向。
          </motion.p>

          {/* Keyword Tags (static display) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {KEYWORD_TAGS.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1 rounded-full border border-purple-200/60 bg-white/50 px-3 py-1 text-xs text-[#8888a0] backdrop-blur-sm"
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
              </span>
            ))}
          </motion.div>

          {/* Input Wrapper */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 2.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="relative w-full"
            style={{ transformOrigin: 'center' }}
          >
            <div className="relative w-full">
              {/* Label */}
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6 }}
                className="mb-3 block text-center font-serif text-[14px] italic tracking-wide text-[#8888a0]"
              >
                今日，你为何而来？
              </motion.label>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="例如：我和他的关系会如何发展？ / 我是否应该接受这份新工作？"
                  rows={4}
                  className="w-full resize-none border-0 border-b bg-transparent px-0 py-3 text-center font-sans text-[14px] leading-[1.8] text-[#4a4a6a] placeholder:font-serif placeholder:text-[14px] placeholder:italic placeholder:text-[#8888a0] focus:outline-none md:text-[16px]"
                  style={{
                    borderBottomWidth: '1px',
                    borderBottomColor: charCount > 200 ? '#ff3864' : isFocused ? '#c44fd4' : '#d4c0e0',
                    boxShadow: isFocused ? '0 10px 30px -10px rgba(196, 79, 212, 0.15)' : 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    outline: isFocused ? '1px solid transparent' : 'none',
                  }}
                />
                {/* Character Counter */}
                <div
                  className="absolute bottom-2 right-0 text-xs uppercase tracking-wider"
                  style={{
                    color: getCounterColor(),
                    animation: counterShake ? 'shake 0.1s ease-in-out infinite' : 'none',
                  }}
                >
                  {charCount}/200
                </div>
              </div>

              {/* Keyword Detection Hint */}
              <AnimatePresence>
                {showHint && detected.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 text-center"
                  >
                    <p className="text-xs uppercase tracking-wider text-[#c44fd4]">
                      检测到关键词：
                      <span className="font-semibold">
                        {detected.map((d, i) => (
                          <span key={d}>
                            {i > 0 && ' / '}
                            {d}
                          </span>
                        ))}
                      </span>
                      ... 系统已为你筛选相关牌阵。
                    </p>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mx-auto mt-1 h-px w-32 bg-[#c44fd4]"
                      style={{ transformOrigin: 'center' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Example Questions - 随机展示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {examples.map((q) => (
              <button
                key={q}
                onClick={() => handleExampleClick(q)}
                className="rounded-full border border-purple-200/60 bg-white/50 px-4 py-1.5 text-xs text-[#8888a0] transition-colors hover:border-[#7B2CBF] hover:text-[#4a4a6a] backdrop-blur-sm"
              >
                {q}
              </button>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 3.0, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <button
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className="relative overflow-hidden px-12 py-4 font-sans text-sm font-semibold uppercase tracking-[2px] transition-all duration-300"
              style={{
                background: isValid && !isLoading ? '#c44fd4' : 'rgba(255,255,255,0.5)',
                color: isValid && !isLoading ? '#ffffff' : '#8888a0',
                border: isValid && !isLoading ? 'none' : '1px solid #d4c0e0',
                borderRadius: '0px',
                cursor: isValid && !isLoading ? 'pointer' : 'not-allowed',
                boxShadow: isValid && !isLoading ? '0 0 20px rgba(196, 79, 212, 0.3)' : 'none',
                animation: isValid && !isLoading ? 'ripple 1.5s ease-out infinite' : 'none',
              }}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  开启中...
                </span>
              ) : (
                '开启牌阵之旅'
              )}
            </button>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Layout>
  )
}
