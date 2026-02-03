
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'orangeOutline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className, 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-2.5 rounded-full font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 active:brightness-90";
  
  const variants = {
    primary: "bg-[#222222] text-white hover:bg-black shadow-sm",
    secondary: "bg-[#fdebd2] text-[#4d3b25] hover:bg-[#fbdcb2]",
    outline: "border-2 border-[#222222] text-[#222222] hover:bg-[#f3f3f3]",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    orangeOutline: "border-2 border-orange-600/30 bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
