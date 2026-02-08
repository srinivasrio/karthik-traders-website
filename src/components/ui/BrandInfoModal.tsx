'use client';

import LegalModal from './LegalModal'; // Assuming LegalModal is in the same directory

type BrandType = 'aqualion' | 'seaboss' | null;

interface BrandInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    brand: BrandType;
}

export default function BrandInfoModal({ isOpen, onClose, brand }: BrandInfoModalProps) {
    if (!brand) return null;

    const content = brand === 'aqualion' ? (
        <div className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex items-center justify-center">
                <img src="/images/logos/aqualion-logo.svg" alt="Aqualion" className="h-32 w-auto" />
            </div>

            <div>
                <h3 className="text-lg font-bold text-deep-blue-900 mb-2">Aqua Lion Aerators – Quality You Can Trust for Aquaculture</h3>
                <h4 className="text-md font-semibold text-deep-blue-800 mb-2">Premium Quality & Strong Performance</h4>
                <p className="text-slate-600 mb-4">
                    Aqua Lion Aerators are designed to deliver high oxygen transfer efficiency and powerful water circulation, making them ideal for fish and shrimp farming ponds. Built with heavy-duty materials, these aerators ensure long life, stable operation, and reliable performance even in continuous farming conditions.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-deep-blue-900 mb-2">Key Quality Features:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>High-efficiency paddle wheel design for better dissolved oxygen levels</li>
                        <li>Strong motor with consistent output and low power loss</li>
                        <li>Corrosion-resistant materials suitable for long-term pond use</li>
                        <li>Designed for both fish and shrimp aquaculture ponds</li>
                    </ul>
                </div>
            </div>

            <div>
                <h4 className="text-md font-semibold text-deep-blue-800 mb-2">Competitive Pricing – Best Value for Farmers</h4>
                <p className="text-slate-600 mb-4">
                    Aqua Lion Aerators offer an excellent balance between price and performance. Compared to many high-cost market brands, Aqua Lion provides premium build quality at a reasonable price, helping farmers reduce investment costs without compromising on efficiency.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-deep-blue-900 mb-2">Pricing Advantages:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>Cost-effective compared to similar heavy-duty aerators</li>
                        <li>Lower maintenance and operating costs</li>
                        <li>High return on investment through improved pond productivity</li>
                    </ul>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">(Prices may vary based on HP, paddle configuration, and specifications.)</p>
            </div>

            <div>
                <h4 className="text-md font-semibold text-deep-blue-800 mb-2">Reliable Service & Support</h4>
                <p className="text-slate-600 mb-4">
                    Customer satisfaction is a priority. Aqua Lion Aerators are supported by easy availability of spare parts and after-sales service support through authorized dealers. This ensures smooth operation and quick resolution of service needs.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-deep-blue-900 mb-2">Service Highlights:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>Spare parts availability</li>
                        <li>Technical guidance for proper usage</li>
                        <li>Dependable after-sales assistance</li>
                    </ul>
                </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
                <h4 className="text-md font-bold text-amber-900 mb-3">Why Choose Aqua Lion Aerators?</h4>
                <ul className="space-y-2 text-amber-800">
                    <li className="flex gap-2">
                        <span className="text-amber-600">✓</span> Trusted solution for modern aquaculture
                    </li>
                    <li className="flex gap-2">
                        <span className="text-amber-600">✓</span> Strong build, stable performance, and long service life
                    </li>
                    <li className="flex gap-2">
                        <span className="text-amber-600">✓</span> Affordable pricing for small and large farmers
                    </li>
                    <li className="flex gap-2">
                        <span className="text-amber-600">✓</span> Ideal for improving growth, survival rate, and pond health
                    </li>
                </ul>
            </div>
        </div>
    ) : (
        <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-center">
                <img src="/images/logos/seaboss-logo.svg" alt="Sea Boss" className="h-32 w-auto" />
            </div>

            <div>
                <h3 className="text-lg font-bold text-deep-blue-900 mb-2">SEA BOSS Aerators – Built for Powerful Aquaculture Performance</h3>
                <p className="text-slate-600 mb-4">
                    SEA BOSS Aerators are engineered to deliver efficient oxygenation and strong water circulation for fish and shrimp farming ponds. Designed with a focus on durability, performance, and efficiency, SEA BOSS aerators support healthy pond conditions and improved farm productivity.
                </p>
            </div>

            <div>
                <h4 className="text-md font-semibold text-deep-blue-800 mb-2">Robust Build & Consistent Quality</h4>
                <p className="text-slate-600 mb-4">
                    SEA BOSS Aerators are manufactured using high-strength materials and precision components to ensure long-lasting performance. The heavy-duty paddle wheel design maximizes oxygen transfer while maintaining stable and reliable operation.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-deep-blue-900 mb-2">Key Features:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>High-efficiency paddle wheel system</li>
                        <li>Powerful motor with steady output</li>
                        <li>Strong gearbox for continuous operation</li>
                        <li>Corrosion-resistant construction</li>
                        <li>Suitable for intensive aquaculture environments</li>
                    </ul>
                </div>
            </div>

            <div>
                <h4 className="text-md font-semibold text-deep-blue-800 mb-2">Competitive Pricing & High Value</h4>
                <p className="text-slate-600 mb-4">
                    SEA BOSS Aerators are positioned to offer excellent value for money. With an optimal balance of quality and cost, they provide farmers with a cost-effective aeration solution without compromising performance or reliability.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-deep-blue-900 mb-2">Pricing Benefits:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>Fair and competitive pricing</li>
                        <li>Low maintenance requirements</li>
                        <li>Long service life reduces total ownership cost</li>
                    </ul>
                </div>
            </div>

            <div>
                <h4 className="text-md font-semibold text-deep-blue-800 mb-2">Service & Long-Term Support</h4>
                <p className="text-slate-600 mb-4">
                    SEA BOSS Aerators are supported with technical guidance, spare parts availability, and service assistance, ensuring smooth operation throughout the product life cycle.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-deep-blue-900 mb-2">Support Includes:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>Installation and usage guidance</li>
                        <li>Availability of genuine spare parts</li>
                        <li>Technical assistance when required</li>
                    </ul>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100">
                <h4 className="text-md font-bold text-deep-blue-900 mb-3">Why Choose SEA BOSS Aerators?</h4>
                <ul className="space-y-2 text-deep-blue-800">
                    <li className="flex gap-2">
                        <span className="text-aqua-600">✓</span> Designed for modern aquaculture needs
                    </li>
                    <li className="flex gap-2">
                        <span className="text-aqua-600">✓</span> Reliable oxygen transfer and circulation
                    </li>
                    <li className="flex gap-2">
                        <span className="text-aqua-600">✓</span> Strong build for long-term pond use
                    </li>
                    <li className="flex gap-2">
                        <span className="text-aqua-600">✓</span> Trusted by aquaculture professionals
                    </li>
                </ul>
            </div>
        </div>
    );

    return (
        <LegalModal
            isOpen={isOpen}
            onClose={onClose}
            title={brand === 'aqualion' ? 'Aqualion Premium' : 'Sea Boss'}
            content={content}
        />
    );
}
