/**
 * Supabase REST API 客户端配置
 * 
 * 项目地址: https://jyhzyqsqapqohraufiil.supabase.co
 * 
 * 如何获取 ANON_KEY:
 * 1. 登录 Supabase Dashboard
 * 2. 进入 Project Settings → API
 * 3. 复制 "anon public" key
 * 4. 替换下面的 SUPABASE_ANON_KEY
 */

const SUPABASE_URL = 'https://jyhzyqsqapqohraufiil.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ykrMErEXjQem2Y6Kku23Rg_K-q_wBE1';

export const REST_ENDPOINT = `${SUPABASE_URL}/rest/v1`;

export const DEFAULT_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
  'x-client-info': 'supabase-js/2.x',
};

/**
 * 通用 REST 请求封装
 */
export async function supabaseFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const response = await fetch(`${REST_ENDPOINT}${path}`, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', path, response.status, errorText);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    }
    return null;
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
}

/**
 * 检查 Supabase 连接是否可用
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${REST_ENDPOINT}/users?select=id&limit=1`, {
      headers: DEFAULT_HEADERS,
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}
