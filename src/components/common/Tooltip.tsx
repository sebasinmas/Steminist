import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  return (
    <div className="relative group flex items-center">
      {children}
      <div className="absolute left-0 top-full mt-2 w-64 p-3 text-sm bg-popover text-foreground border border-border rounded-lg shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
