import React, { ReactNode } from "react";
import Card from "./Card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Outer wrapper; default fixed size for legacy screens (e.g. locations). */
  shellClassName?: string;
  /** Inner content box; default scrolls when content exceeds shell height. */
  bodyClassName?: string;
  /** Passed to Card; use `h-auto min-h-0` when shell height is not fixed. */
  cardClassName?: string;
  /** Absolute position classes for the Close control (default large modals). */
  closeButtonClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  shellClassName,
  bodyClassName,
  cardClassName,
  closeButtonClassName,
}) => {
  const modalClasses = isOpen ? "block" : "hidden";

  const shell =
    shellClassName ?? "relative w-[702px] h-[471px] max-w-[min(702px,calc(100vw-2rem))]";
  const body =
    bodyClassName ??
    "modal-content bg-black h-full px-20 py-8 rounded-lg overflow-y-scroll no-scrollbar shadow-lg";

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/80 ${modalClasses}`}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-[201] ${shell}`}
      >
        <Card className={cardClassName}>
          <div className={body}>
            <button
              onClick={onClose}
              type="button"
              className={`absolute hover:text-red-500 focus:outline-none underline underline-offset-4 text-sm ${
                closeButtonClassName ?? "top-8 right-20"
              }`}
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
