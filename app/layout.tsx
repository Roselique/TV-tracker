import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Watchlist",
  description: "Track the series and movies you're watching.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
