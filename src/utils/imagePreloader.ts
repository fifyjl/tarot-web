import { tarotCards } from '@/data/tarotData';

const PRELOAD_BATCH = 10; // 每批预加载数量
let preloadedUrls = new Set<string>();

/**
 * 预加载单张图片
 */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (preloadedUrls.has(url)) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => {
      preloadedUrls.add(url);
      resolve();
    };
    img.onerror = () => resolve(); // 失败也不阻塞
    img.src = url;
  });
}

/**
 * 分批预加载所有牌面图片
 * 优先加载前 N 张，其余后台加载
 */
export async function preloadCardImages(priorityCount = 10): Promise<void> {
  const urls = tarotCards.map(c => c.imageUrl).filter(Boolean) as string[];
  
  // 先加载优先级高的
  const priorityUrls = urls.slice(0, priorityCount);
  await Promise.all(priorityUrls.map(preloadImage));
  
  // 其余后台加载
  const remainingUrls = urls.slice(priorityCount);
  remainingUrls.forEach((url) => {
    preloadImage(url);
  });
}

/**
 * 预加载特定几张牌的图片
 */
export async function preloadSpecificCards(cardIds: number[]): Promise<void> {
  const urls = tarotCards
    .filter(c => cardIds.includes(c.id))
    .map(c => c.imageUrl)
    .filter(Boolean) as string[];
  await Promise.all(urls.map(preloadImage));
}
