import React, { SelectHTMLAttributes } from "react";

interface Option {
  [key: string]: any;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: (Option & { isDisabled?: boolean })[]; // Add isDisabled to options
  placeholder?: string;
  valueKey: string;
  labelKey: string;
  selectedState: number;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  valueKey,
  selectedState,
  labelKey,
  ...rest
}) => {
  return (
    <div className="">
      <select
        className="input-modal text-white appearance-none"
        {...rest}
        value={selectedState}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option[valueKey]}
            value={option[valueKey]}
            disabled={option.isDisabled || false} // Set disabled attribute based on isDisabled property
          >
            {option[labelKey]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
