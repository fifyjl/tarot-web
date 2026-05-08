import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Spreads from './pages/Spreads'
import Draw from './pages/Draw'
import Result from './pages/Result'
import FollowUpDraw from './pages/FollowUpDraw'
import History from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import Login from './pages/Login'
import Meditation from './pages/Meditation'
import DailyFortune from './pages/DailyFortune'
import Admin from './pages/Admin'
import VipCenter from './pages/VipCenter'
import { isLoggedIn } from './utils/userAuth'

/* Route guard for pages that require login */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoggedIn() && location.pathname !== '/login') {
      navigate('/login', { replace: true })
    }
  }, [navigate, location.pathname])

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/meditation" element={<Meditation />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/vip" element={<VipCenter />} />
      <Route
        path="/daily"
        element={
          <AuthGuard>
            <DailyFortune />
          </AuthGuard>
        }
      />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Home />
          </AuthGuard>
        }
      />
      <Route
        path="/spreads"
        element={
          <AuthGuard>
            <Spreads />
          </AuthGuard>
        }
      />
      <Route
        path="/draw"
        element={
          <AuthGuard>
            <Draw />
          </AuthGuard>
        }
      />
      <Route
        path="/result"
        element={
          <AuthGuard>
            <Result />
          </AuthGuard>
        }
      />
      <Route
        path="/followup-draw"
        element={
          <AuthGuard>
            <FollowUpDraw />
          </AuthGuard>
        }
      />
      <Route
        path="/history"
        element={
          <AuthGuard>
            <History />
          </AuthGuard>
        }
      />
      <Route
        path="/history/:id"
        element={
          <AuthGuard>
            <HistoryDetail />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
