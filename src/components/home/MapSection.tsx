'use client';

import { motion } from 'framer-motion';

export default function MapSection() {
    return (
        <section id="address" className="py-16 bg-gradient-to-b from-white to-steel-50 border-t border-steel-50">
            <div className="container-custom px-4">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl md:text-3xl font-bold text-deep-blue-900 mb-2"
                    >
                        📍 Our Location
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-steel-600 text-sm md:text-base"
                    >
                        Visit our store or get directions using Google Maps.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
                    {/* Map Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white bg-white relative"
                    >
                        <iframe
                            src="https://maps.google.com/maps?q=Karthik+Traders+Aquaculture+Nellore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            title="Karthik Traders Location"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="absolute inset-0 w-full h-full"
                        ></iframe>
                    </motion.div>

                    {/* Business Info Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col gap-6"
                    >
                        <div className="bg-white p-6 rounded-2xl border border-steel-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-aqua-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <h3 className="text-2xl font-bold text-deep-blue-900 mb-2 relative z-10">Karthik Traders</h3>
                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-green-600 tracking-wide uppercase">Verified on Google</span>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl mt-0.5">🏢</span>
                                    <p className="text-steel-600 leading-relaxed text-sm md:text-base">
                                        Opp. Madhura Sweets Line, Near MRF Tyres Line,<br />
                                        Subedar Pet,<br />
                                        Nellore, Andhra Pradesh 524001
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">📞</span>
                                    <p className="text-deep-blue-900 font-bold font-mono">+91 99638 40058</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.a
                                whileTap={{ scale: 0.98 }}
                                href="https://www.google.com/maps/dir/?api=1&destination=Karthik+Traders+Nellore"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-deep-blue-900 text-white font-bold shadow-lg shadow-deep-blue-900/20 hover:bg-deep-blue-800 transition-colors"
                            >
                                <span>📍</span> Get Directions
                            </motion.a>

                            <motion.a
                                whileTap={{ scale: 0.98 }}
                                href="https://maps.google.com/?cid=9627797746816489841"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-white border border-steel-200 text-deep-blue-900 font-bold hover:bg-steel-50 hover:border-steel-300 transition-colors shadow-sm"
                            >
                                <span>🗺️</span> View on Maps
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
