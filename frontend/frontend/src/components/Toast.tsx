import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((t) => [...t, { id, type, message }]);
        setTimeout(() => {
            setToasts((t) => t.filter(x => x.id !== id));
        }, duration);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-root" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

export default ToastProvider;
