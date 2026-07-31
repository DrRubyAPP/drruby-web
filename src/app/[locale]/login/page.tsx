import { Suspense } from "react";
import { DownloadModal } from "@/components/DownloadWaitlist";
import AuthForm from "@/components/forms/AuthForm";
import Footer from "@/components/layout/Footer";
import HomeNav from "@/components/layout/HomeNav";
import "../home-v5.css";

export default function LoginPage() {
  return (
    <>
      {/* Same top header as the homepage. `.dr-v5` scopes the home-v5.css nav
          styles to the nav only; `display:contents` drops the wrapper's box so
          the sticky nav still sticks across the whole page (its containing
          block becomes the page, not this short wrapper) without leaking the
          `.dr-v5` styles into the Tailwind body below. */}
      <div className="dr-v5" style={{ display: "contents" }}>
        <HomeNav sectionPrefix="/" />
      </div>
      <main className="bg-dr-off min-h-[calc(100vh-82px)] flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[440px]">
          {/* AuthForm reads the `redirect` query param, so it must render inside Suspense. */}
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </main>
      <Footer />
      {/* Mounted so the nav's Download button can open the waitlist modal. */}
      <DownloadModal />
    </>
  );
}
