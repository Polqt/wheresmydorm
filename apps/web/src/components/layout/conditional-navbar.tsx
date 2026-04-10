"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";

/** Home page uses `HomeHeroShell` for its own fixed nav; other routes get the standard bar. */
export function ConditionalNavbar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Navbar />;
}
