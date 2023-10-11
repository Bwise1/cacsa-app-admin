import React, { ReactNode, useState } from "react";
import Card from "./Card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalClasses = isOpen ? "block" : "hidden";

  return (
    <div
      onClick={onClose}
      className={`fixed top-0 left-0 w-full h-full bg-opacity-80 bg-black flex items-center justify-center ${modalClasses}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className=" relative w-[702px] h-[471px]"
      >
        <Card>
          <div className="modal-content bg-black h-full  px-20 py-8 rounded-lg overflow-y-scroll no-scrollbar shadow-lg">
            <button
              onClick={onClose}
              className="absolute top-8 right-20  hover:text-red-500 focus:outline-none underline underline-offset-4 text-sm"
            >
              Close
            </button>
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Modal;
