import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Italiana } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const italiana = Italiana({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bhind.thesceneapp.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bhind by TheScene | Event Management & Ticketing Console",
    template: "%s | Bhind",
  },
  description:
    "The premier event management and ticketing platform for nightlife organizers, concert promoters, and event hosts. Sell tickets, track real-time revenue, manage guest lists, and receive automated payouts.",
  applicationName: "Bhind Host Console",
  keywords: [
    "event management",
    "ticket sales",
    "nightlife events",
    "lagos events ticketing",
    "event organizer console",
    "guest list scanner",
    "TheScene",
    "Bhind",
    "event ticketing nigeria",
  ],
  authors: [{ name: "TheScene", url: "https://thesceneapp.online" }],
  creator: "TheScene",
  publisher: "TheScene",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Bhind by TheScene",
    title: "Bhind by TheScene | Event Management & Ticketing Console",
    description:
      "The premier event management and ticketing platform for nightlife organizers, concert promoters, and event hosts.",
    images: [
      {
        url: "/thescenne-logo.png",
        width: 1200,
        height: 630,
        alt: "Bhind by TheScene Host Console",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bhind by TheScene | Event Management & Ticketing Console",
    description:
      "The premier event management and ticketing platform for nightlife organizers, concert promoters, and event hosts.",
    images: ["/thescenne-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${inter.variable} ${italiana.variable}`}
      suppressHydrationWarning={true}
    >
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
