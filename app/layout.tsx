import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "UniStocker — Inventory Management", template: "%s | UniStocker" },
  description: "Smart inventory management for small and medium businesses",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "UniStocker" },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

import { PWARegister } from "@/components/pwa-register";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Prevents flash of wrong theme on load */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('uni-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()` }} />
        {/* Capture beforeinstallprompt before React hydrates — avoids race condition */}
        <script dangerouslySetInnerHTML={{ __html: `window.__pwaInstallPrompt=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallPrompt=e;});` }} />
      </head>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
