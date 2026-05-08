import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { preloadAllImages } from '@/utils/preloader';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('正在加载塔罗牌面...');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    preloadAllImages((loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      setProgress(pct);
      if (pct >= 100) {
        setStatus('牌面加载完成');
      }
    }).then(() => {
      setStatus('准备就绪');
      setTimeout(() => {
        setVisible(false);
        // 给退出动画留出时间后再调用 onComplete
        setTimeout(onComplete, 600);
      }, 500);
    });
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-[#0a001a] flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className="text-center px-4">
            {/* 旋转水晶球 */}
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{
                rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="text-6xl mb-6 inline-block"
              style={{ filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))' }}
            >
              🔮
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#D4AF37] text-xl font-bold mb-2 tracking-wider"
            >
              yuyu塔罗测算
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[#8a8aaa] text-sm mb-8"
            >
              {status}
            </motion.p>

            {/* 进度条容器 */}
            <div className="w-64 md:w-80 h-2 bg-[#16213e] rounded-full overflow-hidden mx-auto">
              <motion.div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#f0d878] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[#8a8aaa] text-xs mt-3"
            >
              {progress}% / {progress >= 100 ? '已完成' : '78张牌面'}
            </motion.p>

            {/* 底部提示 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.0 }}
              className="text-[#8a8aaa] text-[10px] mt-8"
            >
              首次加载需要下载牌面图片，请耐心等待
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
