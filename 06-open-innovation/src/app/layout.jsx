import "./globals.css";

export const metadata = { title: "Common Ground", description: "A focused open innovation board" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
