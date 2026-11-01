'use client';

import Link from 'next/link';

export default function TermsConditionsPage() {
  const sections = [
    {
      n: '01',
      id: 'products',
      h: 'Products and Specifications',
      ps: [
        'Karthik Traders sells paddle wheel aerator sets, electric motors, speed reduction gearboxes, HDPE floats, fans, and long arm components. Specifications, photos, and component lists on this website accurately describe the items as supplied.',
        'Minor variations in casting colour or finish may occur between manufacturing batches without compromising structural strength or performance.',
      ],
    },
    {
      n: '02',
      id: 'installation',
      h: 'Installation & Electrical Responsibility',
      ps: [
        'Karthik Traders does not provide physical pond field installation. All products include assembly guidelines and wiring specifications.',
        'Customers are solely responsible for hiring qualified electricians and ensuring proper starter relay overload protection, correct voltage supply (3-phase 415V or single-phase 220V), and water submergence before turning equipment on.',
      ],
    },
    {
      n: '03',
      id: 'orders',
      h: 'Orders and Dispatch',
      ps: [
        'An order is formally accepted and logged once confirmed by our sales team via phone or WhatsApp. Orders cannot be cancelled or modified once handed over to transport carriers.',
        'Estimated delivery timelines are shared during dispatch confirmation based on regional transport frequency.',
      ],
    },
    {
      n: '04',
      id: 'pricing',
      h: 'Pricing, Payments & Invoices',
      ps: [
        'Prices are listed in Indian Rupees (₹) showing MRP and discounted factory rates. Listed rates include applicable GST. Official GST tax invoices are generated for every dispatch.',
        'This website does not charge gateway processing fees. Payment terms (NEFT/RTGS, UPI, or cash at counter) are finalized during order confirmation with our sales manager.',
      ],
    },
    {
      n: '05',
      id: 'warranty',
      h: 'Warranty Terms & Conditions',
      ps: [
        'Standard Aerator Sets & Sea Boss: 1 Year Replacement Warranty covering manufacturing defects on motor and gearbox.',
        'Aqualion Aerator Sets: 1 Year Comprehensive Warranty covering manufacturing defects on motor and gearbox.',
        'Warranty does not cover dry runs without water, electrical phase drop without relay starter, unauthorized motor opening, or transport physical breakage.',
      ],
    },
    {
      n: '06',
      id: 'liability',
      h: 'Limitation of Liability & Jurisdiction',
      ps: [
        'To the extent permitted by law, our liability is strictly limited to repair, replacement, or refund of the purchased component.',
        'These terms are governed by the laws of India. Any legal disputes are exclusively subject to the jurisdiction of courts in Nellore, Andhra Pradesh.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      {/* Header Banner */}
      <section className="bg-[#FBFBFB] pt-8 md:pt-14 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880]">
            <Link href="/" className="hover:text-[#0B1A33]">Home</Link>
            <span>/</span>
            <span className="text-[#0B1A33] font-bold">Terms & Conditions</span>
          </nav>
          <span className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase">
            LEGAL POLICIES
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-poppins text-[#0B1A33] max-w-3xl leading-tight">
            Terms & Conditions
          </h1>
          <p className="text-base sm:text-lg text-[#3D4A63] font-medium max-w-2xl leading-relaxed mt-1">
            The rules and terms governing purchases, warranties, and deliveries from Karthik Traders.
          </p>

          {/* Legal Navigation Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/terms-conditions"
              className="h-9 px-4 rounded-full bg-[#0B1A33] text-white font-extrabold text-xs inline-flex items-center shadow-xs"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="h-9 px-4 rounded-full bg-white border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs inline-flex items-center hover:bg-[#E8F9FF] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/refund-policy"
              className="h-9 px-4 rounded-full bg-white border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs inline-flex items-center hover:bg-[#E8F9FF] transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Sticky Section Links */}
          <nav
            aria-label="On this page"
            className="hidden lg:flex lg:col-span-4 sticky top-24 flex-col gap-1 border-l-2 border-[#E3E8F0] pl-4"
          >
            <span className="text-xs font-extrabold tracking-wider text-[#5B6880] uppercase mb-2">
              SECTIONS
            </span>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="py-1.5 text-xs sm:text-sm font-bold text-[#5B6880] hover:text-[#0B1A33] transition-colors"
              >
                {s.n}. {s.h}
              </a>
            ))}
          </nav>

          {/* Right Column: Section Articles */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {sections.map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-24 p-6 sm:p-7 rounded-3xl bg-white border border-[#E3E8F0] shadow-2xs flex flex-col gap-3"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-extrabold text-[#4338CA]">
                    {s.n}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1A33] font-poppins">
                    {s.h}
                  </h2>
                </div>
                {s.ps.map((p, idx) => (
                  <p key={idx} className="text-sm sm:text-base text-[#3D4A63] leading-relaxed font-medium">
                    {p}
                  </p>
                ))}
              </article>
            ))}

            {/* Questions Banner */}
            <div className="p-6 rounded-3xl bg-[#E8F9FF] border border-[#C4D9FF] flex flex-col gap-2 text-sm text-[#0B1A33]">
              <span className="font-extrabold text-base">Questions about these terms?</span>
              <p className="text-xs sm:text-sm text-[#3D4A63] leading-relaxed">
                Contact Karthik on <a href="tel:+918688566023" className="font-bold text-[#4338CA]">+91 86885 66023</a> or Hazarathaiah on <a href="tel:+919177657576" className="font-bold text-[#4338CA]">+91 91776 57576</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
