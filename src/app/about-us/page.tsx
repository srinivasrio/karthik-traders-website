'use client';

import { useRouter } from 'next/navigation';

export default function AboutUsPage() {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Spacer to account for fixed header */}
            <div className="h-16 md:h-20" />

            <div className="container-custom py-8 pb-24">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-aqua-600 hover:text-aqua-800 mb-6 font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <h1 className="text-3xl font-bold mb-8 text-deep-blue-900">About Us</h1>
                <div className="prose max-w-none text-slate-700 space-y-6">
                    <p>
                        Karthik Traders is a well-established and trusted name in the aquaculture industry, with over 10 years of experience in supplying high-quality aquaculture aerators and spare parts.
                    </p>
                    <p>
                        Based in Nellore, Andhra Pradesh, we proudly serve fish and shrimp farmers by providing reliable, efficient, and performance-driven aeration solutions that support healthy pond ecosystems and improved productivity.
                    </p>
                    <h2 className="text-xl font-bold text-deep-blue-800">Our Expertise</h2>
                    <p>
                        We specialize in premium &amp; budget aeration brands such as AQUA LION Aerators and SEA BOSS Aerators, known for their durability, strong water circulation, and consistent oxygen transfer. Every product we offer is selected with a focus on quality, long service life, and real-world farm performance.
                    </p>
                    <h2 className="text-xl font-bold text-deep-blue-800">Our Promise</h2>
                    <p>
                        At Karthik Traders, we believe in building strong relationships through transparent dealings, fair pricing, and dependable after-sales support. Our deep understanding of aquaculture requirements allows us to guide customers in choosing the right equipment for their specific pond conditions.
                    </p>
                    <p className="font-semibold">
                        With a commitment to quality and customer satisfaction, Karthik Traders continues to be a reliable partner for sustainable and successful aquaculture operations.
                    </p>
                </div>
            </div>
        </div>
    );
}
