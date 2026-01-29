'use client';

import { useRouter } from 'next/navigation';

export default function RefundPolicyPage() {
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

                <h1 className="text-3xl font-bold mb-8 text-deep-blue-900">Refund &amp; Cancellation Policy</h1>
                <div className="prose max-w-none text-slate-700 space-y-6">
                    <p>
                        At Karthik Traders, we value our customers and strive to provide high-quality aquaculture aerators and spare parts.
                        Please read our refund and cancellation policy carefully before placing your order. By purchasing from us, you agree to these terms.
                    </p>

                    <h2 className="text-xl font-bold text-deep-blue-800">1. Order Cancellation</h2>
                    <ul className="list-disc pl-5">
                        <li>Customers can request cancellation of their order within 24 hours of placing the order.</li>
                        <li>Cancellation requests made after 24 hours will not be accepted, as the product may already be packed or dispatched.</li>
                        <li>To request a cancellation, please contact our sales team via WhatsApp, phone, or email with your order number and details.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">2. Refund Policy</h2>
                    <ul className="list-disc pl-5">
                        <li>Refunds are processed only after we receive the returned product in its original, unused, and undamaged condition.</li>
                        <li>Shipping and handling charges are non-refundable.</li>
                        <li>Refund processing may take 5–7 business days from the date the returned product is received and inspected.</li>
                        <li>Customized products or spare parts cannot be refunded once they are dispatched, as these are made specifically for your order.</li>
                        <li>We reserve the right to deny a refund if the product is returned damaged, used, or missing parts.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">3. Replacement &amp; Defective Items</h2>
                    <ul className="list-disc pl-5">
                        <li>If a product is received with manufacturing defects or damages, Karthik Traders will replace it free of cost.</li>
                        <li>Customers must report defects within 3 days of receiving the product.</li>
                        <li>The replacement process will be initiated after verification of the defect by our team.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">4. No Installation Policy</h2>
                    <ul className="list-disc pl-5">
                        <li>Karthik Traders does not provide installation services for any of our products, including aerators and spare parts.</li>
                        <li>All products are sold as-is, with detailed user manuals and installation instructions provided.</li>
                        <li>Customers are advised to carefully follow the provided instructions or hire a professional for installation.</li>
                        <li>We are not responsible for any issues arising due to incorrect installation by the customer.</li>
                    </ul>

                    <h2 className="text-xl font-bold text-deep-blue-800">5. Contact Information</h2>
                    <p>For cancellations, refunds, or product queries, please contact us:</p>
                    <p>WhatsApp / Phone: 9963840058</p>
                    <p>Email: karthiktrader111@gmail.com</p>
                    <p className="font-semibold mt-4">Note: By placing an order with Karthik Traders, you acknowledge and agree to this Refund &amp; Cancellation Policy.</p>
                </div>
            </div>
        </div>
    );
}
