import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTE Devotions - User App",
  description: "User-facing app for BTE Devotions Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}




