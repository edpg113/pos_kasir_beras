import React from "react";
import ReactDOM from "react-dom";
import "./style/Modal.scss";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}) {
  // Always check for modal-root existence
  const modalRoot = document.getElementById("modal-root");

  // Auto-focus logic
  React.useEffect(() => {
    if (isOpen) {
      const focusTimeout = setTimeout(() => {
        const firstInput = document.querySelector(
          "#modal-root input:not([disabled]), #modal-root select:not([disabled])"
        );
        if (firstInput) firstInput.focus();
      }, 50);
      return () => clearTimeout(focusTimeout);
    }
  }, [isOpen]);

  // Prevent background scroll with Electron safety
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      // Force cleanup
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    }
    return () => {
      // Defensive cleanup
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, [isOpen]);

  // Electron-specific: Force re-enable interactions on mount
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // If closed or no root, return nothing
  if (!isOpen || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div
      className={`modal-overlay is-active ${className}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    modalRoot
  );
}
