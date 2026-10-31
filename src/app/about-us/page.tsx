'use client';

import Link from 'next/link';

export default function AboutUsPage() {
  const values = [
    {
      n: '01',
      t: '100% Genuine OEM Components',
      b: 'Every motor, gearbox, impeller fan, and float is factory-inspected. No imitation castings or substandard copper windings.',
      bg: '#E8F9FF',
    },
    {
      n: '02',
      t: 'Ready Warehouse Inventory in Nellore',
      b: 'Over 40 product variants stocked directly at Subedar Pet for immediate same-day farm dispatch across Andhra Pradesh.',
      bg: '#FAF8FF',
    },
    {
      n: '03',
      t: 'Direct Transparent Wholesale Rates',
      b: 'Honest pricing with no hidden broker markups. Full GST invoices provided with every single order.',
      bg: '#EDFDF5',
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
            <span className="text-[#0B1A33] font-bold">About Us</span>
          </nav>
          <span className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase">
            ABOUT KARTHIK TRADERS
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-poppins text-[#0B1A33] max-w-3xl leading-tight">
            Aerators and spares, sold by people who understand aquaculture.
          </h1>
          <p className="text-base sm:text-lg text-[#3D4A63] font-medium max-w-2xl leading-relaxed mt-1">
            A trusted Nellore wholesale and distribution hub for aquaculture aerators, heavy-duty motors, and genuine replacement spares since 2018.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-12 sm:gap-20">
        {/* Intro 2-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          <div className="md:col-span-5 relative aspect-[5/4] rounded-[32px] overflow-hidden bg-[#C4D9FF] border border-[#C4D9FF] shadow-sm flex items-center justify-center p-6">
            <img
              src="/assets/logo-trim.png"
              alt="Karthik Traders Nellore"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <div className="md:col-span-7 flex flex-col gap-4 text-sm sm:text-base text-[#3D4A63] leading-relaxed font-medium">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1A33] font-poppins tracking-tight leading-tight">
              From Subedar Pet to shrimp farms across India
            </h2>
            <p>
              Karthik Traders is an aquaculture aerators and spare parts distribution business based in the heart of Nellore, Andhra Pradesh. We supply complete paddle wheel aerator units, 3-phase and single-phase motors, bevel and worm gearboxes, virgin HDPE floats, and long arm systems to shrimp and fish farmers across coastal AP, Telangana, Tamil Nadu, and Odisha.
            </p>
            <p>
              Sales, bulk orders, and dealership pricing are managed directly by <strong>Karthik (+91 86885 66023)</strong>. Technical support, sizing advice, and warehouse spares are managed by <strong>Hazarathaiah (+91 91776 57576)</strong>.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="px-4 py-2 rounded-xl bg-white border border-[#D5DCE8] text-xs font-extrabold text-[#0B1A33]">
                ★ 10+ Years Regional Aquaculture Expertise
              </span>
              <span className="px-4 py-2 rounded-xl bg-white border border-[#D5DCE8] text-xs font-extrabold text-[#0B1A33]">
                ✓ Pan-India Transport Dispatched Daily
              </span>
            </div>
          </div>
        </div>

        {/* 3 Core Values */}
        <div>
          <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase mb-2">
            OUR COMMITMENTS
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins mb-6">
            Why Farmers Keep Coming Back
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {values.map((v) => (
              <div
                key={v.n}
                className="rounded-[24px] p-6 sm:p-7 flex flex-col gap-3 border border-black/5 shadow-2xs"
                style={{ backgroundColor: v.bg }}
              >
                <span className="font-mono text-xs font-extrabold text-[#4338CA]">
                  {v.n}
                </span>
                <h3 className="text-xl font-extrabold text-[#0B1A33] font-poppins">
                  {v.t}
                </h3>
                <p className="text-xs sm:text-sm text-[#3D4A63] font-medium leading-relaxed">
                  {v.b}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Two Brand Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-[28px] bg-[#FFF1D6] border border-[#FFDFB0] p-7 flex flex-col gap-3">
            <img
              src="/uploads/aqualion-logo.svg"
              alt="Aqualion"
              className="w-36 h-10 object-contain object-left mb-1"
            />
            <h3 className="text-2xl font-extrabold text-[#8A4B00] font-poppins">
              Aqualion · Premium Aeration
            </h3>
            <p className="text-sm text-[#5C3A00] leading-relaxed font-medium">
              High-efficiency copper-wound motors, precision Bevel A3 gearboxes, and SS 304 CR frames. Flagship model Aqualion PR 20 B carries our industry-exclusive Double Warranty.
            </p>
            <Link
              href="/aerator-sets?brand=aqualion"
              className="mt-2 text-xs font-extrabold text-[#8A4B00] underline"
            >
              Shop Aqualion Aerators →
            </Link>
          </div>

          <div className="rounded-[28px] bg-[#DDF3FF] border border-[#C4D9FF] p-7 flex flex-col gap-3">
            <img
              src="/assets/seaboss-trim.png"
              alt="Sea Boss"
              className="w-36 h-10 object-contain object-left mb-1"
            />
            <h3 className="text-2xl font-extrabold text-[#0B5C86] font-poppins">
              Sea Boss · High Performance
            </h3>
            <p className="text-sm text-[#084466] leading-relaxed font-medium">
              Rugged 2HP 4-Paddle and 3HP 6-Paddle aerator configurations engineered for continuous 24/7 duty in deep ponds, backed by a 1 Year Full Replacement Warranty.
            </p>
            <Link
              href="/aerator-sets?brand=seaboss"
              className="mt-2 text-xs font-extrabold text-[#0B5C86] underline"
            >
              Shop Sea Boss Aerators →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
