import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Body: Plus Jakarta Sans. Editorial headings: Playfair Display. Numbers / SKUs / phones: Geist Mono with tabular digits.
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Barnali Fashion — Rental Business Management ERP & Boutique Studio",
  description:
    "Complete Rental Business Management Platform & Boutique Customer Website for Barnali Fashion, Bargarh, Odisha.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Barnali ERP",
  },
};

export const viewport = {
  themeColor: "#7A1624",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration note:', err.message);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
