'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
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

                <h1 className="text-3xl font-bold mb-8 text-deep-blue-900">Privacy Policy</h1>
                <div className="prose max-w-none text-slate-700 space-y-6">
                    <p>
                        At Karthik Traders, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you interact with our business, website, or services. By using our services, you agree to the terms of this policy.
                    </p>

                    <h2 className="text-xl font-bold text-deep-blue-800">1. Information We Collect</h2>
                    <p>When you contact or purchase from Karthik Traders, we may collect the following information:</p>
                    <ul className="list-disc pl-5">
                        <li><strong>Personal Information:</strong> Name, phone number, email address, delivery address, and payment details.</li>
                        <li><strong>Order Information:</strong> Products purchased, order date, order status, and transaction details.</li>
                        <li><strong>Communication Information:</strong> Messages sent via WhatsApp, email, or phone calls for order or service support.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">2. How We Use Your Information</h2>
                    <p>Your personal information is used for the following purposes:</p>
                    <ul className="list-disc pl-5">
                        <li>To process and fulfill orders, including delivery and payment.</li>
                        <li>To respond to inquiries and provide customer support.</li>
                        <li>To send updates about products, promotions, or offers, only if you agree to receive them.</li>
                        <li>To improve our services and business operations.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">3. Information Sharing</h2>
                    <ul className="list-disc pl-5">
                        <li>We do not sell your personal information to third parties.</li>
                        <li>Information may be shared with delivery partners or payment service providers only to complete your order.</li>
                        <li>We may disclose information if required by law or to protect the rights and safety of Karthik Traders or its customers.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">4. Data Security</h2>
                    <ul className="list-disc pl-5">
                        <li>We take reasonable measures to protect your personal information from unauthorized access, disclosure, or misuse.</li>
                        <li>All payment and transaction details are handled securely and are not stored longer than necessary.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">5. Cookies and Tracking</h2>
                    <ul className="list-disc pl-5">
                        <li>Our website may use cookies or similar technologies to enhance your browsing experience.</li>
                        <li>Cookies help us analyze traffic, remember preferences, and improve services.</li>
                        <li>You can choose to disable cookies in your browser, but some features may not function properly.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">6. Your Rights</h2>
                    <ul className="list-disc pl-5">
                        <li>You have the right to access, update, or delete your personal information by contacting us.</li>
                        <li>You can opt-out of marketing communications at any time by contacting us via WhatsApp, phone, or email.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">7. Children&apos;s Privacy</h2>
                    <ul className="list-disc pl-5">
                        <li>Our services are not intended for children under 18.</li>
                        <li>We do not knowingly collect information from children.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">8. Changes to This Policy</h2>
                    <p>
                        Karthik Traders may update this Privacy Policy from time to time.
                        Any changes will be posted on our website or communicated to customers via WhatsApp or email.
                        Continued use of our services after updates constitutes acceptance of the updated policy.
                    </p>

                    <h2 className="text-xl font-bold text-deep-blue-800">9. Contact Us</h2>
                    <p>For any questions or concerns regarding this Privacy Policy, you can contact us:</p>
                    <p>WhatsApp / Phone: 9963840058</p>
                    <p>Email: karthiktrader111@gmail.com</p>
                    <p className="font-semibold mt-4">Note: By using Karthik Traders&apos; services, you agree to the collection and use of your information as described in this Privacy Policy.</p>
                </div>
            </div>
        </div>
    );
}
