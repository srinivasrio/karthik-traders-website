"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string;
    message?: string;
}

export default function OrderSuccessModal({ isOpen, onClose, orderId, message }: OrderSuccessModalProps) {
    const router = useRouter();

    const handleViewOrders = () => {
        onClose();
        router.push('/admin/orders');
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 border border-slate-100">
                                <div>
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900">
                                            Order Created Successfully
                                        </Dialog.Title>
                                        <div className="mt-2 px-2">
                                            <p className="text-sm text-slate-500">
                                                {message || 'The order has been created and logged in the system.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-xl bg-aqua-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-aqua-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-600 transition-all active:scale-[0.98]"
                                        onClick={handleViewOrders}
                                    >
                                        View All Orders
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
                                        onClick={onClose}
                                    >
                                        Create Another Order
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
