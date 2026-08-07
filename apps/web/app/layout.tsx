import type { Metadata } from "next";
import "./globals.css";

// Deliberately NO next/font/google. That fetches font files at build time, and
// this app has to build on a laptop with the internet unplugged. System stack only.

export const metadata: Metadata = {
  title: "Vaidhya",
  description: "Edge-AI telemedicine for rural primary care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
