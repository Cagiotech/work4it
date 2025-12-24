export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main gradient background - usando cores da marca */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,20%,15%)] to-[hsl(220,25%,8%)]" />
      
      {/* Glow effects com cor primária (lime) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[hsl(66,85%,50%)]/15 rounded-full blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[hsl(142,70%,45%)]/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[hsl(66,85%,50%)]/8 rounded-full blur-[120px] animate-blob [animation-delay:3s]" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Curved decorative lines */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path
          d="M-100,400 Q400,100 800,350 T1600,250 T2200,400"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M-100,600 Q300,300 700,500 T1400,350 T2000,550"
          fill="none"
          stroke="url(#gradient2)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M2000,200 Q1500,500 1000,300 T200,450 T-100,300"
          fill="none"
          stroke="url(#gradient3)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(66 85% 50%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(142 70% 45%)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142 70% 45%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(66 85% 50%)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(66 85% 50%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(172 70% 45%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
