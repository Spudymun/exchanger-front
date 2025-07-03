'use client';

import { ReactNode, useCallback } from 'react';

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  const handleClick = useCallback(() => {
    // Demo button - log instead of alert for better UX
    console.log(`Hello from your ${appName} app!`);
  }, [appName]);

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
};
