import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600" />
      
      {/* Animated blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/40 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-teal-400/30 rounded-full blur-3xl animate-blob [animation-delay:2s]" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl animate-blob [animation-delay:4s]" />
      
      {/* Curved decorative lines */}
      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path
          d="M-100,400 Q400,100 800,350 T1600,250 T2200,400"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="50"
          strokeLinecap="round"
        />
        <path
          d="M-100,600 Q300,300 700,500 T1400,350 T2000,550"
          fill="none"
          stroke="url(#gradient2)"
          strokeWidth="40"
          strokeLinecap="round"
        />
        <path
          d="M2000,200 Q1500,500 1000,300 T200,450 T-100,300"
          fill="none"
          stroke="url(#gradient3)"
          strokeWidth="35"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
