/**
 * VIP会员中心页面
 * 展示会员权益、定价、支持微信支付/支付宝支付
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Check, ArrowLeft, Star, Shield, Zap } from 'lucide-react';
import { getCurrentUser } from '@/utils/userAuth';
import { getVipStatus, type VipStatus, PRICING } from '@/utils/vip';
import PaymentQrModal from '@/components/PaymentQrModal';

const monthlyFeatures = [
  '每天无限次塔罗占卜',
  '全部5种牌阵免费使用',
  'AI深度详细解读',
  '无限追问深入功能',
  '历史记录永久保存',
];

const yearlyFeatures = [
  ...monthlyFeatures,
  '年度运势深度报告',
  '优先客服支持',
  '纯净无广告体验',
  '专属天命徽标',
];

type ProductType = 'monthly' | 'yearly';

interface PayOption {
  type: ProductType;
  name: string;
  price: number;
  period: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  features: string[];
  icon: typeof Sparkles;
  shadowColor: string;
}

const payOptions: PayOption[] = [
  {
    type: 'monthly',
    name: '月影会员',
    price: PRICING.monthlyVip,
    period: '/月',
    color: 'text-[#7B2CBF]',
    bgGradient: 'from-[#7B2CBF] to-[#9d4edd]',
    borderColor: 'border-[#7B2CBF]',
    features: monthlyFeatures,
    icon: Sparkles,
    shadowColor: 'shadow-purple-200/50',
  },
  {
    type: 'yearly',
    name: '天命会员',
    price: PRICING.yearlyVip,
    period: '/年',
    color: 'text-amber-600',
    bgGradient: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-400',
    features: yearlyFeatures,
    icon: Crown,
    shadowColor: 'shadow-amber-200/50',
  },
];

export default function VipCenter() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [vip, setVip] = useState<VipStatus | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<PayOption | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay' | null>(null);
  
  useEffect(() => {
    setVip(getVipStatus());
  }, []);
  
  const isAdmin = user?.isAdmin;
  
  const handleSelectPay = (product: PayOption, method: 'wechat' | 'alipay') => {
    setSelectedProduct(product);
    setPayMethod(method);
    setShowQrModal(true);
  };
  
  const handlePaid = () => {
    // TODO: 创建待确认订单到Supabase
    console.log('用户标记已付款:', selectedProduct?.name, payMethod);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0e6ff] via-[#ffe6f0] to-[#f8e0ff]">
        <div className="max-w-md mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#7B2CBF] text-center mb-8">会员中心</h1>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-purple-100 text-center">
            <p className="text-gray-600 mb-4">请先登录后查看会员信息</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-[#7B2CBF] to-[#9d4edd] text-white rounded-xl px-8 py-3 font-bold shadow-lg"
            >
              去登录
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0e6ff] via-[#ffe6f0] to-[#f8e0ff]">
      {/* 返回按钮 */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-md border-b border-purple-200/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-[#7B2CBF] font-bold text-sm">
            <ArrowLeft size={18} />
            返回
          </button>
          <h1 className="absolute inset-0 flex items-center justify-center pointer-events-none text-lg font-bold text-[#7B2CBF]">
            会员中心
          </h1>
        </div>
      </div>
      
      <div className="max-w-lg mx-auto px-4 pt-20 pb-8">
        {/* 当前状态 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6 text-center border border-purple-100"
          style={{
            background: isAdmin 
              ? 'linear-gradient(135deg, #7B2CBF, #9d4edd)'
              : vip?.isVip 
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)'
          }}
        >
          {isAdmin ? (
            <>
              <Shield size={40} className="mx-auto text-white mb-2" />
              <h2 className="text-2xl font-bold text-white">管理员账号</h2>
              <p className="text-white/80 text-sm mt-1">永久免费使用全部功能</p>
            </>
          ) : vip?.isVip ? (
            <>
              <Crown size={40} className="mx-auto text-white mb-2" />
              <h2 className="text-2xl font-bold text-white">
                {vip.tier === 'yearly' ? '天命会员' : '月影会员'}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                有效期至 {vip.vipExpireAt ? new Date(vip.vipExpireAt).toLocaleDateString('zh-CN') : '无限'}
              </p>
            </>
          ) : (
            <>
              <Star size={40} className="mx-auto text-gray-400 mb-2" />
              <h2 className="text-2xl font-bold text-gray-700">免费用户</h2>
              <p className="text-gray-500 text-sm mt-1">每天1次免费测算机会</p>
            </>
          )}
        </motion.div>
        
        {/* 管理员不需要看付费选项 */}
        {!isAdmin && !vip?.isVip && (
          <>
            {payOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className={`rounded-2xl border-2 ${option.borderColor} bg-white/80 p-5 mb-4 shadow-lg ${option.shadowColor}`}
                >
                  {/* 头部信息 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${option.bgGradient} shadow-lg`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${option.color}`}>{option.name}</h3>
                      <p className="text-sm text-gray-500">{option.type === 'monthly' ? '30天无限次测算' : '365天无限次 + 专属特权'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-3xl font-bold ${option.color}`}>¥{option.price}</span>
                    </div>
                  </div>
                  
                  {/* 权益列表 */}
                  <div className="space-y-2 mb-5">
                    {option.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Check size={16} className={option.type === 'monthly' ? 'text-emerald-500 shrink-0' : 'text-amber-500 shrink-0'} />
                        <span className="text-sm text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* 支付方式选择 */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 微信支付 */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPay(option, 'wechat')}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-bold text-sm hover:bg-green-100 transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.093 6.093 0 0 1-.305-1.853c0-3.583 3.39-6.504 7.574-6.504.296 0 .582.023.87.05C16.455 4.79 12.919 2.188 8.691 2.188zm-2.56 4.93c.53 0 .96.43.96.962a.96.96 0 0 1-.96.96.961.961 0 0 1 0-1.922zm5.12 0c.53 0 .96.43.96.962a.96.96 0 0 1-.96.96.961.961 0 0 1 0-1.922z"/></svg>
                      微信支付
                    </motion.button>
                    
                    {/* 支付宝支付 */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPay(option, 'alipay')}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold text-sm hover:bg-blue-100 transition"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5.5 2h13A2.5 2.5 0 0 1 21 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-15A2.5 2.5 0 0 1 5.5 2z"/></svg>
                      支付宝
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
            
            {/* 免费提示 */}
            <div className="mt-4 rounded-2xl bg-white/60 p-4 border border-purple-100 text-center">
              <p className="text-sm text-gray-500">
                每天0点自动重置1次免费机会<br/>
                免费用户也可享受完整详细解读
              </p>
            </div>
          </>
        )}
        
        {/* 已是VIP的提示 */}
        {!isAdmin && vip?.isVip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center"
          >
            <Check size={40} className="mx-auto text-emerald-500 mb-2" />
            <h3 className="text-lg font-bold text-emerald-700">您已是会员</h3>
            <p className="text-sm text-emerald-600 mt-1">享受无限次测算权益中</p>
          </motion.div>
        )}
      </div>
      
      {/* 收款码弹窗 */}
      <PaymentQrModal
        isOpen={showQrModal}
        onClose={() => { setShowQrModal(false); setPayMethod(null); }}
        payMethod={payMethod}
        productName={selectedProduct?.name || ''}
        amount={selectedProduct?.price || 0}
        onPaid={handlePaid}
      />
    </div>
  );
}
