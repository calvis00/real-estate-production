import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearbyAcres | Buy, Sell & Rent Properties in Tamil Nadu",
  description: "NearbyAcres helps you find premium apartments, villas, and plots in Chennai, Coimbatore, and across Tamil Nadu.",
  keywords: ["real estate Chennai", "plots for sale OMR", "apartments in Porur", "rent in Tamil Nadu"],
};

import Navbar from "@/components/Navbar";
import GlobalModalProvider from "@/components/GlobalModalProvider";
import UnifiedCommWidget from "@/components/UnifiedCommWidget";
import { LangProvider } from "@/i18n/LangContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="antialiased bg-background font-body text-on-surface">
        <LangProvider>
          <GlobalModalProvider>
            <Navbar />
            {children}
            <UnifiedCommWidget />
          </GlobalModalProvider>
        </LangProvider>
      </body>
    </html>
  );
}
