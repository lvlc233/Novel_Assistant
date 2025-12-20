import React from 'react';

// 功能卡片
interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  rotation?: string; //倾斜角度
  color?: string; 
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  icon, 
  rotation = 'rotate-0', 
  color = 'bg-white',
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer
        w-44 h-60 flex flex-col items-center justify-center
        ${color} ${rotation}
        rounded-2xl
        border border-border-primary
        shadow-card-soft
        transition-all duration-400 cubic-bezier(0.2, 0.8, 0.2, 1)
        hover:scale-105 hover:-translate-y-2 hover:rotate-0 
        hover:shadow-card-hover hover:z-10
        hover:bg-white
      `}
    >
      <div className="
        mb-5 p-4 rounded-full bg-surface-secondary text-text-secondary
        transition-all duration-300 
        group-hover:scale-110 group-hover:bg-surface-hover group-hover:text-accent-primary
      ">
        {React.cloneElement(icon as React.ReactElement, { strokeWidth: 1.5 })}
      </div>
      
      <h3 className="text-lg font-serif font-medium text-text-primary tracking-wide text-center px-4">
        {title}
      </h3>
      
      {/* Decorative subtle corner accent */}
      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default FeatureCard;
