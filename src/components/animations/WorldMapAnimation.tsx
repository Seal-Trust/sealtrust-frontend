'use client';

import Lottie from 'lottie-react';
import worldMapAnimation from '../../../public/Worldmap.json';

export function WorldMapAnimation() {
  return (
    <div className="w-full max-w-lg mx-auto opacity-50">
      <Lottie
        animationData={worldMapAnimation}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}