/**
 * 付费墙弹窗组件
 * 当免费次数用完时弹出，引导用户充值或开通VIP
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Crown, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRICING } from '@/utils/vip';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayPerUse?: () => void;     // 单次付费回调
  onOpenVip?: () => void;        // 开通VIP回调
  spreadName?: string;
  cardCount?: number;
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  onPayPerUse,
  onOpenVip,
  spreadName = '本次测算', 
  cardCount = 3 
}: PaywallModalProps) {
  const navigate = useNavigate();
  const cost = cardCount <= 1 ? PRICING.singleReading : PRICING.complexReading;
  
  const handleGoVip = () => {
    onClose();
    if (onOpenVip) {
      onOpenVip();
    } else {
      navigate('/vip');
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
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-purple-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-[20px]"
            style={{ background: 'linear-gradient(135deg, #faf5ff, #fff0f5, #fdf5ff)' }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-purple-100 hover:text-purple-600"
            >
              <X size={18} />
            </button>
            
            {/* 标题 */}
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">✨</div>
              <h3 className="text-xl font-bold text-[#7B2CBF]">今日免费次数已用完</h3>
              <p className="text-sm text-gray-500 mt-1">「{spreadName}」需要付费继续</p>
            </div>
            
            {/* 选项 */}
            <div className="space-y-3 mb-5">
              {/* 单次付费 */}
              {onPayPerUse && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onClose(); onPayPerUse(); }}
                  className="w-full rounded-2xl border-2 border-purple-100 bg-white/70 p-4 text-left transition hover:border-purple-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                        <Zap size={18} className="text-[#7B2CBF]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">单次测算</p>
                        <p className="text-xs text-gray-500">{spreadName}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-[#7B2CBF]">¥{cost}</span>
                  </div>
                </motion.button>
              )}
              
              {/* 月卡 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoVip}
                className="w-full rounded-2xl border-2 border-[#7B2CBF] bg-gradient-to-r from-[#7B2CBF] to-[#9d4edd] p-4 text-white shadow-lg shadow-purple-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">月影会员</p>
                      <p className="text-xs text-white/80">30天无限次测算</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">¥{PRICING.monthlyVip}</span>
                    <span className="text-xs text-white/70">/月</span>
                  </div>
                </div>
              </motion.button>
              
              {/* 年卡 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoVip}
                className="w-full rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white shadow-lg shadow-amber-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Crown size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">天命会员</p>
                      <p className="text-xs text-white/80">365天无限次 + 年运报告</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">¥{PRICING.yearlyVip}</span>
                    <span className="text-xs text-white/70">/年</span>
                  </div>
                </div>
              </motion.button>
            </div>
            
            <p className="text-center text-xs text-gray-400">
              每天0点自动重置1次免费机会
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
