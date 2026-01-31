'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import { supabase } from '@/lib/supabase';

export default function ContactForm() {
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');
        setErrorMessage('');

        const form = e.target as HTMLFormElement;
        const formData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            mobile: (form.elements.namedItem('phone') as HTMLInputElement).value,
            location: (form.elements.namedItem('location') as HTMLInputElement).value,
            message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
            status: 'new'
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit enquiry');
            }

            setFormStatus('success');
            // Reset form
            form.reset();
            // Reset status after delay if desired, or keep success message visible
            setTimeout(() => setFormStatus('idle'), 5000);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            setFormStatus('error');
            setErrorMessage(error.message || 'Failed to submit. Please try again.');
        }
    };

    return (
        <section id="contact" className="py-16 bg-steel-50 border-t border-steel-100">
            <div className="container-custom px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-2xl md:text-3xl font-bold text-deep-blue-900 mb-3"
                        >
                            📞 Content Us / Bulk Orders
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-steel-600"
                        >
                            Looking for bulk quantities or have a specific requirement? We're here to help.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-steel-100"
                    >
                        {formStatus === 'success' ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <h3 className="text-xl font-bold text-deep-blue-900 mb-2">Message Sent!</h3>
                                <p className="text-steel-600">We'll get back to you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6" suppressHydrationWarning>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-bold !text-black mb-1">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            suppressHydrationWarning
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-black focus:border-aqua-500 focus:ring-2 focus:ring-aqua-200 outline-none transition-all font-medium placeholder:text-gray-500 text-black"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-bold !text-black mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            required
                                            suppressHydrationWarning
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-black focus:border-aqua-500 focus:ring-2 focus:ring-aqua-200 outline-none transition-all font-medium placeholder:text-gray-500 text-black"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="location" className="block text-sm font-bold !text-black mb-1">Location / Town</label>
                                        <input
                                            type="text"
                                            id="location"
                                            suppressHydrationWarning
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-black focus:border-aqua-500 focus:ring-2 focus:ring-aqua-200 outline-none transition-all font-medium placeholder:text-gray-500 text-black"
                                            placeholder="Nellore, AP"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col h-full">
                                    <label htmlFor="message" className="block text-sm font-bold !text-black mb-1">Message / Requirement</label>
                                    <textarea
                                        id="message"
                                        rows={6}
                                        required
                                        suppressHydrationWarning
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-black focus:border-aqua-500 focus:ring-2 focus:ring-aqua-200 outline-none transition-all font-medium resize-none flex-1 placeholder:text-gray-500 text-black"
                                        placeholder="I am interested in..."
                                    ></textarea>

                                    <button
                                        type="submit"
                                        disabled={formStatus === 'submitting'}
                                        className="mt-6 w-full py-3.5 px-6 rounded-xl bg-deep-blue-900 text-white font-bold shadow-lg shadow-deep-blue-900/20 hover:bg-deep-blue-800 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {formStatus === 'submitting' ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀</span> Send Enquiry
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                        {formStatus === 'error' && (
                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-center font-bold">
                                {errorMessage}
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Contacts */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="tel:+919963840058" className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white border border-steel-100 shadow-sm hover:border-aqua-200 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-aqua-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                📞
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-steel-500 font-bold uppercase tracking-wider">Karthik</p>
                                <p className="text-deep-blue-900 font-bold font-mono">+91 99638 40058</p>
                            </div>
                        </a>
                        <a href="tel:+919177657576" className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white border border-steel-100 shadow-sm hover:border-green-200 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                📱
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-steel-500 font-bold uppercase tracking-wider">Hazarathaiah</p>
                                <p className="text-deep-blue-900 font-bold font-mono">+91 91776 57576</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
