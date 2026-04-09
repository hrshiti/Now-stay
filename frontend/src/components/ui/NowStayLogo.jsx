import React from 'react';

/**
 * NowStayLogo — Pure CSS logo component
 * Props:
 *   size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   inverted: boolean — white text on dark background (default: false)
 */
const NowStayLogo = ({ size = 'md', inverted = false }) => {
  const sizeMap = {
    xs: { fontSize: '14px', dotIn: '11px', barWidth: '20px', barHeight: '2px', gap: '1px' },
    sm: { fontSize: '18px', dotIn: '14px', barWidth: '26px', barHeight: '2.5px', gap: '1px' },
    md: { fontSize: '24px', dotIn: '18px', barWidth: '34px', barHeight: '3px', gap: '2px' },
    lg: { fontSize: '30px', dotIn: '22px', barWidth: '42px', barHeight: '3px', gap: '2px' },
    xl: { fontSize: '38px', dotIn: '28px', barWidth: '52px', barHeight: '4px', gap: '3px' },
  };

  const { fontSize, dotIn, barWidth, barHeight, gap } = sizeMap[size] || sizeMap.md;
  const nowColor = inverted ? '#ffffff' : '#0f2b3d';
  const tealColor = '#009999';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap }}>
      <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
        <span
          style={{
            fontSize,
            fontWeight: 800,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: nowColor,
            letterSpacing: '-0.5px',
          }}
        >
          NOW
        </span>
        <span
          style={{
            fontSize,
            fontWeight: 800,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: tealColor,
            letterSpacing: '-0.5px',
          }}
        >
          STAY
        </span>
        <span
          style={{
            fontSize: dotIn,
            fontWeight: 700,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: tealColor,
            letterSpacing: '0px',
          }}
        >
          .in
        </span>
      </div>
      {/* Underline bar */}
      <div
        style={{
          width: barWidth,
          height: barHeight,
          backgroundColor: tealColor,
          borderRadius: '2px',
          marginLeft: '1px',
        }}
      />
    </div>
  );
};

export default NowStayLogo;
