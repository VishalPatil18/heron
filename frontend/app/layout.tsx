import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Heron - Nothing swims past.",
  description:
    "Heron catches AI-supercharged phishing before you click. Scan any email and get an instant verdict.",
  openGraph: {
    title: "Heron - Nothing swims past.",
    description: "Heron catches AI-supercharged phishing before you click.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
