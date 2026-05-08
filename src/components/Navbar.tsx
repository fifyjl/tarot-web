import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import { getCurrentUser, logout, isLoggedIn } from '@/utils/userAuth'
import { getVipStatus } from '@/utils/vip'
import FeedbackModal from '@/components/FeedbackModal'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const loggedIn = isLoggedIn()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const links = [
    { path: '/', label: '占卜' },
    { path: '/daily', label: '运势' },
    { path: '/history', label: '历史' },
  ]

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <>
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-8"
    >
      <div className="flex items-center gap-1 rounded-full border border-purple-200/60 bg-white/60 px-2 py-2 backdrop-blur-[12px] md:gap-2 md:px-4">
        <Link to="/" className="flex items-center gap-2 px-3 py-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C7.58 2 4 5.58 4 10C4 14.42 7.58 18 12 18V2Z"
              stroke="#c44fd4"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 18C16.42 18 20 14.42 20 10"
              stroke="#c44fd4"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="mx-1 h-5 w-px bg-purple-200/60 md:mx-2" />

        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path) && link.path !== '/' ? true : location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`relative rounded-full px-4 py-1.5 text-sm font-medium tracking-wide transition-colors ${
                isActive
                  ? 'text-[#7B2CBF]'
                  : 'text-[#8888a0] hover:text-[#4a4a6a]'
              }`}
            >
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-full border border-[#7B2CBF]/40"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}

        <div className="mx-1 h-5 w-px bg-purple-200/60 md:mx-2" />

        {/* User section */}
        {loggedIn && user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[#8888a0] hover:text-[#4a4a6a] transition-colors"
            >
              <User size={14} className="text-[#7B2CBF]" />
              <div className="flex items-center gap-1.5">
                <span className="hidden md:inline text-xs">{user.username.slice(0, 3)}****{user.username.slice(-4)}</span>
                {user?.isAdmin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-bold">管理</span>
                )}
                {user?.isAdmin === false && getVipStatus().isVip && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                    {getVipStatus().tier === 'yearly' ? '天命' : '月影'}
                  </span>
                )}
              </div>
              <ChevronDown size={12} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-purple-200/60 bg-white/80 p-2 shadow-lg backdrop-blur-[10px]"
                >
                  <div className="px-3 py-2 text-xs text-[#8888a0] border-b border-purple-200/40 mb-1">
                    {user.username}
                  </div>
                  <button
                    onClick={() => { setShowFeedback(true); setShowUserMenu(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#7B2CBF] hover:bg-purple-50 transition"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    意见反馈
                  </button>
                  {/* 管理员专属入口 */}
                  {user?.isAdmin && (
                    <>
                      <div className="my-1 border-t border-purple-200/40" />
                      <button
                        onClick={() => { navigate('/admin'); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        管理后台
                      </button>
                    </>
                  )}
                  <div className="my-1 border-t border-purple-200/40" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#ff3864] hover:bg-[rgba(255,56,100,0.1)] transition"
                  >
                    <LogOut size={14} />
                    退出登录
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[#8888a0] hover:text-[#7B2CBF] transition-colors"
          >
            <LogIn size={14} />
            <span className="hidden md:inline">登录</span>
          </button>
        )}
      </div>
    </motion.nav>

    <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} defaultUsername={user?.username || ''} />
    </>
  )
}
