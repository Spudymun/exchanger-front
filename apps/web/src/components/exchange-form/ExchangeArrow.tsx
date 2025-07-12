import React from 'react';

interface ExchangeArrowProps {
  className?: string;
}

export function ExchangeArrow({ className }: ExchangeArrowProps) {
  return (
    <div className={`flex-shrink-0 flex items-center justify-center ${className || ''}`}>
      <div className="bg-primary/10 border border-primary/20 rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
        <div className="text-primary text-2xl font-bold leading-none flex items-center justify-center">
          →
        </div>
      </div>
    </div>
  );
}
