/**
 * 历史记录存储系统
 * 使用 Supabase REST API 实现云端持久化
 * 保留 localStorage 作为会话缓存和离线后备
 */

import type { Spread } from '@/data/spreads';
import type { TarotCard } from '@/data/tarotData';
import type { Reading } from '@/utils/interpreter';
import { getCurrentUser } from './userAuth';
import { supabaseFetch, isSupabaseAvailable } from './supabaseClient';

const HISTORY_KEY = 'yuyu_history';
const MAX_HISTORY = 50;

export interface SavedReading {
  id: string;
  timestamp: number;
  question: string;
  spread: Spread;
  cards: (TarotCard & { isReversed: boolean })[];
  reading: Reading;
  followUps?: Array<{
    id: string;
    timestamp: number;
    question: string;
    answer: string;
  }>;
}

interface SupabaseReading {
  id: string;
  user_id: string;
  question: string;
  spread_name: string;
  spread_data: Spread;
  cards_data: (TarotCard & { isReversed: boolean })[];
  reading_data: Reading;
  follow_ups: Array<{ id: string; timestamp: number; question: string; answer: string }>;
  created_at: string;
}

function getUserKey(): string {
  const user = getCurrentUser();
  if (!user) return 'guest_' + HISTORY_KEY;
  return `yuyu_${user.id || user.username}_${HISTORY_KEY}`;
}

function getLocalHistory(): SavedReading[] {
  const key = getUserKey();
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function setLocalHistory(history: SavedReading[]): void {
  const key = getUserKey();
  localStorage.setItem(key, JSON.stringify(history));
}

function toLocalReading(sr: SupabaseReading): SavedReading {
  return {
    id: sr.id,
    timestamp: new Date(sr.created_at).getTime(),
    question: sr.question,
    spread: sr.spread_data,
    cards: sr.cards_data,
    reading: sr.reading_data,
    followUps: sr.follow_ups || [],
  };
}

// ====== 公共接口 ======

/**
 * 保存记录（自动关联当前用户，云端+本地双写）
 */
export async function saveReading(record: SavedReading): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    // 未登录：仅保存到本地
    const history = getLocalHistory();
    history.unshift(record);
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    setLocalHistory(history);
    return;
  }

  const online = await isSupabaseAvailable();

  if (online) {
    // 保存到 Supabase
    await supabaseFetch('/readings', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        question: record.question,
        spread_name: record.spread.name,
        spread_data: record.spread,
        cards_data: record.cards,
        reading_data: record.reading,
        follow_ups: record.followUps || [],
      }),
    });
  }

  // 同时保存到本地缓存（离线后备）
  const history = getLocalHistory();
  history.unshift(record);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  setLocalHistory(history);
}

/**
 * 获取当前用户的记录（云端优先，离线回退）
 */
export async function getHistory(): Promise<SavedReading[]> {
  try {
    const user = getCurrentUser();
    if (!user) {
      return getLocalHistory();
    }

    const online = await isSupabaseAvailable();

    if (online) {
      try {
        const readings = await supabaseFetch<SupabaseReading[]>(
          `/readings?user_id=eq.${user.id}&order=created_at.desc&limit=${MAX_HISTORY}`
        );

        if (readings && readings.length > 0) {
          // 更新本地缓存
          const local = readings.map(toLocalReading);
          setLocalHistory(local);
          return local;
        }
      } catch (cloudErr) {
        console.warn('云端读取失败，回退到本地:', cloudErr);
      }
    }

    // 回退到本地缓存
    return getLocalHistory();
  } catch {
    // 最终降级：返回空数组
    return [];
  }
}

/**
 * 删除单条记录
 */
export async function deleteReading(id: string): Promise<void> {
  const user = getCurrentUser();
  const online = await isSupabaseAvailable();

  if (online && user) {
    await supabaseFetch(`/readings?id=eq.${id}&user_id=eq.${user.id}`, {
      method: 'DELETE',
    });
  }

  // 同时删除本地缓存
  const history = getLocalHistory().filter((h) => h.id !== id);
  setLocalHistory(history);
}

/**
 * 清空记录
 */
export async function clearHistory(): Promise<void> {
  const user = getCurrentUser();
  const online = await isSupabaseAvailable();

  if (online && user) {
    // 获取所有记录ID并逐个删除（Supabase REST API 暂不支持批量条件删除的 CASCADE）
    const readings = await supabaseFetch<Array<{ id: string }>>(
      `/readings?user_id=eq.${user.id}&select=id`
    );
    if (readings && readings.length > 0) {
      for (const r of readings) {
        await supabaseFetch(`/readings?id=eq.${r.id}`, { method: 'DELETE' });
      }
    }
  }

  // 清除本地缓存
  const key = getUserKey();
  localStorage.removeItem(key);
}

/**
 * 获取指定用户的记录（管理员用）
 */
export async function getUserHistory(userId: string): Promise<SavedReading[]> {
  const online = await isSupabaseAvailable();

  if (online) {
    const readings = await supabaseFetch<SupabaseReading[]>(
      `/readings?user_id=eq.${userId}&order=created_at.desc&limit=${MAX_HISTORY}`
    );
    return (readings || []).map(toLocalReading);
  }

  // 离线模式：无法按ID查询，返回空数组
  return [];
}

/**
 * 同步追问到云端记录
 */
