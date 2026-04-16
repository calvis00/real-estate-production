import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearbyAcres | Buy, Sell & Rent Properties in Tamil Nadu",
  description: "NearbyAcres helps you find premium apartments, villas, and plots in Chennai, Coimbatore, and across Tamil Nadu.",
  keywords: ["real estate Chennai", "plots for sale OMR", "apartments in Porur", "rent in Tamil Nadu"],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1596170251497441');
fbq('track', 'PageView');`}
        </Script>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Tamil:wght@400;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="antialiased bg-background font-body text-on-surface">
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1596170251497441&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
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
