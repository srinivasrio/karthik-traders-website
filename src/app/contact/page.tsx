'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CONTACT_INFO } from '@/data/kt-ui';

export default function ContactPage() {
  const [topic, setTopic] = useState('Aerator Sets');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const topics = ['Aerator Sets', 'Motors & Gearboxes', 'Spares', 'Dealer Bulk Enquiry'];

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Full name is required';
    if (!/^\d{10}$/.test(formData.phone)) err.phone = 'Enter a valid 10-digit mobile number';
    if (!formData.city.trim()) err.city = 'City/Town is required';
    if (!formData.message.trim()) err.message = 'Please enter your message or query';
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          mobile: formData.phone.trim(),
          location: formData.city.trim(),
          message: `[Topic: ${topic}] ${formData.message.trim()}`,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        alert('Could not submit inquiry right now. Please call us directly.');
      }
    } catch {
      alert('Network issue. Please call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      {/* Header Banner */}
      <section className="bg-[#FBFBFB] pt-8 md:pt-14 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880]">
            <Link href="/" className="hover:text-[#0B1A33]">Home</Link>
            <span>/</span>
            <span className="text-[#0B1A33] font-bold">Contact</span>
          </nav>
          <span className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase">
            CONTACT & STORE DETAILS
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-poppins text-[#0B1A33] max-w-3xl leading-tight">
            Talk to Karthik Traders
          </h1>
          <p className="text-base sm:text-lg text-[#3D4A63] font-medium max-w-2xl leading-relaxed mt-1">
            Call or WhatsApp our team directly, visit the Subedar Pet Nellore store, or submit your inquiry below.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-8">
        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Karthik Card */}
          <div className="rounded-[28px] bg-[#C4D9FF] text-[#0B1A33] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-extrabold tracking-wider text-[#3D4A63] uppercase">
                SALES & BULK ORDERS
              </span>
              <h2 className="text-2xl font-extrabold font-poppins text-[#0B1A33]">
                Karthik
              </h2>
              <span className="font-mono text-lg font-bold text-[#0B1A33]">
                +91 86885 66023
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <a
                href="tel:+918688566023"
                className="flex-1 h-11 rounded-full bg-[#0B1A33] text-white font-extrabold text-xs flex items-center justify-center hover:bg-[#24365A] transition-colors"
              >
                Call
              </a>
              <a
                href="https://wa.me/918688566023?text=Hello%20Karthik%20Traders,%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-full bg-[#128C4A] text-white font-extrabold text-xs flex items-center justify-center hover:bg-[#0E6B39] transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Hazarathaiah Card */}
          <div className="rounded-[28px] bg-[#E8F9FF] text-[#0B1A33] p-6 sm:p-7 flex flex-col justify-between gap-5 border border-[#C4D9FF] shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-extrabold tracking-wider text-[#0B5C86] uppercase">
                TECHNICAL SUPPORT & SPARES
              </span>
              <h2 className="text-2xl font-extrabold font-poppins text-[#0B1A33]">
                Hazarathaiah
              </h2>
              <span className="font-mono text-lg font-bold text-[#0B1A33]">
                +91 91776 57576
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <a
                href="tel:+919177657576"
                className="flex-1 h-11 rounded-full bg-[#0B1A33] text-white font-extrabold text-xs flex items-center justify-center hover:bg-[#24365A] transition-colors"
              >
                Call
              </a>
              <a
                href="https://wa.me/919177657576?text=Hello%20Hazarathaiah%20garu,%20I%20need%20technical%20spares%20support."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-full bg-[#128C4A] text-white font-extrabold text-xs flex items-center justify-center hover:bg-[#0E6B39] transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Email & Social Card */}
          <div className="rounded-[28px] bg-white border border-[#E3E8F0] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-extrabold tracking-wider text-[#5B6880] uppercase">
                EMAIL & SOCIAL
              </span>
              <a
                href="mailto:karthiktrader111@gmail.com"
                className="text-base sm:text-lg font-extrabold text-[#0B1A33] hover:text-[#4338CA] break-all"
              >
                karthiktrader111@gmail.com
              </a>
            </div>
            <div className="flex gap-2 pt-2">
              <a
                href="https://www.instagram.com/karthik_traders_01/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-full border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs flex items-center justify-center hover:bg-[#E8F9FF] transition-colors cursor-pointer"
              >
                Instagram ↗
              </a>
              <a
                href="https://www.facebook.com/share/1E2YvYdWZZ/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-full border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs flex items-center justify-center hover:bg-[#E8F9FF] transition-colors"
              >
                Facebook ↗
              </a>
            </div>
          </div>
        </div>

        {/* 2-Column: Map & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Map */}
          <div className="lg:col-span-6 rounded-[28px] overflow-hidden border border-[#E3E8F0] bg-white shadow-sm flex flex-col">
            <div className="h-80 w-full relative">
              <iframe
                title="Karthik Traders Location Map"
                src="https://maps.google.com/maps?q=Karthik+Traders+Aquaculture+Nellore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                className="w-full h-full border-0"
              />
            </div>
            <div className="p-5 bg-white flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2F8]">
              <p className="text-xs sm:text-sm text-[#3D4A63] leading-relaxed max-w-sm font-medium">
                D.No: 15-2-124, Subedar Pet, Near Vegetable Market, Nellore - 524001, Andhra Pradesh.
              </p>
              <a
                href={CONTACT_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-5 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-xs inline-flex items-center transition-colors"
              >
                Directions ↗
              </a>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-6 rounded-[28px] bg-white border border-[#E3E8F0] p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1A33] font-poppins">
              Send an Enquiry
            </h2>

            {/* Topic Pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`h-8 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    topic === t
                      ? 'bg-[#0B1A33] text-white shadow-xs'
                      : 'bg-[#FBFBFB] border border-[#D5DCE8] text-[#3D4A63] hover:text-[#0B1A33]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label htmlFor="ct-name" className="text-xs font-extrabold text-[#3D4A63] uppercase">
                    Your Name
                  </label>
                  <input
                    id="ct-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className={`h-11 px-3.5 rounded-xl border bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none ${
                      errors.name ? 'border-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.name && <span className="text-xs font-bold text-[#E5355F]">{errors.name}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="ct-phone" className="text-xs font-extrabold text-[#3D4A63] uppercase">
                      Mobile Number
                    </label>
                    <div className="flex items-center h-11 px-3 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB]">
                      <span className="font-mono text-xs font-bold text-[#5B6880] pr-2">+91</span>
                      <input
                        id="ct-phone"
                        type="tel"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        placeholder="98765 43210"
                        className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm font-medium text-[#0B1A33]"
                      />
                    </div>
                    {errors.phone && <span className="text-xs font-bold text-[#E5355F]">{errors.phone}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="ct-city" className="text-xs font-extrabold text-[#3D4A63] uppercase">
                      City / Farm Town
                    </label>
                    <input
                      id="ct-city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Kavali / Bhimavaram"
                      className={`h-11 px-3.5 rounded-xl border bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none ${
                        errors.city ? 'border-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                      }`}
                    />
                    {errors.city && <span className="text-xs font-bold text-[#E5355F]">{errors.city}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="ct-msg" className="text-xs font-extrabold text-[#3D4A63] uppercase">
                    Message
                  </label>
                  <textarea
                    id="ct-msg"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your requirements..."
                    className={`p-3 rounded-xl border bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none resize-y ${
                      errors.message ? 'border-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.message && <span className="text-xs font-bold text-[#E5355F]">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 h-12 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            ) : (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-[#E3F7EE] text-[#0B7A4B] flex items-center justify-center text-2xl font-bold">
                  ✓
                </span>
                <h3 className="text-xl font-extrabold text-[#0B1A33] font-poppins">
                  Enquiry Received
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6880] max-w-sm">
                  Thanks, {formData.name}. Karthik or Hazarathaiah will call +91 {formData.phone} shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setFormData({ name: '', phone: '', city: '', message: '' });
                  }}
                  className="mt-2 text-xs font-bold text-[#4338CA] underline cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
