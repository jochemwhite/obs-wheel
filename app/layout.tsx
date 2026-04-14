import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wheel of Fortune",
  description: "Spin to decide — because every choice deserves drama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
