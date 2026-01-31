
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'warning';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    isLoading = false
}: ConfirmModalProps) {

    const colors = {
        warning: {
            bg: 'bg-amber-100',
            icon: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
            Icon: ExclamationTriangleIcon
        },
        danger: {
            bg: 'bg-red-100',
            icon: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
            Icon: XCircleIcon
        },
        success: {
            bg: 'bg-emerald-100',
            icon: 'text-emerald-600',
            button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
            Icon: CheckCircleIcon
        }
    };

    const style = colors[type];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    ></motion.div>

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 ${style.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <style.Icon className={`w-8 h-8 ${style.icon}`} />
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                {message}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`w-full py-3.5 ${style.button} text-white rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {isLoading && (
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="w-full py-3 text-slate-500 font-semibold text-sm hover:bg-slate-50 rounded-2xl transition-colors"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
