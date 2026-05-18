import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register, login, initAdmin, generateVerifyCode, checkVerifyCode } from '@/utils/userAuth';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifyQuestion, setVerifyQuestion] = useState('');
  const [verifyAnswer, setVerifyAnswer] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const navigate = useNavigate();

  // 初始化管理员
  useEffect(() => {
    initAdmin();
  }, []);

  // 注册时生成验证码
  useEffect(() => {
    if (isRegister) {
      const code = generateVerifyCode();
      setVerifyQuestion(code.question);
      setVerifyAnswer(code.answer);
      setVerifyInput('');
    }
  }, [isRegister]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!username.trim() || !password) {
      setError('请输入手机号和密码');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const result = await register(username.trim(), password, confirmPassword, verifyInput, verifyAnswer);
        if (result.success) {
          setSuccess('注册成功，正在登录...');
          setTimeout(() => navigate('/'), 1000);
        } else {
          setError(result.message);
          // 刷新验证码
          const code = generateVerifyCode();
          setVerifyQuestion(code.question);
          setVerifyAnswer(code.answer);
          setVerifyInput('');
        }
      } else {
        const result = await login(username.trim(), password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-purple-100"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔮</div>
          <h1 className="text-2xl font-bold text-[#7B2CBF]">yuyu塔罗测算</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister ? '注册新账号' : '登录您的账号'}
          </p>
        </div>

        <div className="space-y-4">
          {/* 用户名 */}
          <div>
            <input
              type="tel"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="请输入手机号"
              maxLength={11}
              className="w-full bg-white/90 border border-purple-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-purple-200 transition"
            />
          </div>

          {/* 密码 */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="密码"
              className="w-full bg-white/90 border border-purple-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-purple-200 transition"
            />
          </div>

          {/* 确认密码（注册时） */}
          {isRegister && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="确认密码"
                className="w-full bg-white/90 border border-purple-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-purple-200 transition"
              />
            </div>
          )}

          {/* 验证码（注册时） */}
          {isRegister && (
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setError(''); }}
                placeholder={`验证码: ${verifyQuestion}`}
                maxLength={2}
                className="flex-1 bg-white/90 border border-purple-200 rounded-xl px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-purple-200 transition"
              />
              <button
                type="button"
                onClick={() => {
                  const code = generateVerifyCode();
                  setVerifyQuestion(code.question);
                  setVerifyAnswer(code.answer);
                  setVerifyInput('');
                }}
                className="px-4 py-3 bg-purple-100 text-[#7B2CBF] rounded-xl font-bold text-sm hover:bg-purple-200 transition whitespace-nowrap"
              >
                刷新
              </button>
            </div>
          )}

          {/* 错误/成功提示 */}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm text-center">
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-sm text-center">
              {success}
            </motion.p>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition shadow-lg shadow-purple-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegister ? '注册' : '登录'}
          </button>

          {/* 切换 */}
          <p className="text-center text-sm text-gray-500">
            {isRegister ? '已有账号？' : '还没有账号？'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccess('');
                setVerifyInput('');
                if (!isRegister) {
                  const code = generateVerifyCode();
                  setVerifyQuestion(code.question);
                  setVerifyAnswer(code.answer);
                }
              }}
              className="text-[#7B2CBF] font-bold ml-1 hover:underline"
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>

          {/* 提示 */}
          <p className="text-center text-xs text-gray-400 mt-4">
            请使用手机号注册登录，数据已同步到云端
          </p>
        </div>
      </motion.div>
    </div>
  );
}
