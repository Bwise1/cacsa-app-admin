import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  /** Replaces default `h-full` when set (e.g. modals with auto height). */
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={`rounded-[5px] border border-green bg-ca-black self-center ${className ?? "h-full"}`}
    >
      {children}
    </div>
  );
};

export default Card;
