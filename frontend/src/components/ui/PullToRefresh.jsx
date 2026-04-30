import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

const PullToRefresh = ({ children }) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const threshold = 80;

  useEffect(() => {
    // Only add touch listeners if we are not currently refreshing
    if (refreshing) return;

    const handleTouchStart = (e) => {
      // Don't pull if we're not at the top or if a sidebar/modal is open (overflow hidden)
      if (window.scrollY === 0 && document.body.style.overflow !== 'hidden') {
        startY.current = e.touches[0].clientY;
        setPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling || window.scrollY > 0) return;
      
      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // Only pull down
      if (distance > 0) {
        // Add resistance/friction to the pull
        const resistedDistance = distance * 0.4;
        setPullDistance(Math.min(resistedDistance, threshold + 20));
        
        // Prevent default browser behavior like native pull-to-refresh if possible
        // Note: in modern browsers this requires touch-action: pan-x pan-y or non-passive listeners
        // but we just apply the visual effect
      }
    };

    const handleTouchEnd = () => {
      if (!pulling) return;

      if (pullDistance >= threshold) {
        setRefreshing(true);
        // Add slight delay for animation before refreshing
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

      setPulling(false);
      if (pullDistance < threshold) {
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pulling, pullDistance, refreshing]);

  return (
    <>
      <AnimatePresence>
        {(pullDistance > 0 || refreshing) && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: refreshing ? 20 : Math.min(pullDistance - 30, 20), 
              opacity: pullDistance / threshold 
            }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
          >
            <div className="bg-white rounded-full shadow-lg p-2.5 border border-emerald-100 flex items-center justify-center">
              {refreshing ? (
                <Loader2 size={24} className="text-emerald-600 animate-spin" />
              ) : (
                <RefreshCw 
                  size={24} 
                  className="text-emerald-600" 
                  style={{ transform: `rotate(${pullDistance * 2}deg)` }} 
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ 
        transform: !refreshing && pulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
        transition: pulling ? 'none' : 'transform 0.3s ease-out'
      }}>
        {children}
      </div>
    </>
  );
};

export default PullToRefresh;
