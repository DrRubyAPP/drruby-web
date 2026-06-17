import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeCaptureForm from "@/components/forms/HomeCaptureForm";
import PageSwitcher from "@/components/common/PageSwitcher";

export default function Home() {
  return (
    <>
      <PageSwitcher />
      <Navbar variant="home" />

      {/* HERO */}
      <div className="bg-[radial-gradient(ellipse_at_60%_0%,#fce8eb_0%,#f5f5f5_65%)] min-h-screen flex items-center">
        <div className="max-w-[1100px] mx-auto py-20 px-5 md:px-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-dr-red-lt border border-[#f5b8c0] text-[#a00015] text-[13px] font-medium py-[7px] px-4 rounded-[20px] mb-8">
            <span className="text-dr-red text-[8px]">&#9679;</span>
            Early Access — Limited Spots
          </div>

          <h1 className="text-[clamp(40px,5vw,68px)] font-bold tracking-[-2px] leading-[1.05] text-dr-black mb-5 max-w-[800px]">
            Something is changing.<br />
            <em className="not-italic text-dr-red">Understand it.</em>
          </h1>

          <p className="text-[19px] text-[#555] mb-14 leading-relaxed max-w-[580px]">
            DrRuby is a women&apos;s healthspan intelligence platform. We enter through skin — and connect it to everything else that&apos;s shifting in your body. Tell us where you&apos;re feeling it most.
          </p>

          {/* PATH CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[880px] mb-12">
            <Link href="/skin" className="bg-white border-2 border-dr-border rounded-[20px] py-9 px-8 no-underline text-inherit flex flex-col text-left hover:border-dr-red hover:shadow-[0_8px_40px_rgba(208,2,27,0.1)] hover:-translate-y-0.5 transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-dr-red opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[13px] font-bold tracking-[1.5px] uppercase text-dr-red mb-4">
                Path 01 &middot; Skin
              </div>
              <h2 className="text-[clamp(20px,2vw,26px)] font-bold tracking-tight leading-[1.2] text-dr-black mb-3.5">
                &ldquo;My skin changed and I don&apos;t know <em className="italic text-dr-red">why.</em>&rdquo;
              </h2>
              <p className="text-[15px] text-[#666] leading-relaxed mb-6 flex-1">
                Inflammation, melasma, skin that aged faster than expected. DrRuby tracks three imaging biomarkers so you stop guessing and start seeing what&apos;s actually happening.
              </p>
              <div className="flex flex-wrap gap-[7px] mb-7">
                {["Inflammation", "Melasma", "Hormonal skin", "Product efficacy"].map((t) => (
                  <span key={t} className="text-xs font-medium bg-dr-off border border-dr-border py-1 px-3 rounded-[20px] text-[#555]">{t}</span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-dr-red py-3 px-[22px] rounded-lg self-start">
                I have skin concerns &rarr;
              </span>
            </Link>

            <Link href="/healthspan" className="bg-white border-2 border-dr-border rounded-[20px] py-9 px-8 no-underline text-inherit flex flex-col text-left hover:border-dr-red hover:shadow-[0_8px_40px_rgba(208,2,27,0.1)] hover:-translate-y-0.5 transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-dr-red opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[13px] font-bold tracking-[1.5px] uppercase text-dr-red mb-4">
                Path 02 &middot; Healthspan
              </div>
              <h2 className="text-[clamp(20px,2vw,26px)] font-bold tracking-tight leading-[1.2] text-dr-black mb-3.5">
                &ldquo;My body isn&apos;t keeping up with my <em className="italic text-dr-red">life.</em>&rdquo;
              </h2>
              <p className="text-[15px] text-[#666] leading-relaxed mb-6 flex-1">
                Energy, sleep, recovery, hormones. Something shifted in the last few years and you can&apos;t quite name it. That&apos;s exactly what DrRuby is built for.
              </p>
              <div className="flex flex-wrap gap-[7px] mb-7">
                {["Sleep & recovery", "Energy", "Perimenopause", "Hormonal resilience"].map((t) => (
                  <span key={t} className="text-xs font-medium bg-dr-off border border-dr-border py-1 px-3 rounded-[20px] text-[#555]">{t}</span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-dr-red py-3 px-[22px] rounded-lg self-start">
                I want better healthspan &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* CAPTURE */}
      <section className="bg-dr-black py-20 px-5 md:px-10" id="join-home">
        <HomeCaptureForm />
      </section>

      {/* PHILOSOPHY */}
      <section className="bg-dr-black py-20 px-5 md:px-10">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red-mid mb-3">
            What We Believe
          </div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight leading-tight text-white mb-3.5">
            Built for life goals.<br />Not lab dashboards.
          </h2>
          <p className="text-[17px] text-[#aaa] max-w-[560px] leading-relaxed mb-12">
            Every other healthspan tool rewards you for checking in more, tracking more. We don&apos;t. We want you to close the app and go live your life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl py-7 px-6">
              <span className="text-[28px] mb-4 block">&#127919;</span>
              <div className="text-[17px] font-bold text-white mb-2.5">Goals, not metrics</div>
              <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                We don&apos;t ask what you want to optimize. We ask what you want to do that your body isn&apos;t letting you.
              </p>
              <div className="text-sm italic text-dr-red-mid leading-relaxed">
                &ldquo;Hike with my grandkids.&rdquo; &ldquo;No more hot flashes at 2am.&rdquo; &ldquo;Finish the day I planned.&rdquo;
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-7 px-6">
              <span className="text-[28px] mb-4 block">&#128246;</span>
              <div className="text-[17px] font-bold text-white mb-2.5">We want you to close the app</div>
              <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                Every month we ask: is this tracking helping you reach your goal, or has it become the goal?
              </p>
              <div className="text-sm italic text-dr-red-mid leading-relaxed">
                &ldquo;Actually closed the app. Went outside. Felt like a win.&rdquo;
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-7 px-6">
              <span className="text-[28px] mb-4 block">&#128300;</span>
              <div className="text-[17px] font-bold text-white mb-2.5">Science you can name</div>
              <p className="text-sm text-[#bbb] leading-relaxed mb-3">
                Led by Charles Brenner, PhD — world&apos;s leading NAD+ researcher. Every claim traceable to published research.
              </p>
              <div className="text-sm italic text-dr-red-mid leading-relaxed">
                &ldquo;Reliable numbers, not great experiences with unreliable data.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-white py-20 px-5 md:px-10 border-t border-dr-border">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
              Scientific Foundation
            </div>
            <h2 className="text-[clamp(24px,3vw,38px)] font-bold tracking-tight leading-[1.2] text-dr-black mb-3.5">
              No other consumer healthspan app has <em className="italic text-dr-red">this.</em>
            </h2>
            <p className="text-base text-[#666] leading-relaxed max-w-[400px]">
              Charles Brenner is the researcher who discovered NR as vitamin B3 — his work is the foundation of NAD+ biology. He&apos;s not an advisor. He&apos;s co-building this with us.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 flex-shrink-0">
            <div className="bg-dr-off border border-dr-border border-l-4 border-l-dr-red rounded-[10px] py-5 px-6 min-w-[220px]">
              <div className="text-[28px] font-bold tracking-tight text-dr-red leading-none mb-1">NAD+</div>
              <div className="text-[13px] text-dr-muted leading-relaxed">Charles Brenner, PhD<br />Biochemist &middot; NAD+ Biology Pioneer</div>
            </div>
            <div className="bg-dr-off border border-dr-border border-l-4 border-l-dr-red rounded-[10px] py-5 px-6 min-w-[220px]">
              <div className="text-[28px] font-bold tracking-tight text-dr-red leading-none mb-1">N=1</div>
              <div className="text-[13px] text-dr-muted leading-relaxed">Evidence-based<br />user experiments</div>
            </div>
            <div className="bg-dr-off border border-dr-border border-l-4 border-l-dr-red rounded-[10px] py-5 px-6 min-w-[220px]">
              <div className="text-[28px] font-bold tracking-tight text-dr-red leading-none mb-1">Live</div>
              <div className="text-[13px] text-dr-muted leading-relaxed">Clinic partnerships<br />already active</div>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="home" />
    </>
  );
}
