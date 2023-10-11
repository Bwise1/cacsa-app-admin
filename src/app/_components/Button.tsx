import React, { ButtonHTMLAttributes } from "react";
import { FaSpinner } from "react-icons/fa";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: any;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  isLoading,
  icon,
  className,
  ...rest
}) => {
  // Combine the Tailwind CSS classes with the provided className
  const buttonClassName = `text-white py-2 px-4 rounded-lg ${className || ""}`;

  return (
    <button {...rest} className={buttonClassName}>
      <span className="flex items-center gap-2">
        {icon && <span>{icon}</span>} {label} {isLoading ? "..." : null}
      </span>
    </button>
  );
};

export default Button;
