import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Community } from "@/components/sections/community/community-section";
import { Contact } from "@/components/sections/contact/contact-section";
import { Faq } from "@/components/sections/faq/faq-section";
import { Hero } from "@/components/sections/hero/hero";
import { Pricing } from "@/components/sections/pricing/pricing-section";
import { Product } from "@/components/sections/product/product-section";

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 inline-flex h-10 items-center rounded-full bg-[#5B6FD1] px-5 font-medium text-sm text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-[#B5CAFF] focus:outline-offset-2"
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
