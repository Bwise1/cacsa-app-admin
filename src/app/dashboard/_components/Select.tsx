import React, { SelectHTMLAttributes } from "react";

interface Option {
  id: number;
  name: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
}

const Select: React.FC<SelectProps> = ({ options, ...rest }) => {
  return (
    <div className="mb-4">
      <select
        className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        {...rest}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
