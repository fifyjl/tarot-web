import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { TarotCard as TarotCardData } from '@/data/tarotData';
import CardSkeleton from './CardSkeleton';

interface TarotCardProps {
  card: TarotCardData & { isReversed?: boolean };
  isReversed?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
  className?: string;
  positionName?: string;
  index?: number;
}

const SIZE_MAP = {
  xs: 'w-16 h-24',
  sm: 'w-24 h-36',
  md: 'w-40 h-60',
  lg: 'w-52 h-80',
};

export const TarotCard: React.FC<TarotCardProps> = ({
  card,
  isReversed: propReversed,
  size = 'md',
  showName = true,
  onClick,
  className = '',
  positionName,
  index = 0,
}) => {
  const sizeClass = SIZE_MAP[size];
  const reversed = propReversed ?? card.isReversed ?? false;
  const [imgFailed, setImgFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className={`relative inline-block ${sizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      {/* 主容器 */}
      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg bg-white border border-purple-200">
        
        {/* 图片区域 - 关键修复：固定宽高比 */}
        <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
          {/* 骨架屏：图片未加载且未失败时显示 */}
          {!isLoaded && !imgFailed && <CardSkeleton className="absolute inset-0 w-full h-full z-10" />}
          
          {!imgFailed && card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className={`w-full h-full object-cover ${reversed ? 'rotate-180' : ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setImgFailed(true)}
            />
          ) : (
            /* 图片加载失败回退 */
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center p-2">
              <span className="text-2xl mb-1">{getSuitEmoji(card.suit)}</span>
              <span className="text-xs text-purple-600 font-bold text-center leading-tight">{card.name}</span>
            </div>
          )}
          
          {/* 正逆位标签 */}
          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold z-10
            ${reversed ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {reversed ? '逆' : '正'}
          </div>
        </div>

        {/* 文字区域 */}
        {showName && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-2 py-1.5 text-center">
            <p className="text-xs font-bold text-gray-800 truncate">{card.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{card.englishName}</p>
            {positionName && (
              <p className="text-[9px] text-purple-500 truncate">{positionName}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

function getSuitEmoji(suit: string): string {
  const map: Record<string, string> = {
    wands: '🔥', cups: '🌊', swords: '⚔️', pentacles: '🪙', major: '✨'
  };
  return map[suit] || '✨';
}

export default TarotCard;
