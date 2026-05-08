import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Meditation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(15);

  const question = searchParams.get('question') || sessionStorage.getItem('mystictarot_question') || '';
  const spreadId = searchParams.get('spreadId') || 'three';
  const spreadName = searchParams.get('spreadName') || '三牌阵';

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/draw?spreadId=' + spreadId + '&question=' + encodeURIComponent(question));
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate, question, spreadId]);

  const handleStart = () => {
    navigate('/draw?spreadId=' + spreadId + '&question=' + encodeURIComponent(question));
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #f8e0ff 100%)',
      }}
    >
      {/* 呼吸动画圆圈 */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-300/40 to-pink-300/40 backdrop-blur-sm"
      />

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-[#7B2CBF] mt-8"
      >
        静心凝神
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-gray-600 text-center mt-4 max-w-md leading-relaxed"
      >
        你的问题是：「{question || '（未设置问题）'}」<br /><br />
        接下来，请轻轻闭上双眼<br />
        深呼吸三次<br />
        在心里默默念诵你的问题<br />
        让塔罗牌感应你的能量...<br /><br />
        准备好了吗？
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg shadow-lg shadow-purple-300/40"
      >
        &#10024; 我已准备好，开始抽牌
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-gray-400 text-xs mt-4"
      >
        {countdown}秒后自动进入...
      </motion.p>
    </div>
  );
}
