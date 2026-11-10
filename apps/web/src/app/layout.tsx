import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Miracle — Creative Studio Lead Generation & Outreach",
    template: "%s · Miracle",
  },
  description:
    "Free open-source scraper for Google Maps and LinkedIn, visual creative gap tagging, and 1-click automated outreach tailored for Graphic Design & Video Editing Studios.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        {/* Apply the saved day/night theme before first paint so the page never flashes the wrong colours. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("miracle-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
