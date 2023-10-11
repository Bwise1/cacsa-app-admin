import React, { SelectHTMLAttributes } from "react";

interface Option {
  [key: string]: any;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
  placeholder?: string;
  valueKey: string;
  labelKey: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  valueKey,
  labelKey,
  ...rest
}) => {
  return (
    <div className="">
      <select className="input-modal text-white appearance-none" {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option[valueKey]} value={option[valueKey]}>
            {option[labelKey]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
