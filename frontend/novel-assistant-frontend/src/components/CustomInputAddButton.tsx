"use client";

import React from 'react';

interface CustomInputAddButtonProps {
  onClick?: () => void;
  className?: string;
}

const CustomInputAddButton: React.FC<CustomInputAddButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  return (
    <button 
      className={`copilotKitInputAddButton ${className}`}
      onClick={onClick}
      type="button"
      aria-label="添加附件"
      title="添加附件"
    >
      {/* + 号通过CSS ::before伪元素显示 */}
    </button>
  );
};

export default CustomInputAddButton;