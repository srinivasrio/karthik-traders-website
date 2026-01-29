'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to console for debugging (can be replaced with error reporting service)
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Error Message */}
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Oops! Something went wrong
                </h1>
                <p className="text-slate-600 mb-8">
                    We apologize for the inconvenience. Please try again or go back to the home page.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-aqua-600 text-white font-medium rounded-lg hover:bg-aqua-700 transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Go to Home
                    </Link>
                </div>

                {/* Contact Support */}
                <p className="mt-8 text-sm text-slate-500">
                    Need help?{' '}
                    <a href="tel:+919963840058" className="text-aqua-600 hover:underline">
                        Call us: +91 99638 40058
                    </a>
                </p>
            </div>
        </div>
    );
}
