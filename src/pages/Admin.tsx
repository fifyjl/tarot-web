import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser, getAllUsers, logout } from '@/utils/userAuth';
import { getUserHistory, getAllFeedbacks } from '@/utils/storage';
import type { SavedReading, UserFeedback } from '@/utils/storage';

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Array<{ username: string; historyCount: number }>>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<SavedReading[]>([]);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      const allUsers = await getAllUsers();
      const userList = await Promise.all(
        allUsers.map(async (u) => ({
          username: u.username,
          historyCount: (await getUserHistory(u.username)).length,
        }))
      );
      setUsers(userList);
    };

    const fetchFeedbacks = async () => {
      const fb = await getAllFeedbacks();
      setFeedbacks(fb);
    };

    fetchUsers();
    fetchFeedbacks();
  }, [currentUser, navigate]);

  const viewUserHistory = async (username: string) => {
    setSelectedUser(username);
    setUserHistory(await getUserHistory(username));
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0e6ff, #ffe6f0, #f8e0ff)' }}>
        <p className="text-gray-500">无权访问</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0e6ff, #ffe6f0, #f8e0ff)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#7B2CBF]">🔐 管理后台</h1>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="px-4 py-2 text-[#7B2CBF] text-sm hover:underline">返回首页</button>
            <button onClick={() => { logout(); navigate('/login'); }} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm">退出</button>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-purple-100 mb-6">
          <h2 className="text-lg font-bold text-[#7B2CBF] mb-4">👥 用户列表 ({users.length}人)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {users.map((u) => (
              <motion.div
                key={u.username}
                whileHover={{ scale: 1.02 }}
                onClick={() => viewUserHistory(u.username)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedUser === u.username
                    ? 'border-[#7B2CBF] bg-purple-50'
                    : 'border-purple-100 bg-white/50 hover:border-purple-300'
                }`}
              >
                <p className="font-bold text-gray-800">{u.username}</p>
                <p className="text-xs text-gray-500">{u.historyCount} 条记录</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 反馈统计入口 */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setShowFeedbacks(!showFeedbacks)}
          className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-purple-100 mb-6 cursor-pointer transition hover:border-purple-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#7B2CBF]">用户反馈</h2>
                <p className="text-xs text-gray-500">查看用户提交的意见和建议</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-purple-100 px-2.5 text-sm font-bold text-[#7B2CBF]">
                {feedbacks.length}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B2CBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showFeedbacks ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </motion.div>

        {/* 选中用户的历史记录 */}
        {selectedUser && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-purple-100">
            <h2 className="text-lg font-bold text-[#7B2CBF] mb-4">📜 {selectedUser} 的测算记录</h2>
            {userHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {userHistory.map((record) => (
                  <div key={record.id} className="bg-white/50 rounded-xl p-4 border border-purple-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-800">「{record.question}」</p>
                      <span className="text-xs text-gray-400">
                        {new Date(record.timestamp).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {record.spread.name} · {record.cards.length}张牌
                    </p>
                    <div className="flex gap-1 mt-2">
                      {record.cards.map((c, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded ${c.isReversed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {c.name}{c.isReversed ? '(逆)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 反馈列表 */}
        {showFeedbacks && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-purple-100"
          >
            <h2 className="text-lg font-bold text-[#7B2CBF] mb-4">反馈列表 ({feedbacks.length}条)</h2>
            {feedbacks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无反馈</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {feedbacks.map((fb, index) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/50 rounded-xl p-4 border border-purple-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                          {fb.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{fb.username}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(fb.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-9">{fb.content}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
