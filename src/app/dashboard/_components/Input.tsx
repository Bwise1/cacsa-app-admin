import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder: string;
}

const Input: React.FC<InputProps> = ({ placeholder, ...rest }) => {
  return (
    <div className="mb-4">
      <input
        className="w-full px-3 py-2 border rounded-[10px] focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
};

export default Input;
