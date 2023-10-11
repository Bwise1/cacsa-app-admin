import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  // You can add more prop types here if needed
}

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="rounded-[5px] border border-green bg-ca-black self-center h-full">
      {children}
    </div>
  );
};

export default Card;
