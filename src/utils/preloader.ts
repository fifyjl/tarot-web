// 全局图片预加载系统 - 78张塔罗牌面后台加载
import { tarotCards } from '@/data/tarotData';

let loadedCount = 0;
let totalCount = tarotCards.length;
let isPreloading = false;
let preloadPromise: Promise<void> | null = null;

/**
 * 预加载所有塔罗牌图片
 * @param onProgress 进度回调 (loaded, total) => void
 * @returns Promise<void> 加载完成时 resolve
 */
export function preloadAllImages(
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  // 如果已经在预加载中，返回同一个 Promise
  if (preloadPromise !== null) return preloadPromise;

  isPreloading = true;
  preloadPromise = new Promise<void>((resolve) => {
    let loaded = 0;
    const total = tarotCards.length;

    // 过滤掉没有图片 URL 的牌
    const cardsWithImage = tarotCards.filter((card) => card.imageUrl);

    if (cardsWithImage.length === 0) {
      resolve();
      return;
    }

    const markDone = () => {
      loaded++;
      loadedCount = loaded;
      if (onProgress) onProgress(loaded, total);
      if (loaded >= cardsWithImage.length) resolve();
    };

    cardsWithImage.forEach((card) => {
      const img = new Image();
      img.onload = markDone;
      img.onerror = markDone;
      img.src = card.imageUrl || '';
    });

    // Fallback: 即使图片未全部加载，最多等待 15 秒后 resolve
    setTimeout(() => resolve(), 15000);
  }).finally(() => {
    isPreloading = false;
  });

  return preloadPromise;
}

/**
 * 获取当前预加载进度
 */
export function getPreloadProgress(): { loaded: number; total: number; percentage: number } {
  return {
    loaded: loadedCount,
    total: totalCount,
    percentage: totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0,
  };
}

/**
 * 检查是否正在预加载
 */
export function isPreloadingActive(): boolean {
  return isPreloading;
}

/**
 * 预加载单张图片（用于特定场景）
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
