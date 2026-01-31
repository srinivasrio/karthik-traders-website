
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export default function OrderSuccessModal({ isOpen, onClose, orderId }: OrderSuccessModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                    ></motion.div>

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-8 text-center">
                            {/* Success Icon Animation */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
                            </motion.div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Requested!</h2>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                Your order <span className="font-semibold text-slate-900">#{orderId.slice(0, 8)}</span> has been submitted successfully.
                                <br /><br />
                                You will be notified via SMS once our team reviews and accepts your order.
                            </p>

                            <div className="bg-slate-50 rounded-2xl p-4 mb-8">
                                <div className="flex items-center gap-3 text-left">
                                    <div className="w-10 h-10 rounded-full bg-aqua-100 flex items-center justify-center text-aqua-600 flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Next Steps</p>
                                        <p className="text-xs text-slate-500">Wait for admin approval. Stock will be confirmed upon acceptance.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-deep-blue-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-deep-blue-900/20 active:scale-95 transition-transform"
                            >
                                Track in Dashboard
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
