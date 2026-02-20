import type { Metadata } from "next";

import { TopNav } from "@/components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meander Org Chart",
  description: "Internal people directory foundation"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="app-body">
        <TopNav />
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
