import { getTranslations } from "next-intl/server";
import { DownloadModal } from "@/components/DownloadWaitlist";
import Footer from "@/components/layout/Footer";
import HomeNav from "@/components/layout/HomeNav";
import Faq from "@/components/sections/waitlist/Faq";
import FinalCta from "@/components/sections/waitlist/FinalCta";
import JoinForm from "@/components/sections/waitlist/JoinForm";
import ValuePoints from "@/components/sections/waitlist/ValuePoints";
import WaitlistHero from "@/components/sections/waitlist/WaitlistHero";
import "../home-v5.css";

export default async function WaitlistPage() {
  await getTranslations("waitlist");
  return (
    <>
      {/* Shared homepage header; `display:contents` keeps the sticky nav
          sticking across the page without leaking `.dr-v5` into the body. */}
      <div className="dr-v5" style={{ display: "contents" }}>
        <HomeNav sectionPrefix="/" appControls />
      </div>
      <WaitlistHero />
      <ValuePoints />
      <JoinForm />
      <Faq />
      <FinalCta />
      <Footer />
      <DownloadModal />
    </>
  );
}
