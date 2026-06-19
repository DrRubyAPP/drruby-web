import { getTranslations } from "next-intl/server";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import BrennerScience from "@/components/sections/home/BrennerScience";
import DualEntry from "@/components/sections/home/DualEntry";
import HeroCarousel from "@/components/sections/home/HeroCarousel";
import JenniferQuote from "@/components/sections/home/JenniferQuote";
import N1Philosophy from "@/components/sections/home/N1Philosophy";
import ScrollFeatures from "@/components/sections/home/ScrollFeatures";
import TrustBar from "@/components/sections/home/TrustBar";

export default async function Home() {
  // Touch translations to ensure namespace is loaded
  await getTranslations("home");
  return (
    <>
      <Navbar />
      <HeroCarousel />
      <TrustBar />
      <DualEntry />
      <N1Philosophy />
      <ScrollFeatures />
      <JenniferQuote />
      <BrennerScience />
      <Footer />
    </>
  );
}
