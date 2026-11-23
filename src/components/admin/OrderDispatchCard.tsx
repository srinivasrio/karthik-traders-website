'use client';

import { useState, useEffect, useRef } from 'react';
import {
    resolveDeliveryRule,
    PRESET_VEHICLE_TYPES,
    DEFAULT_RULES,
    StateDeliveryRule
} from '@/lib/delivery-config';
import { updateOrderDispatchAction } from '@/app/actions/orders';
import { compressAndConvertToPng } from '@/lib/client-image-processor';
import { uploadProductImageAction } from '@/app/actions/uploadImage';
import { supabase } from '@/lib/supabase';

interface OrderDispatchCardProps {
    order: any;
    onOrderUpdated: (updatedOrder: any) => void;
}

export default function OrderDispatchCard({ order, onOrderUpdated }: OrderDispatchCardProps) {
    const existingState =
        order?.delivery_state ||
        (typeof order?.shipping_address === 'object' ? order?.shipping_address?.state : null) ||
        'Andhra Pradesh';

    const [selectedState, setSelectedState] = useState<string>(existingState);
    const [rule, setRule] = useState<StateDeliveryRule>(resolveDeliveryRule(existingState));

    const [vehicleNumber, setVehicleNumber] = useState<string>(order?.vehicle_number || '');
    const [vehicleType, setVehicleType] = useState<string>(order?.vehicle_type || 'Tata Ace (Chota Hathi)');
    const [customVehicleType, setCustomVehicleType] = useState<string>('');
    const [driverName, setDriverName] = useState<string>(order?.driver_name || '');
    const [driverMobile, setDriverMobile] = useState<string>(order?.driver_mobile || '');
    const [transportName, setTransportName] = useState<string>(order?.transport_name || '');
    const [lrNumber, setLrNumber] = useState<string>(order?.lr_number || '');
    const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string>(order?.vehicle_photo_url || '');
    const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(
        order?.estimated_delivery_date ? String(order.estimated_delivery_date).slice(0, 10) : ''
    );
    const [markShipped, setMarkShipped] = useState<boolean>(
        order?.status === 'confirmed' || order?.status === 'processing'
    );

    const [uploadingImage, setUploadingImage] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [rules, setRules] = useState<StateDeliveryRule[]>([]);
    const [vehiclePresets, setVehiclePresets] = useState<string[]>(PRESET_VEHICLE_TYPES);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDeletePhoto = () => {
        setVehiclePhotoUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setMessage({
            type: 'success',
            text: 'Vehicle photo deleted. Click "Save Dispatch & Vehicle Details" to update the order, or choose a new photo below.'
        });
    };

    const handleTriggerFileInput = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        fetch('/api/delivery/config')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.rules && data.rules.length > 0) setRules(data.rules);
                    if (data.general?.vehiclePresets && data.general.vehiclePresets.length > 0) {
                        setVehiclePresets(data.general.vehiclePresets);
                    }
                }
            })
            .catch(() => {});
    }, []);

    const handleStateChange = (newState: string) => {
        setSelectedState(newState);
        setRule(resolveDeliveryRule(newState, rules.length > 0 ? rules : DEFAULT_RULES));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        setUploadingImage(true);
        setMessage(null);

        try {
            // Compress and convert to high-quality PNG (reduces size while preserving crisp clarity)
            const file = await compressAndConvertToPng(rawFile, 1600);

            let photoUrl: string | null = null;

            // Strategy 1: Server Action (bypasses mobile browser cookie/header limitations seamlessly)
            try {
                const actionFormData = new FormData();
                actionFormData.append('file', file);
                actionFormData.append('category', 'delivery');
                const actionRes = await uploadProductImageAction(actionFormData);
                if (actionRes.success && actionRes.publicUrl) {
                    photoUrl = actionRes.publicUrl;
                } else if (actionRes.error) {
                    console.warn('Server Action upload returned unsuccessful, falling back to API route:', actionRes.error);
                }
            } catch (actionErr: any) {
                console.warn('Server Action threw exception, falling back to API route:', actionErr?.message);
            }

            // Strategy 2: Direct REST API route with Supabase Auth token
            if (!photoUrl) {
                let session = (await supabase.auth.getSession()).data.session;
                if (!session?.access_token) {
                    const refreshRes = await supabase.auth.refreshSession();
                    session = refreshRes.data.session;
                }

                const headers: Record<string, string> = {};
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                }

                const formData = new FormData();
                formData.append('file', file);
                if (order?.id) {
                    formData.append('orderId', order.id);
                }

                const res = await fetch('/api/admin/orders/upload-vehicle-image', {
                    method: 'POST',
                    headers,
                    body: formData,
                });

                const data = await res.json();
                photoUrl = data.publicUrl || data.imageUrl;
                if (!data.success && !photoUrl) {
                    throw new Error(data.error || 'Failed to upload photo');
                }
            }

            if (photoUrl) {
                setVehiclePhotoUrl(photoUrl);
                setMessage({ type: 'success', text: 'Vehicle photo uploaded & optimized successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
            }
        } catch (err: any) {
            console.error('Photo upload error:', err);
            setMessage({ type: 'error', text: err.message || 'Error uploading photo' });
        } finally {
            setUploadingImage(false);
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleSaveDispatch = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const finalVehicleType = vehicleType === 'Other Transport Carrier' && customVehicleType.trim()
                ? customVehicleType.trim()
                : vehicleType;

            const res = await updateOrderDispatchAction(order.id, {
                vehicle_number: vehicleNumber,
                vehicle_type: finalVehicleType,
                driver_name: driverName,
                driver_mobile: driverMobile,
                vehicle_photo_url: vehiclePhotoUrl,
                transport_name: transportName,
                lr_number: lrNumber,
                estimated_delivery_date: estimatedDeliveryDate || undefined,
                delivery_state: rule.stateName,
                delivery_type: rule.responsibility === 'karthik_traders' ? 'free_ap' : 'customer_arranged',
                delivery_estimated_days: rule.timelineText,
                mark_shipped: markShipped,
            });

            if (res.success && res.data) {
                setMessage({ type: 'success', text: 'Dispatch & vehicle details saved successfully!' });
                onOrderUpdated(res.data);
            } else {
                setMessage({ type: 'error', text: res.error || 'Failed to save dispatch details' });
            }
        } catch (err: any) {
            console.error('Save dispatch error:', err);
            setMessage({ type: 'error', text: err.message || 'Error saving dispatch details' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs mb-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shadow-2xs">
                        🚚
                    </span>
                    <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-poppins">
                            Dispatch & Loaded Vehicle Transparency
                        </h2>
                        <p className="text-xs text-slate-500">
                            Record loaded vehicle photo, driver details & delivery policy visible to the farmer
                        </p>
                    </div>
                </div>

                {/* State Policy Pill */}
                <div className={`px-3 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-2 ${rule.badgeColor.bg} ${rule.badgeColor.border} ${rule.badgeColor.text}`}>
                    <span className={`w-2 h-2 rounded-full ${rule.badgeColor.dot} animate-pulse`} />
                    <span>{rule.stateName}: {rule.policyBadgeText}</span>
                </div>
            </div>

            {/* Notification message */}
            {message && (
                <div
                    className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                >
                    <span>{message.text}</span>
                    <button
                        type="button"
                        onClick={() => setMessage(null)}
                        className="text-xs underline hover:opacity-80"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Destination State & Policy */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Destination State
                    </label>
                    <select
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                        {(rules.length > 0 ? rules : DEFAULT_RULES).map((r) => (
                            <option key={r.id} value={r.stateName}>
                                {r.stateName} ({r.isFreeDelivery ? 'FREE Delivery' : 'Customer Arranged'} · {r.timelineText})
                            </option>
                        ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                        {rule.tagline}
                    </p>
                </div>

                {/* 2. Vehicle Registration Number */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Vehicle Number (Lorry / Van) *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. AP 26 TB 1234"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                            className="w-full rounded-xl border border-slate-300 bg-amber-50/40 px-3.5 py-2.5 text-xs font-mono font-extrabold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal shadow-2xs"
                        />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                        Registration plate of the vehicle carrying aerators
                    </p>
                </div>

                {/* 3. Vehicle Type */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Vehicle / Transport Type
                    </label>
                    <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                        {vehiclePresets.map((vt) => (
                            <option key={vt} value={vt}>
                                {vt}
                            </option>
                        ))}
                    </select>
                    {vehicleType === 'Other Transport Carrier' && (
                        <input
                            type="text"
                            placeholder="Enter carrier name or vehicle model"
                            value={customVehicleType}
                            onChange={(e) => setCustomVehicleType(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                        />
                    )}
                </div>

                {/* 4. Driver Name */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Driver Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                </div>

                {/* 5. Driver Mobile Phone */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Driver Mobile (For Customer Call Button)
                    </label>
                    <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={driverMobile}
                        onChange={(e) => setDriverMobile(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                        Farmer will see a one-tap &quot;Call Driver&quot; button in their dashboard
                    </p>
                </div>

                {/* 6. Estimated Delivery Date */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Estimated Delivery Date
                    </label>
                    <input
                        type="date"
                        value={estimatedDeliveryDate}
                        onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                </div>

                {/* 7. Transport / LR Number (Optional) */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Transport / LR / Bilty Number (Optional)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Navata LR # 89401"
                        value={lrNumber}
                        onChange={(e) => setLrNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                </div>

                {/* 8. Vehicle Loaded Photo Upload */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Vehicle Photo (After Load) 📸
                    </label>

                    {/* Hidden single file input ref reused for both initial upload and change photo */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.bmp,.gif,.dng"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                    />

                    {vehiclePhotoUrl ? (
                        /* State A: Photo is Present -> Show Photo, Delete Button & Change Button */
                        <div className="flex flex-col sm:flex-row gap-4 items-start bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4">
                            {/* Photo Thumbnail */}
                            <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-100 w-40 h-32 shrink-0 shadow-sm">
                                <img
                                    src={vehiclePhotoUrl}
                                    alt="Vehicle after load"
                                    className="w-full h-full object-cover"
                                />
                                <span className="absolute top-1.5 left-1.5 bg-emerald-700/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs">
                                    <span>✓</span> Loaded
                                </span>
                                <a
                                    href={vehiclePhotoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-1.5 right-1.5 bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xs transition-colors flex items-center gap-1"
                                >
                                    <span>🔍</span> Full View
                                </a>
                            </div>

                            {/* Details & Action Buttons */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                        <span>📸</span> Loaded Vehicle Photo Attached
                                    </h4>
                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                        This photo is visible to the farmer in their order tracking screen. You can change it with a new photo or delete it completely.
                                    </p>
                                </div>

                                {/* Prominent Action Buttons: Change Photo & Delete Photo */}
                                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleTriggerFileInput}
                                        disabled={uploadingImage}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        <span>{uploadingImage ? '⏳ Compressing & Uploading...' : '🔄 Change / Replace Photo'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleDeletePhoto}
                                        disabled={uploadingImage}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        <span>🗑️</span>
                                        <span>Delete Image</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[10px] font-medium text-slate-400">Photo URL:</span>
                                    <input
                                        type="text"
                                        value={vehiclePhotoUrl}
                                        onChange={(e) => setVehiclePhotoUrl(e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* State B: No Photo Yet -> Show Upload Box */
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-40 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                                <span className="text-3xl">📸</span>
                                <span className="text-[10px] font-semibold mt-1">No photo yet</span>
                            </div>

                            <div className="flex-1 space-y-2">
                                <button
                                    type="button"
                                    onClick={handleTriggerFileInput}
                                    disabled={uploadingImage}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-extrabold cursor-pointer transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
                                >
                                    <span>{uploadingImage ? '⏳ Compressing & Uploading...' : '📷 Choose Photo (DCIM / Camera)'}</span>
                                </button>
                                <p className="text-[11px] text-slate-500">
                                    Supports all formats (Camera, Mobile DCIM gallery, PNG, JPG). Automatically compressed to high quality PNG.
                                </p>

                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Upload a photo of the aerator gearboxes, motors, and floats loaded on the truck/van. The farmer can see this picture in their order tracking screen.
                                </p>

                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[11px] text-slate-400">Or paste URL:</span>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={vehiclePhotoUrl}
                                        onChange={(e) => setVehiclePhotoUrl(e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-[11px] text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={markShipped}
                        onChange={(e) => setMarkShipped(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                        Mark order status as <span className="text-purple-700 uppercase">&quot;Shipped / Dispatched&quot;</span>
                    </span>
                </label>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSaveDispatch}
                        disabled={saving || uploadingImage}
                        className="px-5 py-2.5 rounded-xl bg-[#0B7A4B] hover:bg-[#09633D] text-white text-xs font-extrabold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin text-sm">⏳</span>
                                <span>Saving Details...</span>
                            </>
                        ) : (
                            <>
                                <span>🚚</span>
                                <span>Save Dispatch & Vehicle Details</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
