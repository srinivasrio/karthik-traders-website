'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      n: '01',
      id: 'collection',
      h: 'Data We Collect',
      ps: [
        'We collect customer name, mobile phone number, delivery farm address, and order records when you request quotes or place orders.',
        'If you register an account, we also store your village, district, state, and farming preference (e.g. shrimp or fish culture) to tailor recommendations.',
      ],
    },
    {
      n: '02',
      id: 'usage',
      h: 'How We Use Your Data',
      ps: [
        'To fulfill equipment orders, dispatch goods via regional freight lines, issue tax invoices, and provide instant WhatsApp dispatch tracking updates.',
        'We do not engage in automated marketing spam. You only receive operational communication directly related to your farm inquiries and orders.',
      ],
    },
    {
      n: '03',
      id: 'sharing',
      h: 'Data Sharing & Zero Selling Guarantee',
      ps: [
        'We share delivery details strictly with designated logistics and transport drivers to ensure your aerators reach your farm pond safely.',
        'Your contact and farm details are never sold, traded, or rented to any third-party marketing brokers.',
      ],
    },
    {
      n: '04',
      id: 'security',
      h: 'Account Security & Cookies',
      ps: [
        'User accounts are safeguarded with phone OTP verification and encrypted passwords on Supabase. Access to billing records is strictly restricted to authorized staff.',
        'We use minimal local storage in your browser solely to remember your shopping cart and model comparison selections across sessions.',
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
            <span className="text-[#0B1A33] font-bold">Privacy Policy</span>
          </nav>
          <span className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase">
            LEGAL POLICIES
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-poppins text-[#0B1A33] max-w-3xl leading-tight">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-[#3D4A63] font-medium max-w-2xl leading-relaxed mt-1">
            What customer information we collect, why we need it, and how your data is protected.
          </p>

          {/* Legal Navigation Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/terms-conditions"
              className="h-9 px-4 rounded-full bg-white border border-[#D5DCE8] text-[#0B1A33] font-bold text-xs inline-flex items-center hover:bg-[#E8F9FF] transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="h-9 px-4 rounded-full bg-[#0B1A33] text-white font-extrabold text-xs inline-flex items-center shadow-xs"
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

            <div className="p-6 rounded-3xl bg-[#E8F9FF] border border-[#C4D9FF] flex flex-col gap-2 text-sm text-[#0B1A33]">
              <span className="font-extrabold text-base">Privacy or Data Queries?</span>
              <p className="text-xs sm:text-sm text-[#3D4A63] leading-relaxed">
                Reach us at <a href="mailto:karthiktrader111@gmail.com" className="font-bold text-[#4338CA]">karthiktrader111@gmail.com</a> or call <a href="tel:+918688566023" className="font-bold text-[#4338CA]">+91 86885 66023</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
