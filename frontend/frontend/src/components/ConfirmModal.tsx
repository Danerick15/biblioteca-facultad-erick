import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    visible: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ visible, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }) => {
    if (!visible) return null;
    return (
        <div className="cm-modal-overlay" onClick={onCancel}>
            <div className="cm-modal" onClick={e => e.stopPropagation()}>
                {title && <h3 className="cm-title">{title}</h3>}
                <div className="cm-message">{message}</div>
                <div className="cm-actions">
                    <button className="cm-btn cm-cancel" onClick={onCancel}>{cancelLabel}</button>
                    <button className="cm-btn cm-confirm" onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
