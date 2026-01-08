
import React, { useState, useEffect } from 'react';

const ThreeDVisual: React.FC = () => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Reduced the intensity for a more subtle, premium feel
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * -15;
      setRotate({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="perspective-container relative w-full h-[350px] md:h-[500px] flex items-center justify-center pointer-events-none lg:translate-x-10">
      <div 
        className="scene-3d w-60 h-60 md:w-80 md:h-80 float-anim"
        style={{ transform: `rotateY(${rotate.x}deg) rotateX(${rotate.y}deg)` }}
      >
        {/* The Core Cube */}
        <div className="cube-3d absolute inset-0 m-auto w-24 h-24 md:w-40 md:h-40">
          <div className="cube-face" style={{ transform: 'translateZ(80px)' }}></div>
          <div className="cube-face" style={{ transform: 'translateZ(-80px) rotateY(180deg)' }}></div>
          <div className="cube-face" style={{ transform: 'translateX(80px) rotateY(90deg)' }}></div>
          <div className="cube-face" style={{ transform: 'translateX(-80px) rotateY(-90deg)' }}></div>
          <div className="cube-face" style={{ transform: 'translateY(80px) rotateX(-90deg)' }}></div>
          <div className="cube-face" style={{ transform: 'translateY(-80px) rotateX(90deg)' }}></div>
          
          {/* Inner Light Core */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-16 h-16 bg-orange-600/40 blur-2xl animate-pulse rounded-full"></div>
             <div className="w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_20px_orange]"></div>
          </div>
        </div>

        {/* Orbiting Glass Rings */}
        <div className="ring-3d absolute inset-[-40%] border border-orange-500/10 rounded-full glass"></div>
        <div className="ring-3d absolute inset-[-20%] border border-amber-500/10 rounded-full glass" style={{ animationDelay: '-5s', animationDuration: '25s' }}></div>
        <div className="ring-3d absolute inset-[0%] border border-white/5 rounded-full glass" style={{ animationDelay: '-10s', animationDuration: '12s' }}></div>
        
        {/* Floating Data Nodes */}
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full shadow-[0_0_10px_orange] ring-3d" style={{ transformOrigin: '0 120px' }}></div>
        <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-amber-300 rounded-full shadow-[0_0_10px_amber] ring-3d" style={{ transformOrigin: '120px 0', animationDelay: '-2s' }}></div>
      </div>

      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-orange-600/10 blur-[100px] rounded-full -z-10 opacity-50"></div>
    </div>
  );
};

export default ThreeDVisual;
