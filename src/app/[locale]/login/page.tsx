import { Suspense } from "react";
import AuthForm from "@/components/forms/AuthForm";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="bg-dr-off min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-[440px]">
          {/* AuthForm reads the `redirect` query param, so it must render inside Suspense. */}
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
