import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaitlistForm from "@/components/WaitlistForm";
import PageSwitcher from "@/components/PageSwitcher";

export default function HealthspanPage() {
  return (
    <>
      <PageSwitcher />
      <Navbar variant="sub" />

      {/* SUB-HERO */}
      <div className="bg-[radial-gradient(ellipse_at_30%_0%,#fce8eb_0%,#f5f5f5_65%)] min-h-[80vh] flex items-center">
        <div className="max-w-[1100px] mx-auto py-20 px-5 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-dr-red-lt border border-[#f5b8c0] text-[#a00015] text-[13px] font-medium py-[7px] px-4 rounded-[20px] mb-8">
              <span className="text-dr-red text-[8px]">&#9679;</span>
              Healthspan Intelligence &middot; Path 02
            </div>
            <h1 className="text-[clamp(36px,4vw,56px)] font-bold tracking-[-1.5px] leading-[1.08] text-dr-black mb-[18px]">
              Your body is in <em className="italic text-dr-red">transition.</em> Understand it.
            </h1>
            <p className="text-[18px] text-[#555] mb-8 leading-relaxed max-w-[460px]">
              Energy, sleep, recovery, hormones. Something shifted in the last few years and you can&apos;t quite name it. DrRuby gives you the language — backed by science, built for women.
            </p>

            {/* GOALS */}
            <div className="flex flex-col mb-8">
              {[
                "Hike with my grandkids without running out of breath",
                "Sleep through the night — actually restored",
                "No more hot flashes keeping me up at 2am",
                "Know which supplements are actually helping",
              ].map((goal) => (
                <div key={goal} className="flex items-center gap-3 py-3 border-b border-dr-border text-base italic text-[#555] last:border-b-0">
                  <span className="text-dr-red not-italic font-bold">&rarr;</span>
                  {goal}
                </div>
              ))}
            </div>

            <a
              href="#join-healthspan"
              className="bg-dr-red text-white py-[14px] px-7 rounded-[10px] text-base font-semibold no-underline inline-block hover:opacity-85 transition-opacity"
            >
              Join the Waitlist &rarr;
            </a>
          </div>

          {/* HEALTHSPAN INDEX CARD */}
          <div className="hidden md:block bg-white border border-dr-border rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-dr-red mb-4">
              Your healthspan snapshot
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-b border-dr-border">
              <span className="text-xl flex-shrink-0 w-7">&#8635;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-black mb-0.5">Hormonal Resilience</div>
                <div className="text-xs italic text-dr-muted">&ldquo;Is my body still stable?&rdquo;</div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-dr-red-lt text-dr-red">Transition</span>
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-b border-dr-border">
              <span className="text-xl flex-shrink-0 w-7">&#8593;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-black mb-0.5">Recovery Capacity</div>
                <div className="text-xs italic text-dr-muted">&ldquo;Can I still recover?&rdquo;</div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-dr-green-bg text-dr-green-text">Stable</span>
            </div>
            <div className="flex items-center gap-3.5 py-3.5 border-b border-dr-border">
              <span className="text-xl flex-shrink-0 w-7">&#9672;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-black mb-0.5">Inflammaging Velocity</div>
                <div className="text-xs italic text-dr-muted">&ldquo;Am I chronically burning out?&rdquo;</div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-dr-red-lt text-dr-red">Elevated</span>
            </div>
            <div className="flex items-center gap-3.5 py-3.5 mb-4">
              <span className="text-xl flex-shrink-0 w-7">&#9673;</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-dr-black mb-0.5">Sleep Restoration</div>
                <div className="text-xs italic text-dr-muted">&ldquo;Did sleep actually restore me?&rdquo;</div>
              </div>
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-[20px] flex-shrink-0 bg-[#f0f0f0] text-dr-muted">Moderate</span>
            </div>
            <div className="border-l-3 border-l-dr-red bg-dr-red-lt rounded-r-lg py-3 px-4 text-[13px] italic text-[#a00015] leading-relaxed">
              &ldquo;Not testing your hormones — inferring their impact from skin, sleep, recovery, and the signals your body is already giving you.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* TRACK */}
      <section className="py-20 bg-white">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            What We Track
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-black mb-3">
            Seven questions your body is <em className="italic text-dr-red">asking.</em>
          </h2>
          <p className="text-[17px] text-[#666] max-w-[540px] leading-relaxed mb-12">
            Not biomarker panels. Questions with emotional meaning — the ones you already feel but can&apos;t measure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <div className="text-xl italic font-semibold text-dr-black mb-2.5">&ldquo;Is my body still stable?&rdquo;</div>
              <div className="text-[11px] font-bold tracking-[1px] uppercase text-dr-red mb-2.5">Hormonal Resilience Index&trade;</div>
              <p className="text-sm text-[#666] leading-relaxed mb-3">
                Not testing hormones — inferring their impact on your body. The most important index for women in perimenopause.
              </p>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                <strong className="font-semibold text-[#555]">Signals:</strong> sleep fragmentation, facial flushing, skin dryness, mood variability
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <div className="text-xl italic font-semibold text-dr-black mb-2.5">&ldquo;Can I still recover?&rdquo;</div>
              <div className="text-[11px] font-bold tracking-[1px] uppercase text-dr-red mb-2.5">Recovery Capacity Score&trade;</div>
              <p className="text-sm text-[#666] leading-relaxed mb-3">
                How fast can your body return to baseline after stress, exertion, or a bad night?
              </p>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                <strong className="font-semibold text-[#555]">Signals:</strong> exercise recovery, sleep restoration, stress recovery, skin repair speed
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <div className="text-xl italic font-semibold text-dr-black mb-2.5">&ldquo;Am I chronically burning out?&rdquo;</div>
              <div className="text-[11px] font-bold tracking-[1px] uppercase text-dr-red mb-2.5">Inflammaging Velocity&trade;</div>
              <p className="text-sm text-[#666] leading-relaxed mb-3">
                Inflammaging — inflammation + aging — is the mechanism behind most midlife health decline. We track its velocity.
              </p>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                <strong className="font-semibold text-[#555]">Signals:</strong> skin redness, stress load, poor sleep, metabolic variability
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <div className="text-xl italic font-semibold text-dr-black mb-2.5">&ldquo;Did sleep actually restore me?&rdquo;</div>
              <div className="text-[11px] font-bold tracking-[1px] uppercase text-dr-red mb-2.5">Sleep Restoration Score&trade;</div>
              <p className="text-sm text-[#666] leading-relaxed mb-3">
                Not how many hours — whether sleep did its job. The question women in midlife are actually asking.
              </p>
              <div className="text-[13px] text-dr-muted leading-relaxed">
                <strong className="font-semibold text-[#555]">Signals:</strong> morning recovery pattern, skin hydration recovery, energy baseline on waking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY STRIP */}
      <div className="bg-dr-red py-14">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:border-r md:border-white/20 md:pr-8">
            <div className="text-base font-bold text-white mb-2">Goals, not metrics</div>
            <p className="text-[15px] text-white/85 leading-relaxed">
              We start with what you want to do. Not what you want to optimize.
            </p>
          </div>
          <div className="md:border-r md:border-white/20 md:pr-8">
            <div className="text-base font-bold text-white mb-2">We want you to close the app</div>
            <p className="text-[15px] text-white/85 leading-relaxed">
              Every month we ask: is this tracking bringing you closer to your life, or replacing it?
            </p>
          </div>
          <div>
            <div className="text-base font-bold text-white mb-2">Science led by Charles Brenner, PhD</div>
            <p className="text-[15px] text-white/85 leading-relaxed">
              World&apos;s leading NAD+ researcher. Every index traceable to published research.
            </p>
          </div>
        </div>
      </div>

      {/* PROOF */}
      <section className="py-20 bg-dr-off">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            Early Users
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-black mb-3">
            Real life wins. Not <em className="italic text-dr-red">dashboard wins.</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-dr-border rounded-2xl py-7 px-7">
              <p className="text-lg italic text-dr-black leading-relaxed mb-4">
                &ldquo;I tracked my HRV and sleep for two years. None of it told me why I was exhausted. DrRuby was the first thing that <strong className="not-italic text-dr-red">asked what I actually wanted to do.</strong>&rdquo;
              </p>
              <div className="text-xs font-semibold tracking-[0.5px] uppercase text-dr-muted">
                Sarah M. &middot; 44 &middot; Perimenopause &middot; Early Beta
              </div>
            </div>
            <div className="bg-white border border-dr-border rounded-2xl py-7 px-7">
              <p className="text-lg italic text-dr-black leading-relaxed mb-4">
                &ldquo;I stopped taking <strong className="not-italic text-dr-red">4 supplements</strong> after DrRuby showed no measurable change after 8 weeks. That alone paid for the whole year.&rdquo;
              </p>
              <div className="text-xs font-semibold tracking-[0.5px] uppercase text-dr-muted">
                Linda K. &middot; 51 &middot; Post-menopause &middot; Early Beta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="py-20 bg-white border-t border-dr-border" id="join-healthspan">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <WaitlistForm
            title={<>Give your body a <em className="italic text-dr-red">language.</em></>}
            subtitle="First 500 users get 3 months of Pro free. Tell us what you're experiencing — we'll make sure DrRuby is built for you."
            ageOptions={["30–39", "40–49", "50–59", "60+"]}
            concerns={[
              { label: "Fatigue or energy crashes during the day", value: "fatigue" },
              { label: "Sleep that doesn't feel restorative", value: "sleep" },
              { label: "Perimenopause or menopause symptoms", value: "perimenopause" },
              { label: "Slower recovery from exercise or stress", value: "recovery" },
              { label: "I take supplements and want to know if they work", value: "supplements" },
            ]}
            showWinning
            formId="healthspan"
          />
        </div>
      </section>

      <Footer variant="sub" />
    </>
  );
}
