import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import DashboardShell from "@/components/layout/DashboardShell";
import Toaster from "@/components/ui/Toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

const OG_IMAGE = "https://res.cloudinary.com/dioiyb833/image/upload/f_auto,q_auto:good,w_1200,h_630,c_fill/v1783376318/sub-og-image_f8momq.png";

export const metadata: Metadata = {
  title: "Sub | Subscription Billing by Nomba",
  description: "Create plans, manage customers, and collect recurring revenue. Sub is a subscription billing engine powered by Nomba.",
  openGraph: {
    title:       "Sub | Subscription Billing by Nomba",
    description: "Create plans, manage customers, and collect recurring revenue. Sub is a subscription billing engine powered by Nomba.",
    type:        "website",
    locale:      "en_NG",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Sub | Subscription Billing by Nomba" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Sub | Subscription Billing by Nomba",
    description: "Create plans, manage customers, and collect recurring revenue. Sub is a subscription billing engine powered by Nomba.",
    images:      [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="antialiased">
        <DashboardShell>{children}</DashboardShell>
        <Toaster />
      </body>
    </html>
  );
}
