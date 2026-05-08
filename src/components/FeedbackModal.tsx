import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { submitFeedback } from '@/utils/storage';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
}

export default function FeedbackModal({ isOpen, onClose, defaultUsername = '' }: FeedbackModalProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!content.trim() || content.trim().length < 5) {
      setResult({ success: false, message: '反馈内容至少5个字符' });
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);
    
    const res = await submitFeedback(username, content);
    setResult(res);
    setIsSubmitting(false);
    
    if (res.success) {
      setContent('');
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 2000);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setResult(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-purple-100 bg-white/80 p-6 shadow-2xl backdrop-blur-[20px]"
            style={{ background: 'linear-gradient(135deg, #faf5ff, #fff0f5, #fdf5ff)' }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-purple-100 hover:text-purple-600"
            >
              <X size={18} />
            </button>
            
            {/* 标题 */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#7B2CBF]">意见反馈</h3>
                <p className="text-xs text-gray-500">帮助我们做得更好</p>
              </div>
            </div>
            
            {/* 用户名 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">你的称呼（可选）</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="匿名用户"
                className="w-full rounded-xl border border-purple-200/60 bg-white/60 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-purple-400 focus:bg-white/80 focus:ring-2 focus:ring-purple-200"
              />
            </div>
            
            {/* 反馈内容 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                反馈内容 <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请描述你遇到的问题或建议，至少5个字..."
                rows={5}
                className="w-full resize-none rounded-xl border border-purple-200/60 bg-white/60 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-purple-400 focus:bg-white/80 focus:ring-2 focus:ring-purple-200"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{content.length} 字</p>
            </div>
            
            {/* 结果提示 */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
                  result.success
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {result.message}
              </motion.div>
            )}
            
            {/* 提交按钮 */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || content.trim().length < 5}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${
                isSubmitting || content.trim().length < 5
                  ? 'cursor-not-allowed bg-gray-400 shadow-none'
                  : 'bg-gradient-to-r from-[#7B2CBF] to-[#9d4edd] shadow-purple-500/30 hover:shadow-purple-500/40'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  提交中...
                </>
              ) : (
                <>
                  <Send size={15} />
                  提交反馈
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
