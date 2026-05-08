/**
 * VIP收费系统 - 核心逻辑
 * 
 * 免费规则：
 * - 每人每天1次免费测算机会（每天0点重置）
 * - 每日运势也是1次免费
 * - 免费用户享受完整详细解读
 * 
 * 付费规则：
 * - 单牌阵：¥1/次
 * - 复杂牌阵（三牌及以上）：¥2/次
 * - 月卡：¥19.9/月，无限次
 * - 年卡：¥168/年，无限次
 * - 管理员：永久免费
 */

import { getCurrentUser } from './userAuth';
import { supabaseFetch } from './supabaseClient';

export type VipTier = 'free' | 'monthly' | 'yearly';

export interface VipStatus {
  tier: VipTier;
  isVip: boolean;
  isAdmin: boolean;
  vipExpireAt: string | null;
  balance: number;
  dailyFreeUsed: number;
  dailyFreeResetDate: string;
  freeRemaining: number; // 今天还剩几次免费
  isUnlimited: boolean;  // 是否无限次（VIP或管理员）
}

export interface Pricing {
  singleReading: number;   // 单牌阵
  complexReading: number;  // 复杂牌阵
  monthlyVip: number;      // 月卡
  yearlyVip: number;       // 年卡
}

// 定价配置
export const PRICING: Pricing = {
  singleReading: 1.0,     // 单牌阵 1元
  complexReading: 2.0,    // 复杂牌阵 2元
  monthlyVip: 19.9,       // 月卡 19.9
  yearlyVip: 168.0,       // 年卡 168
};

// 阵法复杂度分类
export function getReadingCost(spreadName: string, cardCount: number): number {
  // 管理员/VIP免费
  const user = getCurrentUser();
  if (user?.isAdmin) return 0;
  
  // 单牌阵
  if (cardCount <= 1 || spreadName.includes('单牌')) return PRICING.singleReading;
  // 复杂牌阵
  return PRICING.complexReading;
}

/**
 * 获取VIP状态（本地计算，不依赖云端）
 */
export function getVipStatus(): VipStatus {
  const user = getCurrentUser();
  const today = new Date().toISOString().split('T')[0];
  
  // 未登录 = 游客，只有1次免费
  if (!user) {
    return {
      tier: 'free',
      isVip: false,
      isAdmin: false,
      vipExpireAt: null,
      balance: 0,
      dailyFreeUsed: 0,
      dailyFreeResetDate: today,
      freeRemaining: 1,
      isUnlimited: false,
    };
  }
  
  // 管理员永久免费
  if (user.isAdmin) {
    return {
      tier: 'yearly',
      isVip: true,
      isAdmin: true,
      vipExpireAt: '2099-12-31',
      balance: 9999,
      dailyFreeUsed: 0,
      dailyFreeResetDate: today,
      freeRemaining: 9999,
      isUnlimited: true,
    };
  }
  
  // 从 localStorage 读取VIP缓存
  const vipCache = getVipCache(user.id || user.username);
  const isVipActive: boolean = vipCache.tier !== 'free' && 
    !!vipCache.vip_expire_at && 
    new Date(vipCache.vip_expire_at) > new Date();
  
  // 检查每日免费次数是否已重置
  let freeUsed = vipCache.daily_free_used || 0;
  let resetDate = vipCache.daily_free_reset_date || today;
  if (resetDate !== today) {
    freeUsed = 0;
    resetDate = today;
  }
  
  const freeRemaining = isVipActive ? 9999 : Math.max(0, 1 - freeUsed);
  
  return {
    tier: isVipActive ? (vipCache.tier as VipTier) : 'free',
    isVip: isVipActive,
    isAdmin: false,
    vipExpireAt: vipCache.vip_expire_at || null,
    balance: vipCache.balance || 0,
    dailyFreeUsed: freeUsed,
    dailyFreeResetDate: resetDate,
    freeRemaining,
    isUnlimited: isVipActive,
  };
}

/**
 * 检查是否可以进行测算
 */
export function canRead(): { allowed: boolean; reason?: string; cost?: number } {
  const status = getVipStatus();
  
  // 管理员或VIP无限次
  if (status.isUnlimited) {
    return { allowed: true, cost: 0 };
  }
  
  // 检查免费次数
  if (status.freeRemaining > 0) {
    return { allowed: true, cost: 0 };
  }
  
  // 检查余额是否足够
  const cost = PRICING.singleReading; // 默认检查单牌阵价格
  if (status.balance >= cost) {
    return { allowed: true, cost };
  }
  
  return { 
    allowed: false, 
    reason: '今日免费次数已用完，余额不足。请充值或开通会员。',
    cost 
  };
}

/**
 * 使用一次测算机会（扣免费次数或余额）
 */
