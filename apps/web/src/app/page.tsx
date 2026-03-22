import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero/hero";
import { Product } from "@/components/sections/product/product-section";
import { Pricing } from "@/components/sections/pricing/pricing-section";
import { Community } from "@/components/sections/community/community-section";
import { Faq } from "@/components/sections/faq/faq-section";
import { Contact } from "@/components/sections/contact/contact-section";

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 inline-flex items-center h-10 px-5 rounded-full bg-[#5B6FD1] text-white text-sm font-medium focus:outline-2 focus:outline-[#B5CAFF] focus:outline-offset-2"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content">
        <Hero />
        <Product />
        <Pricing />
        <Community />
        <Faq />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