export async function appendFollowUp(
  readingId: string,
  followUp: { id: string; timestamp: number; question: string; answer: string }
): Promise<void> {
  const user = getCurrentUser();
  const online = await isSupabaseAvailable();

  // 先更新本地缓存
  const history = getLocalHistory();
  const record = history.find((h) => h.id === readingId);
  if (record) {
    if (!record.followUps) record.followUps = [];
    record.followUps.push(followUp);
    setLocalHistory(history);
  }

  // 再更新云端
  if (online && user) {
    // 获取当前 follow_ups
    const existing = await supabaseFetch<SupabaseReading[]>(
      `/readings?id=eq.${readingId}&user_id=eq.${user.id}&select=follow_ups`
    );
    if (existing && existing.length > 0) {
      const current = existing[0].follow_ups || [];
      current.push(followUp);
      await supabaseFetch(`/readings?id=eq.${readingId}&user_id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ follow_ups: current }),
      });
    }
  }
}

// ====== 每日运势缓存 ======

const DAILY_FORTUNE_KEY = 'yuyu_daily_fortune';

interface DailyFortuneCache {
  date: string; // '2024-01-15' 格式
  cardId: number;
  isReversed: boolean;
}

/**
 * 保存每日运势到云端（登录用户）+ 本地缓存
 */
export async function saveDailyFortuneCache(cardId: number, isReversed: boolean): Promise<void> {
  const cache: DailyFortuneCache = {
    date: new Date().toISOString().split('T')[0],
    cardId,
    isReversed,
  };
  // 本地缓存
  localStorage.setItem(DAILY_FORTUNE_KEY, JSON.stringify(cache));

  // 云端同步（如果已登录）
  const user = getCurrentUser();
  if (user) {
    // 先清理旧记录，避免累积
    await clearOldDailyFortunes();
    // 保存到 readings 表，question 为 "__DAILY_FORTUNE__"
    await supabaseFetch('/readings', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        question: '__DAILY_FORTUNE__',
        spread_name: cache.date,
        spread_data: { id: 'daily', cardId, isReversed, date: cache.date },
        cards_data: [{ cardId, isReversed }],
        reading_data: {},
        follow_ups: [],
      }),
    });
  }
}

/**
 * 获取今日运势缓存（云端优先）
 */
export async function getDailyFortuneCache(): Promise<{ cardId: number; isReversed: boolean } | null> {
  const today = new Date().toISOString().split('T')[0];

  // 先查云端（如果已登录）
  const user = getCurrentUser();
  if (user) {
    const readings = await supabaseFetch<Array<{
      spread_data: { cardId: number; isReversed: boolean; date: string };
    }>>(
      `/readings?user_id=eq.${user.id}&question=eq.__DAILY_FORTUNE__&spread_name=eq.${today}&select=spread_data`
    );
    if (readings && readings.length > 0) {
      const sd = readings[0].spread_data;
      return { cardId: sd.cardId, isReversed: sd.isReversed };
    }
  }

  // 回退到本地缓存
  try {
    const data = localStorage.getItem(DAILY_FORTUNE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as DailyFortuneCache;
    if (parsed.date === today) return { cardId: parsed.cardId, isReversed: parsed.isReversed };
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取今日运势的所有云端记录（用于清理旧记录）
 */
export async function clearOldDailyFortunes(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  const readings = await supabaseFetch<Array<{ id: string }>>(
    `/readings?user_id=eq.${user.id}&question=eq.__DAILY_FORTUNE__&select=id`
  );
  if (readings) {
    for (const r of readings) {
      await supabaseFetch(`/readings?id=eq.${r.id}`, { method: 'DELETE' });
    }
  }
}

// ====== 用户反馈 ======

export interface UserFeedback {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

/**
 * 提交用户反馈（无需登录，匿名提交）
 */
export async function submitFeedback(username: string, content: string): Promise<{ success: boolean; message: string }> {
  if (!content || content.trim().length < 5) {
    return { success: false, message: '反馈内容至少5个字符' };
  }

  const trimmedContent = content.trim();
  const displayName = username?.trim() || '匿名用户';

  const online = await isSupabaseAvailable();

  if (online) {
    // 尝试通过 Supabase REST API 插入
    const result = await supabaseFetch<Array<{ id: string }>>('/feedbacks', {
      method: 'POST',
      body: JSON.stringify({
        username: displayName,
        content: trimmedContent,
      }),
    });

    if (result) {
      return { success: true, message: '反馈提交成功，感谢你的建议！' };
    } else {
      // 云端失败，保存到本地
      saveLocalFeedback(displayName, trimmedContent);
      return { success: true, message: '反馈已保存（离线模式）' };
    }
  } else {
    // 离线模式
    saveLocalFeedback(displayName, trimmedContent);
    return { success: true, message: '反馈已保存（离线模式）' };
  }
}

const FEEDBACK_LOCAL_KEY = 'yuyu_feedback_local';

function saveLocalFeedback(username: string, content: string): void {
  const list = getLocalFeedbacks();
  list.unshift({
    id: `local_${Date.now()}`,
    username,
    content,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem(FEEDBACK_LOCAL_KEY, JSON.stringify(list.slice(0, 100)));
}

function getLocalFeedbacks(): UserFeedback[] {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * 获取所有反馈（管理员用）
 */
export async function getAllFeedbacks(): Promise<UserFeedback[]> {
  const online = await isSupabaseAvailable();

  if (online) {
    const feedbacks = await supabaseFetch<UserFeedback[]>(
      '/feedbacks?select=*&order=created_at.desc&limit=200'
    );
    if (feedbacks && feedbacks.length > 0) {
      return feedbacks;
    }
  }

  // 回退到本地
  return getLocalFeedbacks();
}
