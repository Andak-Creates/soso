import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Italiana } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const italiana = Italiana({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Bhind: Host Console",
  description:
    "Manage your events, tickets, revenue, and settlements with Bhind by TheScene.",
  openGraph: {
    title: "Bhind Host Console",
    description:
      "The premium event management platform for Nigerian nightlife organisers.",
    siteName: "Bhind by TheScene",
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
