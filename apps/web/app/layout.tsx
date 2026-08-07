import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Cure Cloud · Project Vaidhya",
  description: "Edge-AI telemedicine and pharmacy fulfillment network for rural primary care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FBFCFD] text-[#173449] antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
