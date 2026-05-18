/**
 * 用户认证系统 - 用户名+密码
 * 使用 Supabase REST API 实现云端持久化
 * 保留 localStorage 作为会话缓存和离线后备
 */

import { supabaseFetch, isSupabaseAvailable } from './supabaseClient';
import { syncVipFromCloud } from './vip';

export interface User {
  id: string;
  username: string;
  password: string; // 简单哈希存储
  createdAt: number;
  lastLogin: number;
  isAdmin: boolean;
}

const CURRENT_USER_KEY = 'yuyu_current_user';
const USERS_CACHE_KEY = 'yuyu_users_cache'; // 离线后备

// 简单哈希（与之前版本兼容）
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// ====== 离线后备：localStorage ======

function getCachedUsers(): Record<string, User> {
  const data = localStorage.getItem(USERS_CACHE_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function cacheUsers(users: Record<string, User>): void {
  localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
}

function cacheCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// ====== Supabase API 调用 ======

interface SupabaseUser {
  id: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
  created_at: string;
  last_login: string;
}

async function fetchUserByUsername(username: string): Promise<SupabaseUser | null> {
  const users = await supabaseFetch<SupabaseUser[]>(
    `/users?username=eq.${encodeURIComponent(username)}&limit=1`
  );
  return users && users.length > 0 ? users[0] : null;
}

function toLocalUser(su: SupabaseUser): User {
  return {
    id: su.id,
    username: su.username,
    password: su.password_hash,
    createdAt: new Date(su.created_at).getTime(),
    lastLogin: new Date(su.last_login).getTime(),
    isAdmin: su.is_admin,
  };
}

// ====== 公共接口 ======

/**
 * 验证手机号格式
 */
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 生成注册验证码（数学题）
 */
export function generateVerifyCode(): { question: string; answer: string } {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return {
    question: `${a} + ${b} = ?`,
    answer: String(a + b),
  };
}

/**
 * 校验验证码
 */
export function checkVerifyCode(input: string, expected: string): boolean {
  return input.trim() === expected;
}

/**
 * 注册新用户
 */
export async function register(
  username: string,
  password: string,
  confirmPassword: string,
  verifyCodeInput: string,
  expectedCode: string
): Promise<{ success: boolean; message: string }> {
  const trimmedUsername = username.trim();

  // 校验验证码
  if (!verifyCodeInput || !checkVerifyCode(verifyCodeInput, expectedCode)) {
    return { success: false, message: '验证码错误，请重新计算' };
  }

  // 必须是手机号格式
  if (!isValidPhone(trimmedUsername)) {
    return { success: false, message: '请输入正确的11位手机号' };
  }
  if (!password || password.length < 6) {
    return { success: false, message: '密码至少6个字符' };
  }
  if (password !== confirmPassword) {
    return { success: false, message: '两次密码不一致' };
  }

  // 检查是否在线
  const online = await isSupabaseAvailable();

  if (online) {
    // 检查用户名是否已存在
    const existing = await fetchUserByUsername(trimmedUsername);
    if (existing) {
      return { success: false, message: '用户名已存在' };
    }

    // 插入新用户
    const passwordHash = simpleHash(password);
    const newUsers = await supabaseFetch<SupabaseUser[]>('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: trimmedUsername,
        password_hash: passwordHash,
        is_admin: false,
      }),
    });

    if (!newUsers || newUsers.length === 0) {
      return { success: false, message: '注册失败，请稍后重试' };
    }

    const user = toLocalUser(newUsers[0]);
    cacheCurrentUser(user);

    // 更新本地缓存
    const cache = getCachedUsers();
    cache[trimmedUsername] = user;
    cacheUsers(cache);

    return { success: true, message: '注册成功' };
  } else {
    // 离线模式：使用 localStorage
    const cache = getCachedUsers();
    if (cache[trimmedUsername]) {
      return { success: false, message: '用户名已存在（离线模式）' };
    }

    const user: User = {
      id: `local_${Date.now()}`,
      username: trimmedUsername,
      password: simpleHash(password),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isAdmin: false,
    };

    cache[trimmedUsername] = user;
    cacheUsers(cache);
    cacheCurrentUser(user);

    return { success: true, message: '注册成功（离线模式）' };
  }
}

/**
 * 登录
 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  if (!username || !password) {
    return { success: false, message: '请输入用户名和密码' };
  }

  const trimmedUsername = username.trim();
  const passwordHash = simpleHash(password);

  const online = await isSupabaseAvailable();

  if (online) {
    const supaUser = await fetchUserByUsername(trimmedUsername);

    if (!supaUser) {
      return { success: false, message: '用户名不存在' };
    }

    if (supaUser.password_hash !== passwordHash) {
      return { success: false, message: '密码错误' };
    }

    // 更新最后登录时间
    await supabaseFetch(`/users?id=eq.${supaUser.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_login: new Date().toISOString() }),
    });

    const user = toLocalUser(supaUser);

    // 13867424423 登录自动设为管理员
    if (user.username === '13867424423') {
      user.isAdmin = true;
      // 同步更新云端
      await supabaseFetch(`/users?id=eq.${supaUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_admin: true }),
      });
    }

    // 同步VIP状态
    try {
      await syncVipFromCloud();
    } catch {
      // 静默失败
    }

    user.lastLogin = Date.now();
    cacheCurrentUser(user);

    return { success: true, message: '登录成功', user };
  } else {
    // 离线模式
    const cache = getCachedUsers();
    const user = cache[trimmedUsername];

    if (!user) {
      return { success: false, message: '用户名不存在（离线模式）' };
    }

    if (user.password !== passwordHash) {
      return { success: false, message: '密码错误' };
    }

    user.lastLogin = Date.now();
    cache[trimmedUsername] = user;
    cacheUsers(cache);
    cacheCurrentUser(user);

    return { success: true, message: '登录成功（离线模式）', user };
  }
}

/**
 * 退出登录
 */
export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * 获取当前用户（同步，优先缓存）
 */
export function getCurrentUser(): User | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}

/**
 * 获取用户专属 storage key（保持向后兼容）
 */
export function getUserStorageKey(base: string): string {
  const user = getCurrentUser();
  if (!user) return 'guest_' + base;
  return `yuyu_${user.username}_${base}`;
}

/**
 * 获取所有用户（仅管理员）
 */
export async function getAllUsers(): Promise<User[]> {
  const online = await isSupabaseAvailable();

  if (online) {
    const users = await supabaseFetch<SupabaseUser[]>('/users?select=*');
    return (users || []).map(toLocalUser);
  } else {
    return Object.values(getCachedUsers());
  }
}

/**
 * 初始化管理员账号
 */
export async function initAdmin(): Promise<void> {
  const online = await isSupabaseAvailable();

  if (online) {
    // 创建默认管理员 admin
    const existingAdmin = await fetchUserByUsername('admin');
    if (!existingAdmin) {
      await supabaseFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          password_hash: simpleHash('admin123'),
          is_admin: true,
        }),
      });
    }

    // 13867424423 已存在，只更新管理员权限（不修改密码）
    const owner = await fetchUserByUsername('13867424423');
    if (owner) {
      await supabaseFetch(`/users?id=eq.${owner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_admin: true }),
      });
    }
  } else {
    const cache = getCachedUsers();
    if (!cache['admin']) {
      cache['admin'] = {
        id: `local_${Date.now()}`,
        username: 'admin',
        password: simpleHash('admin123'),
        createdAt: Date.now(),
        lastLogin: Date.now(),
        isAdmin: true,
      };
    }
    cacheUsers(cache);
  }
}
