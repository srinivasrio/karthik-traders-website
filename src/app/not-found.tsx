import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center">
                {/* 404 Icon */}
                <div className="mx-auto w-20 h-20 bg-aqua-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl font-bold text-aqua-600">404</span>
                </div>

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Page Not Found
                </h1>
                <p className="text-slate-600 mb-8">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-aqua-600 text-white font-medium rounded-lg hover:bg-aqua-700 transition-colors"
                    >
                        Go to Home
                    </Link>
                    <Link
                        href="/contact"
                        className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Contact Us
                    </Link>
                </div>

                {/* Help Links */}
                <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
                    <Link href="/aerator-sets" className="text-aqua-600 hover:underline">
                        Aerator Sets
                    </Link>
                    <Link href="/products" className="text-aqua-600 hover:underline">
                        Products
                    </Link>
                    <Link href="/spares" className="text-aqua-600 hover:underline">
                        Spare Parts
                    </Link>
                </div>
            </div>
        </div>
    );
}
