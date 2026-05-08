import { motion } from 'framer-motion';

interface CardSkeletonProps {
  className?: string;
}

export default function CardSkeleton({ className = '' }: CardSkeletonProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100/60 to-pink-100/60 ${className}`}>
      {/* 骨架屏动画 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 占位符图案 */}
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-full bg-purple-200/50 animate-pulse" />
        <div className="h-3 w-20 rounded-full bg-purple-200/50 animate-pulse" />
        <div className="h-2 w-14 rounded-full bg-purple-200/30 animate-pulse" />
      </div>
    </div>
  );
}
