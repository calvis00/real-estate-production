'use client';

import React, { useState, useEffect } from 'react';

interface BudgetSliderProps {
  onChange: (min: number, max: number) => void;
}

export default function BudgetSlider({ onChange }: BudgetSliderProps) {
  const MIN_BUDGET_L = 10;
  const MAX_BUDGET_L = 500; // 5 Cr hard cap
  const STEP_L = 5;
  const MIN_GAP_L = 5;

  const [min, setMin] = useState(10);
  const [max, setMax] = useState(15);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), max - MIN_GAP_L);
    setMin(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), min + MIN_GAP_L);
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
    <div className="w-full mx-auto max-w-[640px] space-y-5">
      <div className="flex items-center justify-between gap-6">
        <span className="min-w-[68px] text-center text-xs font-extrabold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/5 shadow-sm">
          {formatValue(min)}
        </span>
        <div className="h-[2px] flex-1 bg-primary/10 relative rounded-full">
          <div
            className="absolute h-full bg-secondary transition-all rounded-full"
            style={{
              left: `${(min / MAX_BUDGET_L) * 100}%`,
              right: `${100 - (max / MAX_BUDGET_L) * 100}%`,
            }}
          />
        </div>
        <span className="min-w-[68px] text-center text-xs font-extrabold text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/10 shadow-sm">
          {formatValue(max)}
        </span>
      </div>

      <div className="relative h-8 flex items-center px-1">
        <div className="absolute left-1 right-1 h-1 bg-primary/10 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-secondary transition-all rounded-full"
            style={{
              left: `${(min / MAX_BUDGET_L) * 100}%`,
              right: `${100 - (max / MAX_BUDGET_L) * 100}%`,
            }}
          />
        </div>
        <input
          type="range"
          min={String(MIN_BUDGET_L)}
          max={String(MAX_BUDGET_L)}
          step={String(STEP_L)}
          value={min}
          onChange={handleMinChange}
          className="absolute left-1 right-1 w-auto appearance-none bg-transparent pointer-events-none z-30 h-8 slider-thumb-premium"
        />
        <input
          type="range"
          min={String(MIN_BUDGET_L)}
          max={String(MAX_BUDGET_L)}
          step={String(STEP_L)}
          value={max}
          onChange={handleMaxChange}
          className="absolute left-1 right-1 w-auto appearance-none bg-transparent pointer-events-none z-30 h-8 slider-thumb-premium"
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
