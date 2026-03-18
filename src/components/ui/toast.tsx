"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleDismiss() {
    setVisible(false);
    timerRef.current = setTimeout(() => onDismiss(toast.id), 300);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isError = toast.type === "error";

  return (
    <div
      role="status"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: "auto",
      }}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-md min-w-[220px] max-w-xs ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
      }`}
    >
      {/* Icon */}
      {isError ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-red-500"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
          <line
            x1="8"
            y1="5"
            x2="8"
            y2="8.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11" r="0.7" fill="currentColor" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-emerald-500"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
          <polyline
            points="5,8.5 7,10.5 11,6"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      <span className="flex-1 leading-snug">{toast.message}</span>

      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="ml-1 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
