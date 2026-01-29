'use client';

import { useRouter } from 'next/navigation';

export default function TermsConditionsPage() {
    const router = useRouter();

    const handleBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Fallback to homepage
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

                <h1 className="text-3xl font-bold mb-8 text-deep-blue-900">Terms &amp; Conditions</h1>
                <div className="prose max-w-none text-slate-700 space-y-6">
                    <p>
                        Welcome to Karthik Traders. By purchasing products or using our services, you agree to the following Terms &amp; Conditions. Please read them carefully.
                    </p>

                    <h2 className="text-xl font-bold text-deep-blue-800">1. Products and Services</h2>
                    <ul className="list-disc pl-5">
                        <li>Karthik Traders sells aquaculture aerators, paddle wheel aerators, and related spare parts.</li>
                        <li>All products are sold as-is, with specifications and details provided at the time of purchase.</li>
                        <li>We do not provide installation services. Customers are responsible for self-installation or hiring a professional.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">2. Orders</h2>
                    <ul className="list-disc pl-5">
                        <li>Orders can be placed via WhatsApp, phone, website, or in person.</li>
                        <li>Once an order is placed, it cannot be modified after dispatch.</li>
                        <li>We reserve the right to accept or reject any order for any reason, including product availability.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">3. Pricing and Payment</h2>
                    <ul className="list-disc pl-5">
                        <li>Prices are as displayed at the time of purchase and are subject to change without prior notice.</li>
                        <li>Payments must be completed via accepted payment methods before order processing.</li>
                        <li>Any applicable taxes, shipping, or handling charges are to be borne by the customer.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">4. Delivery</h2>
                    <ul className="list-disc pl-5">
                        <li>Delivery timelines are estimates and may vary depending on location and availability.</li>
                        <li>Karthik Traders is not responsible for delays caused by third-party shipping services, weather, or unforeseen circumstances.</li>
                        <li>Customers are responsible for providing accurate delivery details.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">5. Refund and Cancellation</h2>
                    <ul className="list-disc pl-5">
                        <li><strong>Order Cancellation:</strong> Orders can be cancelled within 24 hours of purchase. After 24 hours, cancellations will not be accepted.</li>
                        <li><strong>Refunds:</strong> Refunds are issued only after receiving the returned product in original, unused condition.</li>
                        <li><strong>Non-Refundable Items:</strong> Customized products or spare parts cannot be refunded once dispatched.</li>
                        <li><strong>Shipping Charges:</strong> Shipping and handling charges are non-refundable.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">6. Warranty and Repairs</h2>
                    <ul className="list-disc pl-5">
                        <li>Karthik Traders provides warranty on products as specified at the time of purchase.</li>
                        <li>Warranty covers manufacturing defects only and does not cover damages due to misuse, improper installation, or external factors.</li>
                        <li>Repairs under warranty will be free of labor charges, but spare parts replacement may incur a cost.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">7. Limitation of Liability</h2>
                    <ul className="list-disc pl-5">
                        <li>Karthik Traders is not liable for any indirect, incidental, or consequential damages arising from the use of our products.</li>
                        <li>Customers use the products at their own risk and are responsible for proper installation and maintenance.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">8. Intellectual Property</h2>
                    <ul className="list-disc pl-5">
                        <li>All logos, designs, and content of Karthik Traders are our intellectual property.</li>
                        <li>Unauthorized use of our brand, logos, or content is strictly prohibited.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">9. Privacy</h2>
                    <ul className="list-disc pl-5">
                        <li>Customer information is collected and used only for order processing and communication.</li>
                        <li>We do not sell customer information to third parties.</li>
                        <li>For more details, see our Privacy Policy.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">10. Governing Law</h2>
                    <ul className="list-disc pl-5">
                        <li>These Terms &amp; Conditions are governed by the laws of India.</li>
                        <li>Any disputes arising from transactions with Karthik Traders will be subject to the jurisdiction of local courts where the business operates.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">11. Contact Information</h2>
                    <p>For queries or concerns regarding our Terms &amp; Conditions:</p>
                    <p>WhatsApp / Phone: 9963840058, 9177657576</p>
                    <p>Email: karthiktrader111@gmail.com</p>
                    <p className="font-semibold mt-4">Note: By placing an order with Karthik Traders, you acknowledge and agree to these Terms &amp; Conditions.</p>
                </div>
            </div>
        </div>
    );
}
