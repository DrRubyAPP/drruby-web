import PageSwitcher from "@/components/common/PageSwitcher";
import WaitlistForm from "@/components/forms/WaitlistForm";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function SkinPage() {
  return (
    <>
      <PageSwitcher />
      <Navbar variant="sub" />

      {/* SUB-HERO */}
      <div className="bg-[radial-gradient(ellipse_at_70%_0%,#fce8eb_0%,#f5f5f5_65%)] dark:bg-[radial-gradient(ellipse_at_70%_0%,#2a1419_0%,#0f0f0f_65%)] min-h-[80vh] flex items-center">
        <div className="max-w-[1100px] mx-auto py-20 px-5 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-dr-red-lt border border-[#f5b8c0] text-[#a00015] text-[13px] font-medium py-[7px] px-4 rounded-[20px] mb-8">
              <span className="text-dr-red text-[8px]">&#9679;</span>
              Skin Intelligence &middot; Path 01
            </div>
            <h1 className="text-[clamp(36px,4vw,56px)] font-bold tracking-[-1.5px] leading-[1.08] text-dr-fg mb-[18px]">
              Your skin is telling you{" "}
              <em className="italic text-dr-red">something.</em>
            </h1>
            <p className="text-[18px] text-[#555] dark:text-[#9a9a9a] mb-8 leading-relaxed max-w-[460px]">
              Inflammation, melasma, skin that changed faster than expected.
              DrRuby measures three peer-reviewed imaging biomarkers — so you
              can see exactly what&apos;s happening, and what&apos;s actually
              working.
            </p>
            <a
              href="#join-skin"
              className="bg-dr-red text-white py-[14px] px-7 rounded-[10px] text-base font-semibold no-underline inline-block hover:opacity-85 transition-opacity"
            >
              Join the Waitlist &rarr;
            </a>
          </div>

          {/* BIOMARKER CARD */}
          <div className="hidden md:block bg-dr-black rounded-[20px] p-7">
            <div className="text-[11px] font-bold tracking-[1.5px] uppercase text-dr-red-mid mb-5">
              Your biomarker snapshot
            </div>
            <div className="bg-white/6 rounded-[10px] py-4 px-[18px] mb-2 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[13px] font-bold tracking-[0.5px] uppercase text-white/90 mb-0.5">
                  Inflammation Index
                </div>
                <div className="text-xs text-white/50">
                  Erythema &middot; barrier disruption &middot; immune response
                </div>
              </div>
              <span className="text-[32px] font-bold tracking-tight flex-shrink-0 text-dr-red-mid">
                38
              </span>
              <span className="text-[11px] font-bold py-[3px] px-2 rounded-md flex-shrink-0 bg-[rgba(77,201,138,0.15)] text-dr-green">
                &darr; 12%
              </span>
            </div>
            <div className="bg-white/6 rounded-[10px] py-4 px-[18px] mb-2 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[13px] font-bold tracking-[0.5px] uppercase text-white/90 mb-0.5">
                  Collagen Proxy
                </div>
                <div className="text-xs text-white/50">
                  Dermal density &middot; structural aging
                </div>
              </div>
              <span className="text-[32px] font-bold tracking-tight flex-shrink-0 text-dr-green">
                71
              </span>
              <span className="text-[11px] font-bold py-[3px] px-2 rounded-md flex-shrink-0 bg-white/8 text-white/60">
                &rarr; stable
              </span>
            </div>
            <div className="bg-white/6 rounded-[10px] py-4 px-[18px] mb-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="text-[13px] font-bold tracking-[0.5px] uppercase text-white/90 mb-0.5">
                  Pigment Kinetics
                </div>
                <div className="text-xs text-white/50">
                  Melanin velocity &middot; melasma &middot; hyperpigmentation
                </div>
              </div>
              <span className="text-[32px] font-bold tracking-tight flex-shrink-0 text-dr-amber">
                24
              </span>
              <span className="text-[11px] font-bold py-[3px] px-2 rounded-md flex-shrink-0 bg-[rgba(77,201,138,0.15)] text-dr-green">
                &darr; 6%
              </span>
            </div>
            <div className="border-l-3 border-l-dr-red bg-[rgba(208,2,27,0.08)] rounded-r-lg py-3 px-4 text-[13px] italic text-white/75 leading-relaxed">
              &ldquo;The retinol you started 6 weeks ago correlates with +8%
              Collagen Proxy. That $400 serum shows no detectable change.&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* MEASURE */}
      <section className="py-20 bg-dr-surface">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            What We Measure
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-fg mb-3">
            Three numbers. All{" "}
            <em className="italic text-dr-red">peer-reviewed.</em>
          </h2>
          <p className="text-[17px] text-[#666] dark:text-[#9a9a9a] max-w-[540px] leading-relaxed mb-12">
            Not a beauty score. Three independently interpretable biomarkers —
            each grounded in published imaging research.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <span className="inline-block text-[11px] font-bold tracking-[1px] uppercase py-1 px-2.5 rounded-md mb-4 bg-dr-red-lt text-dr-red">
                Inflammation
              </span>
              <div className="text-[22px] font-bold tracking-tight text-dr-fg mb-2.5">
                Inflammation Index
              </div>
              <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3.5">
                Cross-polarized light reveals erythema and barrier disruption —
                your skin&apos;s real-time immune response.
              </p>
              <div className="text-[13px] italic text-dr-muted leading-relaxed">
                Tells you: Is a new product causing a reaction? Is your barrier
                healthy?
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <span className="inline-block text-[11px] font-bold tracking-[1px] uppercase py-1 px-2.5 rounded-md mb-4 bg-dr-green-bg text-dr-green-text">
                Collagen
              </span>
              <div className="text-[22px] font-bold tracking-tight text-dr-fg mb-2.5">
                Collagen Proxy
              </div>
              <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3.5">
                UV-A 405nm excitation reveals dermal collagen density via
                fluorescence — the structural architecture beneath your skin.
              </p>
              <div className="text-[13px] italic text-dr-muted leading-relaxed">
                Tells you: Is your retinol or laser treatment actually working?
              </div>
            </div>
            <div className="bg-dr-off border border-dr-border rounded-2xl py-7 px-6 border-t-3 border-t-transparent hover:border-t-dr-red transition-colors">
              <span className="inline-block text-[11px] font-bold tracking-[1px] uppercase py-1 px-2.5 rounded-md mb-4 bg-dr-amber-bg text-dr-amber-text">
                Pigmentation
              </span>
              <div className="text-[22px] font-bold tracking-tight text-dr-fg mb-2.5">
                Pigment Kinetics
              </div>
              <p className="text-sm text-[#666] dark:text-[#9a9a9a] leading-relaxed mb-3.5">
                Multi-spectral analysis tracks melanin distribution and velocity
                — especially powerful for melasma and post-inflammatory
                hyperpigmentation.
              </p>
              <div className="text-[13px] italic text-dr-muted leading-relaxed">
                Tells you: Is your melasma getting better or worse?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="py-20 bg-dr-off">
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
            Early Users
          </div>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-fg mb-3">
            What they found after{" "}
            <em className="italic text-dr-red">90 days.</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-dr-surface border border-dr-border rounded-2xl py-7 px-7">
              <p className="text-lg italic text-dr-fg leading-relaxed mb-4">
                &ldquo;I spent{" "}
                <strong className="not-italic text-dr-red">$600 on IPL</strong>{" "}
                and had no way to know if it worked. DrRuby showed my Pigment
                Kinetics dropped 18% in 6 weeks.&rdquo;
              </p>
              <div className="text-xs font-semibold tracking-[0.5px] uppercase text-dr-muted">
                Jennifer C. &middot; 47 &middot; Melasma &middot; Early Beta
              </div>
            </div>
            <div className="bg-dr-surface border border-dr-border rounded-2xl py-7 px-7">
              <p className="text-lg italic text-dr-fg leading-relaxed mb-4">
                &ldquo;I stopped using a{" "}
                <strong className="not-italic text-dr-red">$300 serum</strong>{" "}
                after DrRuby showed zero change in Collagen Proxy after 8
                weeks.&rdquo;
              </p>
              <div className="text-xs font-semibold tracking-[0.5px] uppercase text-dr-muted">
                Rachel M. &middot; 38 &middot; Perimenopause Skin &middot; Early
                Beta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section
        className="py-20 bg-dr-surface border-t border-dr-border"
        id="join-skin"
      >
        <div className="max-w-[1100px] mx-auto px-5 md:px-10">
          <WaitlistForm
            title={
              <>
                Stop guessing what&apos;s{" "}
                <em className="italic text-dr-red">working.</em>
              </>
            }
            subtitle="First 500 users get 3 months of Pro free. Tell us about your skin — we'll make sure DrRuby is built for you."
            ageOptions={["Under 30", "30–39", "40–49", "50–59", "60+"]}
            concerns={[
              {
                label: "Inflammation / redness / barrier issues",
                value: "inflammation",
              },
              { label: "Melasma or hyperpigmentation", value: "melasma" },
              { label: "Skin aging / collagen loss", value: "aging" },
              {
                label: "Hormonal skin changes (perimenopause)",
                value: "hormonal",
              },
              {
                label: "I want to know if my products are working",
                value: "products",
              },
            ]}
            showSpend
            formId="skin"
          />
        </div>
      </section>

      <Footer variant="sub" />
    </>
  );
}
