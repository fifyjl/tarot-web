/**
 * 支付收款码弹窗
 * 显示微信或支付宝收款码，用户扫码付款
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, MessageSquare } from 'lucide-react';

interface PaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  payMethod: 'wechat' | 'alipay' | null;
  productName: string;
  amount: number;
  onPaid: () => void;
}

export default function PaymentQrModal({ 
  isOpen, 
  onClose, 
  payMethod, 
  productName, 
  amount, 
  onPaid 
}: PaymentQrModalProps) {
  const [paidStep, setPaidStep] = useState<'qr' | 'confirm' | 'done'>('qr');
  
  const isWechat = payMethod === 'wechat';
  const qrImage = isWechat ? '/payment/wechat-qr.jpg' : '/payment/alipay-qr.jpg';
  const brandColor = isWechat ? '#22c55e' : '#1677ff';
  const brandName = isWechat ? '微信支付' : '支付宝';
  const brandBg = isWechat ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';
  
  const handlePaid = () => {
    setPaidStep('confirm');
  };
  
  const handleConfirmPaid = () => {
    setPaidStep('done');
    onPaid();
    setTimeout(() => {
      onClose();
      setPaidStep('qr');
    }, 2000);
  };
  
  const handleClose = () => {
    setPaidStep('qr');
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && payMethod && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100"
            >
              <X size={18} />
            </button>
            
            {paidStep === 'qr' && (
              <>
                {/* 标题 */}
                <div className="text-center mb-4">
                  <div 
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold text-white mb-3"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isWechat ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.093 6.093 0 0 1-.305-1.853c0-3.583 3.39-6.504 7.574-6.504.296 0 .582.023.87.05C16.455 4.79 12.919 2.188 8.691 2.188zm-2.56 4.93c.53 0 .96.43.96.962a.96.96 0 0 1-.96.96.961.961 0 0 1 0-1.922zm5.12 0c.53 0 .96.43.96.962a.96.96 0 0 1-.96.96.961.961 0 0 1 0-1.922z"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5.5 2h13A2.5 2.5 0 0 1 21 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-15A2.5 2.5 0 0 1 5.5 2zm.8 11.5V16h1.4v-2.5H5.3zm4.2 0V16h1.4v-2.5H9.5zm-2.1 2.5v-1.4H6v1.4h1.4zm2.8 0v-1.4H8.8v1.4h1.4z"/></svg>
                    )}
                    {brandName}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">扫码支付 ¥{amount}</h3>
                  <p className="text-sm text-gray-500">{productName}</p>
                </div>
                
                {/* 收款码区域 */}
                <div className={`rounded-2xl border-2 p-4 mb-4 ${brandBg}`}>
                  <div className="aspect-square bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={qrImage} 
                      alt={`${brandName}收款码`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `
                          <div class="text-center p-8">
                            <div class="text-4xl mb-2">📱</div>
                            <p class="text-gray-500 text-sm">请管理员上传${brandName}收款码</p>
                            <p class="text-xs text-gray-400 mt-1">路径: /payment/${isWechat ? 'wechat-qr' : 'alipay-qr'}.jpg</p>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-700 text-center">
                    请使用{brandName}扫一扫上方二维码付款<br/>
                    付款完成后点击下方按钮
                  </p>
                </div>
                
                {/* 我已付款按钮 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePaid}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-base shadow-lg"
                  style={{ backgroundColor: brandColor }}
                >
                  我已完成付款
                </motion.button>
              </>
            )}
            
            {paidStep === 'confirm' && (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={32} className="text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">等待管理员确认</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    您已标记付款完成，管理员正在核实<br/>
                    确认后您的会员将自动开通
                  </p>
                  <div className="bg-purple-50 rounded-xl p-3 mb-4 text-left">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MessageSquare size={12} className="text-purple-500" />
                      也可直接联系管理员 <span className="font-bold text-purple-700">13867424423</span> 加快确认
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmPaid}
                    className="w-full py-3 rounded-xl bg-purple-100 text-[#7B2CBF] font-bold text-sm"
                  >
                    我知道了，等待开通
                  </motion.button>
                </div>
              </>
            )}
            
            {paidStep === 'done' && (
              <>
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check size={32} className="text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">提交成功</h3>
                  <p className="text-sm text-gray-500">
                    管理员确认后将自动开通会员<br/>
                    请刷新页面查看状态
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
