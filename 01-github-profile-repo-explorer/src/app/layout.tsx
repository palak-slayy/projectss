import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitScout — Profile & repository explorer",
  description: "A compact GitHub profile and repository explorer."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