export async function useReading(spreadName: string, cardCount: number): Promise<{ success: boolean; message: string }> {
  const status = getVipStatus();
  const user = getCurrentUser();
  
  // 管理员/VIP直接通过
  if (status.isUnlimited) {
    return { success: true, message: 'VIP无限次' };
  }
  
  // 使用免费次数
  if (status.freeRemaining > 0) {
    // 更新本地缓存
    if (user) {
      updateFreeUsed(user.id || user.username);
    }
    // 异步同步到云端
    syncFreeUsage(user?.id || '');
    return { success: true, message: '使用免费次数' };
  }
  
  // 扣除余额
  const cost = getReadingCost(spreadName, cardCount);
  if (status.balance >= cost) {
    // 更新本地缓存
    if (user) {
      deductBalance(user.id || user.username, cost);
    }
    // 异步同步到云端
    syncBalanceDeduction(user?.id || '', cost, `${spreadName}测算`);
    return { success: true, message: `扣除余额¥${cost}` };
  }
  
  return { success: false, message: '余额不足，请充值或开通会员' };
}

/**
 * 检查每日运势是否可用
 */
export function canDailyFortune(): { allowed: boolean; reason?: string } {
  const status = getVipStatus();
  
  if (status.isUnlimited) return { allowed: true };
  
  // 检查本地缓存是否今天已经用过
  const todayKey = `yuyu_daily_fortune_used_${status.dailyFreeResetDate}`;
  const todayUsed = localStorage.getItem(todayKey);
  if (todayUsed && status.freeRemaining <= 0) {
    return { allowed: false, reason: '今日运势已测算，明天再来吧~ 或开通会员无限次' };
  }
  
  return { allowed: true };
}

/**
 * 标记今日运势已使用
 */
export function markDailyFortuneUsed(): void {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`yuyu_daily_fortune_used_${today}`, '1');
}

// ====== 本地缓存操作 ======

interface VipCache {
  tier: string;
  vip_expire_at: string | null;
  balance: number;
  daily_free_used: number;
  daily_free_reset_date: string;
}

function getVipCacheKey(userId: string): string {
  return `yuyu_vip_${userId}`;
}

function getVipCache(userId: string): VipCache {
  try {
    const data = localStorage.getItem(getVipCacheKey(userId));
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return { tier: 'free', vip_expire_at: null, balance: 0, daily_free_used: 0, daily_free_reset_date: '' };
}

function updateFreeUsed(userId: string): void {
  const cache = getVipCache(userId);
  const today = new Date().toISOString().split('T')[0];
  if (cache.daily_free_reset_date !== today) {
    cache.daily_free_used = 0;
    cache.daily_free_reset_date = today;
  }
  cache.daily_free_used += 1;
  localStorage.setItem(getVipCacheKey(userId), JSON.stringify(cache));
}

function deductBalance(userId: string, amount: number): void {
  const cache = getVipCache(userId);
  cache.balance = Math.max(0, (cache.balance || 0) - amount);
  localStorage.setItem(getVipCacheKey(userId), JSON.stringify(cache));
}

// ====== 云端同步（异步，不阻塞） ======

async function syncFreeUsage(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await supabaseFetch(`/users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        daily_free_used: getVipCache(userId).daily_free_used,
        daily_free_reset_date: new Date().toISOString().split('T')[0],
      }),
    });
  } catch { /* 静默失败 */ }
}

async function syncBalanceDeduction(userId: string, amount: number, desc: string): Promise<void> {
  if (!userId) return;
  try {
    // 更新余额
    await supabaseFetch(`/users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ balance: getVipCache(userId).balance }),
    });
    // 记录消费
    await supabaseFetch('/usage_logs', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, action: 'balance_deduct', cost: amount, description: desc }),
    });
  } catch { /* 静默失败 */ }
}

/**
 * 从云端同步VIP状态到本地
 */
export async function syncVipFromCloud(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const users = await supabaseFetch<Array<{
      vip_tier: string;
      vip_expire_at: string;
      balance: number;
      daily_free_used: number;
      daily_free_reset_date: string;
    }>>(`/users?id=eq.${user.id}&select=vip_tier,vip_expire_at,balance,daily_free_used,daily_free_reset_date`);
    
    if (users && users.length > 0) {
      const u = users[0];
      localStorage.setItem(getVipCacheKey(user.id || user.username), JSON.stringify({
        tier: u.vip_tier || 'free',
        vip_expire_at: u.vip_expire_at,
        balance: u.balance || 0,
        daily_free_used: u.daily_free_used || 0,
        daily_free_reset_date: u.daily_free_reset_date || new Date().toISOString().split('T')[0],
      }));
    }
  } catch { /* 静默失败 */ }
}

/**
 * 登录成功后同步VIP状态
 */
export async function onLoginSync(): Promise<void> {
  await syncVipFromCloud();
}
