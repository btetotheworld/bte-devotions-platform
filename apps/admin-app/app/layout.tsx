import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTE Devotions - Admin App",
  description: "Admin app for creators and church admins",
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




