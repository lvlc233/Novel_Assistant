import React from 'react';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260120-02
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-20 21:48
 * 更新记录:
 * - [2026-01-20 21:48:FE-REF-20260120-02: 在何处使用: Dashboard 功能卡片；如何使用: 传入 Lucide 图标节点；实现概述: 移除 any，使用更安全的 ReactElement props 克隆。]
 */

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
  const iconElement = React.isValidElement(icon)
    ? (icon as React.ReactElement<Record<string, unknown>>)
    : null

  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer
        w-[200px] h-[280px] flex flex-col items-center justify-center
        ${color} ${rotation}
        rounded-[24px]
        border border-white/50
        shadow-xl
        transition-all duration-400 cubic-bezier(0.2, 0.8, 0.2, 1)
        hover:scale-105 hover:-translate-y-2 hover:rotate-0 
        hover:shadow-2xl hover:z-10
        hover:bg-surface-white
      `}
    >
      <div className="
        mb-5 w-16 h-16 rounded-2xl bg-surface-secondary text-text-secondary
        flex items-center justify-center
        transition-all duration-300 
        group-hover:scale-110 group-hover:bg-surface-hover group-hover:text-accent-primary
      ">
        {iconElement ? React.cloneElement(iconElement, { strokeWidth: 1.5, className: "w-8 h-8" }) : icon}
      </div>
      
      <h3 className="text-xl font-serif font-bold text-gray-800 tracking-wide text-center px-4">
        {title}
      </h3>
      
      {/* Decorative subtle corner accent */}
      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default FeatureCard;
