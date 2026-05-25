"use client";

import { BRANDS } from '@/data/admin-constants';

interface ProductPreviewCardProps {
    name: string;
    model: string;
    brand: string;
    category: string;
    mrp: string;
    sellingPrice: string;
    warranty: string;
    stockStatus: string;
    images: string[];
    features: string[];
    isBestSelling?: boolean;
}

export default function ProductPreviewCard({
    name,
    model,
    brand,
    category,
    mrp,
    sellingPrice,
    warranty,
    stockStatus,
    images,
    features,
    isBestSelling = false,
}: ProductPreviewCardProps) {
    const brandDef = BRANDS.find(b => b.value === brand);
    const brandLabel = brandDef ? brandDef.label : (brand && brand !== 'generic' ? brand : '');
    const brandColor = brandDef ? brandDef.color : '#A855F7';
    const mrpNum = parseFloat(mrp) || 0;
    const priceNum = parseFloat(sellingPrice) || 0;
    const discount = mrpNum > 0 && priceNum > 0 && mrpNum > priceNum
        ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
        : 0;

    const primaryImage = images.length > 0 ? images[0] : null;

    const formatCategory = (cat: string) =>
        cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-xs w-full">
            {/* Header */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Storefront Preview
                </p>
            </div>

            {/* Image */}
            <div className="relative aspect-square bg-slate-100">
                {primaryImage ? (
                    <img
                        src={primaryImage}
                        alt={name || 'Product'}
                        className="w-full h-full object-contain p-4"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-slate-200 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">No image</p>
                        </div>
                    </div>
                )}

                {/* Brand badge */}
                {brandLabel && brand !== 'generic' && (
                    <span
                        className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: brandColor }}
                    >
                        {brandLabel.toUpperCase()}
                    </span>
                )}

                {/* Discount badge */}
                {discount > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">
                        {discount}% OFF
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
                {/* Category */}
                <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                    {formatCategory(category || 'uncategorized')}
                </span>

                {/* Name */}
                <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                    {name || 'Product Name'}
                </h3>

                {/* Model */}
                {model && (
                    <p className="text-xs text-slate-500">Model: {model}</p>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-600">
                        {priceNum > 0 ? `₹${priceNum.toLocaleString('en-IN')}` : '₹—'}
                    </span>
                    {mrpNum > 0 && mrpNum > priceNum && (
                        <span className="text-xs text-slate-400 line-through">
                            ₹{mrpNum.toLocaleString('en-IN')}
                        </span>
                    )}
                </div>

                {/* Warranty */}
                {warranty && (
                    <p className="text-[10px] text-slate-500">
                        🛡️ {warranty}
                    </p>
                )}

                {/* Stock Status & Badge */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            stockStatus === 'in-stock' ? 'bg-green-500' :
                            stockStatus === 'limited' ? 'bg-amber-500' :
                            'bg-red-500'
                        }`} />
                        <span className={`text-[10px] font-medium ${
                            stockStatus === 'in-stock' ? 'text-green-600' :
                            stockStatus === 'limited' ? 'text-amber-600' :
                            'text-red-600'
                        }`}>
                            {stockStatus === 'in-stock' ? 'In Stock' :
                             stockStatus === 'limited' ? 'Limited Stock' :
                             'Out of Stock'}
                        </span>
                    </div>

                    {isBestSelling && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                            <svg className="w-3 h-3 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Best Selling
                        </span>
                    )}
                </div>

                {/* Features */}
                {features.filter(f => f.trim()).length > 0 && (
                    <ul className="space-y-0.5">
                        {features.filter(f => f.trim()).slice(0, 3).map((feat, i) => (
                            <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                                <span className="text-aqua-500 mt-0.5">✓</span>
                                <span className="line-clamp-1">{feat}</span>
                            </li>
                        ))}
                        {features.filter(f => f.trim()).length > 3 && (
                            <li className="text-[10px] text-slate-400">
                                +{features.filter(f => f.trim()).length - 3} more features
                            </li>
                        )}
                    </ul>
                )}

                {/* Fake CTA */}
                <div className="pt-1">
                    <div className="w-full h-8 bg-aqua-100 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] font-medium text-aqua-600">Add to Cart</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
