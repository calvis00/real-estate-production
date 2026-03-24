'use client';

import React, { useState, useEffect } from 'react';

interface BudgetSliderProps {
  onChange: (min: number, max: number) => void;
}

export default function BudgetSlider({ onChange }: BudgetSliderProps) {
  const [min, setMin] = useState(10);
  const [max, setMax] = useState(500); // 5 Crore default max

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), max - 10);
    setMin(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), min + 10);
    setMax(value);
  };

  useEffect(() => {
    onChange(min, max);
  }, [min, max]);

  const formatValue = (val: number) => {
    if (val < 100) return `${val}L`;
    return `${(val / 100).toFixed(1)}Cr`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/5 shadow-sm">{formatValue(min)}</span>
        <div className="h-[1px] flex-1 mx-4 bg-primary/10 relative">
            <div 
                className="absolute h-full bg-secondary transition-all" 
                style={{ 
                    left: `${(min / 2000) * 100}%`, 
                    right: `${100 - (max / 2000) * 100}%` 
                }}
            />
        </div>
        <span className="text-xs font-extrabold text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/10 shadow-sm">{formatValue(max)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1 bg-primary/10 rounded-full overflow-hidden">
          <div 
              className="absolute h-full bg-secondary transition-all" 
              style={{ 
                  left: `${(min / 2000) * 100}%`, 
                  right: `${100 - (max / 2000) * 100}%` 
              }}
          />
        </div>
        <input
          type="range"
          min="10"
          max="2000"
          step="10"
          value={min}
          onChange={handleMinChange}
          className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 h-6 slider-thumb-premium"
        />
        <input
          type="range"
          min="10"
          max="2000"
          step="10"
          value={max}
          onChange={handleMaxChange}
          className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 h-6 slider-thumb-premium"
        />
      </div>
      <style jsx>{`
        .slider-thumb-premium {
          outline: none;
        }
        .slider-thumb-premium::-webkit-slider-thumb {
          appearance: none;
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #D4AF37;
          border: 2px solid #fff;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          cursor: pointer;
          position: relative;
          z-index: 40;
        }
        .slider-thumb-premium::-moz-range-thumb {
          appearance: none;
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #D4AF37;
          border: 2px solid #fff;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
