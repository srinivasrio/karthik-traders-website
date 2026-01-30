
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100 opacity-100">
                <div className="text-center">
                    {/* Icon */}
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${isDestructive ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                        {isDestructive ? (
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-white text-slate-700 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-aqua-600 hover:bg-aqua-700 focus:ring-aqua-500'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
