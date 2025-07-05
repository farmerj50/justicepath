
const WaterAnimation = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="relative w-full h-full">
        {/* First ripple */}
        <div className="absolute left-1/2 top-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-white/20 rounded-full animate-ripple"></div>
        {/* Second ripple */}
        <div className="absolute left-1/2 top-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-white/20 rounded-full animate-ripple delay-[300ms]"></div>
        {/* Third ripple */}
        <div className="absolute left-1/2 top-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 bg-white/20 rounded-full animate-ripple delay-[600ms]"></div>
      </div>
    </div>
  );
};

export default WaterAnimation;
