import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sift — AI talent sourcing",
  description: "An AI-assisted sourcing refinement loop for thoughtful recruiters.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
