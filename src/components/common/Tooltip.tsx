import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
  const positionStyles = {
    top: 'left-1/2 -translate-x-1/2 bottom-full mb-2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    bottom: 'left-1/2 -translate-x-1/2 top-full mt-2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative group flex items-center">
      {children}
      <div className={`absolute ${positionStyles[position]} w-64 p-3 text-sm bg-popover text-foreground border border-border rounded-lg shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}>
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
