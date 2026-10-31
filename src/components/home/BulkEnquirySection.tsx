'use client';

import { useState } from 'react';
import { CONTACT_INFO } from '@/data/kt-ui';
import SlideToCall from '@/components/ui/SlideToCall';

export default function BulkEnquirySection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Full name is required';
    if (!/^\d{10}$/.test(formData.phone)) err.phone = 'Enter a valid 10-digit mobile number';
    if (!formData.city.trim()) err.city = 'City/Town is required';
    if (!formData.message.trim()) err.message = 'Please tell us your requirement or quantity';
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
          message: formData.message.trim(),
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

  const resetForm = () => {
    setFormData({ name: '', phone: '', city: '', message: '' });
    setSent(false);
  };

  return (
    <section id="bulk" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 scroll-mt-24">
      <div className="rounded-[36px] bg-[#C4D9FF] p-6 sm:p-10 lg:p-14 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct info & Phone cards */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-[#0B1A33]">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-poppins leading-tight text-[#0B1A33]">
                BULK ORDERS & DEALER PRICING
              </h2>
            </div>

            {/* Slide to Call Button (Bulk Orders) */}
            <div className="pt-1">
              <SlideToCall
                label="Slide to Call Karthik Traders"
                subLabel="+91 86885 66023"
                phone="+918688566023"
              />
            </div>

            {/* Contact Person Cards */}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href="tel:+918688566023"
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white border border-white/60 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#E8F9FF] text-[#0B5C86] font-extrabold text-sm flex items-center justify-center shrink-0">
                    KT
                  </span>
                  <div>
                    <span className="block font-extrabold text-sm text-[#0B1A33]">
                      Karthik (Sales & Bulk Quotes)
                    </span>
                    <span className="text-xs font-mono font-bold text-[#4338CA]">
                      +91 86885 66023
                    </span>
                  </div>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#C4D9FF] text-[#0B1A33] flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform">
                  📞
                </span>
              </a>

              <a
                href="tel:+919177657576"
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white border border-white/60 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#FFF1D6] text-[#8A4B00] font-extrabold text-sm flex items-center justify-center shrink-0">
                    HZ
                  </span>
                  <div>
                    <span className="block font-extrabold text-sm text-[#0B1A33]">
                      Hazarathaiah (Technical & Spares)
                    </span>
                    <span className="text-xs font-mono font-bold text-[#4338CA]">
                      +91 91776 57576
                    </span>
                  </div>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#C4D9FF] text-[#0B1A33] flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform">
                  📞
                </span>
              </a>
            </div>

          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7 bg-[#FBFBFB] text-[#0B1A33] rounded-[28px] p-6 sm:p-9 shadow-xl border border-white">
            {!sent ? (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="mb-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight font-poppins text-[#0B1A33]">
                    Send Bulk Order Enquiry
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5B6880] font-medium">
                    Receive custom pricing & dispatch estimates within 30 minutes.
                  </p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bulk-name" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="bulk-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Reddy"
                    className={`h-12 px-4 rounded-xl border bg-white text-sm font-medium text-[#0B1A33] outline-none transition-colors ${
                      errors.name ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.name && <span className="text-xs font-bold text-[#E5355F]">{errors.name}</span>}
                </div>

                {/* Mobile Phone & City in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bulk-phone" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div
                      className={`flex items-center h-12 px-3 rounded-xl border bg-white transition-colors ${
                        errors.phone ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus-within:border-[#4338CA]'
                      }`}
                    >
                      <span className="font-mono text-sm font-bold text-[#5B6880] pr-2 select-none">
                        +91
                      </span>
                      <input
                        id="bulk-phone"
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
                        className="flex-1 min-w-0 border-0 outline-none bg-transparent font-medium text-sm text-[#0B1A33]"
                      />
                    </div>
                    {errors.phone && <span className="text-xs font-bold text-[#E5355F]">{errors.phone}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="bulk-city" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                      City / Farm Town
                    </label>
                    <input
                      id="bulk-city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Kavali / Bhimavaram"
                      className={`h-12 px-4 rounded-xl border bg-white text-sm font-medium text-[#0B1A33] outline-none transition-colors ${
                        errors.city ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                      }`}
                    />
                    {errors.city && <span className="text-xs font-bold text-[#E5355F]">{errors.city}</span>}
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="bulk-msg" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Requirement Details
                  </label>
                  <textarea
                    id="bulk-msg"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="e.g. 15 × 2HP 4-Paddle Aqualion sets + 30 extra fan blades for March delivery"
                    className={`p-3.5 rounded-xl border bg-white text-sm font-medium text-[#0B1A33] outline-none transition-colors resize-y ${
                      errors.message ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.message && <span className="text-xs font-bold text-[#E5355F]">{errors.message}</span>}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-sm sm:text-base transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Send Inquiry'}
                </button>
              </form>
            ) : (
              <div className="py-12 flex flex-col items-center text-center gap-4 animate-[ktPop_0.4s_ease-out]">
                <span className="w-16 h-16 rounded-2xl bg-[#E3F7EE] text-[#0B7A4B] flex items-center justify-center text-3xl">
                  ✓
                </span>
                <h3 className="text-2xl font-extrabold text-[#0B1A33] font-poppins">
                  Enquiry Received!
                </h3>
                <p className="text-sm sm:text-base text-[#3D4A63] max-w-md leading-relaxed">
                  Thanks, <strong className="text-[#0B1A33]">{formData.name}</strong>. Karthik or Hazarathaiah will call you on <strong className="text-[#0B1A33] font-mono">+91 {formData.phone}</strong> shortly to discuss wholesale rates and dispatch.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 h-11 px-6 rounded-full border border-[#D5DCE8] bg-white text-[#0B1A33] font-bold text-sm hover:bg-[#E8F9FF] transition-colors cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
