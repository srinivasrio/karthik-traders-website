'use client';

import { useState } from 'react';
import { resolveDeliveryRule } from '@/lib/delivery-config';

interface CustomerOrderDeliveryCardProps {
    order: {
        id: string;
        order_number?: number;
        status: string;
        shipping_address?: any;
        delivery_state?: string;
        delivery_type?: string;
        delivery_estimated_days?: string;
        vehicle_number?: string;
        vehicle_type?: string;
        driver_name?: string;
        driver_mobile?: string;
        vehicle_photo_url?: string;
        transport_name?: string;
        lr_number?: string;
        dispatched_at?: string;
        estimated_delivery_date?: string;
    };
}

export default function CustomerOrderDeliveryCard({ order }: CustomerOrderDeliveryCardProps) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // Resolve state and corresponding rule
    const destinationState =
        order.delivery_state ||
        (typeof order.shipping_address === 'object' ? order.shipping_address?.state : null) ||
        'Andhra Pradesh';

    const rule = resolveDeliveryRule(destinationState);

    const hasDispatchInfo = Boolean(
        order.vehicle_number ||
        order.driver_name ||
        order.driver_mobile ||
        order.vehicle_photo_url ||
        order.lr_number
    );

    const isShippedOrDelivered =
        order.status === 'shipped' ||
        order.status === 'delivered' ||
        order.status === 'completed';

    const cleanDriverMobile = order.driver_mobile ? order.driver_mobile.replace(/\D/g, '').slice(-10) : '';

    return (
        <div className="rounded-2xl border-2 border-[#D5E5FF] bg-gradient-to-br from-[#F5F9FF] via-white to-[#F0FDF4] p-4 sm:p-5 shadow-xs overflow-hidden">
            {/* Top Bar: State Delivery Policy Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#E3EDF9]">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center text-base shrink-0 shadow-2xs">
                        🚚
                    </span>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-extrabold text-[#0B1A33] font-poppins">
                                Delivery Details & Vehicle Tracking
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                {rule.stateName}
                            </span>
                        </div>
                        <p className="text-[11px] text-[#5B6880] mt-0.5">
                            {rule.timelineText} delivery timeline
                        </p>
                    </div>
                </div>

                {/* State Specific Policy Badge */}
                <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${rule.badgeColor.bg} ${rule.badgeColor.border} ${rule.badgeColor.text}`}
                >
                    <span className={`w-2 h-2 rounded-full ${rule.badgeColor.dot} animate-pulse`} />
                    <span>
                        {rule.isFreeDelivery
                            ? '🟢 Free Delivery (3 to 7 Days)'
                            : `${rule.stateName}: Customer Responsibility (${rule.timelineText})`}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            {hasDispatchInfo || isShippedOrDelivered ? (
                <div className="mt-4 flex flex-col gap-4">
                    {/* Dispatched Vehicle Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                        {/* Vehicle Photo (After Load) */}
                        {order.vehicle_photo_url ? (
                            <div className="md:col-span-1 flex flex-col gap-1.5">
                                <span className="text-[11px] font-extrabold text-[#5B6880] uppercase tracking-wider flex items-center gap-1">
                                    <span>📸</span> Loaded Vehicle Photo
                                </span>
                                <div
                                    onClick={() => setIsImageModalOpen(true)}
                                    className="relative group rounded-xl overflow-hidden border border-[#D5E5FF] bg-black/5 aspect-4/3 sm:aspect-auto sm:h-36 cursor-pointer shadow-2xs hover:shadow-md transition-shadow"
                                    title="Click to view full photo"
                                >
                                    <img
                                        src={order.vehicle_photo_url}
                                        alt={`Loaded vehicle ${order.vehicle_number || ''}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2.5">
                                        <span className="text-white text-[11px] font-bold flex items-center gap-1">
                                            🔍 Tap to Enlarge Photo
                                        </span>
                                    </div>
                                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow">
                                        Loaded at Nellore
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="md:col-span-1 flex flex-col justify-center items-center p-4 rounded-xl border border-dashed border-slate-300 bg-white/60 text-center text-xs text-slate-500">
                                <span className="text-2xl mb-1">🚚</span>
                                <span className="font-bold text-slate-700">Vehicle Assigned</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Photo being uploaded after loading</span>
                            </div>
                        )}

                        {/* Vehicle Plate & Type Card */}
                        <div className="md:col-span-2 flex flex-col justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white border border-[#DCE7F5] shadow-2xs">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <span className="text-[10px] font-bold text-[#5B6880] uppercase tracking-wider block mb-1">
                                        Vehicle Number
                                    </span>
                                    {order.vehicle_number ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-300/90 border border-amber-400 text-slate-950 font-mono font-black text-sm sm:text-base tracking-widest shadow-2xs">
                                            <span className="text-[10px] font-bold text-slate-700 border-r border-amber-400 pr-1.5">
                                                IND
                                            </span>
                                            <span>{order.vehicle_number}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-500 italic">
                                            Vehicle registration assigned
                                        </span>
                                    )}

                                    {order.vehicle_type && (
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-700">
                                                Type:
                                            </span>
                                            <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                {order.vehicle_type}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Timeline / Expected Date */}
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-[#5B6880] uppercase tracking-wider block">
                                        Expected Timeline
                                    </span>
                                    <span className="text-xs sm:text-sm font-extrabold text-[#0B7A4B] font-poppins block mt-0.5">
                                        {order.delivery_estimated_days || rule.timelineText}
                                    </span>
                                    {order.estimated_delivery_date && (
                                        <span className="text-[10px] font-semibold text-slate-500 block">
                                            By {new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Driver Information & Action Buttons */}
                            <div className="pt-2.5 border-t border-[#EEF2F8] flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-bold text-[#5B6880] uppercase tracking-wider block">
                                        Driver Details
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-xs font-bold text-[#0B1A33]">
                                            {order.driver_name || 'Assigned Driver'}
                                        </span>
                                        {cleanDriverMobile && (
                                            <span className="text-xs font-mono text-slate-600 font-semibold">
                                                · +91 {cleanDriverMobile}
                                            </span>
                                        )}
                                    </div>
                                    {order.lr_number && (
                                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                                            LR / Bilty: {order.lr_number}
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons: Call Driver & WhatsApp */}
                                <div className="flex items-center gap-2">
                                    {cleanDriverMobile ? (
                                        <>
                                            <a
                                                href={`tel:+91${cleanDriverMobile}`}
                                                className="h-8 sm:h-9 px-3.5 rounded-full bg-[#10B26C] hover:bg-[#0B7A4B] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                                            >
                                                <span>📞</span>
                                                <span>Call Driver</span>
                                            </a>
                                            <a
                                                href={`https://wa.me/91${cleanDriverMobile}?text=${encodeURIComponent(
                                                    `Namaste, regarding Karthik Traders Aerators load for Order #${order.order_number || order.id.slice(0, 6)} (Vehicle ${order.vehicle_number || ''})`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-8 sm:h-9 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                                                title="Chat on WhatsApp"
                                            >
                                                <span>💬</span>
                                                <span className="hidden sm:inline">WhatsApp</span>
                                            </a>
                                        </>
                                    ) : (
                                        <span className="text-[11px] text-slate-400 italic">
                                            Driver phone available upon departure
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanatory Policy Note for Customer */}
                    <div className="p-3 rounded-xl bg-white/80 border border-[#E2E8F0] text-xs text-[#475569] flex items-start gap-2.5">
                        <span className="text-base shrink-0">ℹ️</span>
                        <div className="leading-relaxed">
                            <span className="font-bold text-slate-800">{rule.stateName} Delivery Policy: </span>
                            {rule.description}
                        </div>
                    </div>
                </div>
            ) : (
                /* Pre-dispatch preparation notice */
                <div className="mt-3.5 p-3.5 rounded-xl bg-white/80 border border-[#DCE7F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                        <span className="text-xl">📦</span>
                        <div>
                            <span className="font-bold text-slate-900 block">
                                Being Prepared at Nellore Facility
                            </span>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                Aerators, motors & floats are being tested and packed. Once loaded onto the transport vehicle, vehicle number, driver contact & photo of the loaded truck will be displayed here.
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                            Estimated: {rule.timelineText}
                        </span>
                    </div>
                </div>
            )}

            {/* Loaded Vehicle Photo Enlarged Modal */}
            {isImageModalOpen && order.vehicle_photo_url && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
                    onClick={() => setIsImageModalOpen(false)}
                >
                    <div
                        className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm font-poppins">
                                    Loaded Vehicle Photo
                                </span>
                                {order.vehicle_number && (
                                    <span className="font-mono text-xs bg-amber-400 text-black px-2 py-0.5 rounded font-black">
                                        {order.vehicle_number}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsImageModalOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Image */}
                        <div className="overflow-auto max-h-[75vh] bg-slate-950 flex items-center justify-center">
                            <img
                                src={order.vehicle_photo_url}
                                alt={`Loaded vehicle ${order.vehicle_number || ''}`}
                                className="max-w-full max-h-[75vh] object-contain"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                            <span>
                                {order.vehicle_type ? `Vehicle: ${order.vehicle_type}` : 'Dispatched from Nellore'}
                                {order.driver_name ? ` · Driver: ${order.driver_name}` : ''}
                            </span>
                            {cleanDriverMobile && (
                                <a
                                    href={`tel:+91${cleanDriverMobile}`}
                                    className="px-3 py-1 rounded-full bg-[#10B26C] text-white font-bold inline-flex items-center gap-1"
                                >
                                    <span>📞 Call Driver</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
