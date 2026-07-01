import { getTranslations } from "next-intl/server";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Faq from "@/components/sections/waitlist/Faq";
import FinalCta from "@/components/sections/waitlist/FinalCta";
import JoinForm from "@/components/sections/waitlist/JoinForm";
import ValuePoints from "@/components/sections/waitlist/ValuePoints";
import WaitlistHero from "@/components/sections/waitlist/WaitlistHero";

export default async function WaitlistPage() {
  await getTranslations("waitlist");
  return (
    <>
      <Navbar />
      <WaitlistHero />
      <ValuePoints />
      <JoinForm />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  );
}
