import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "MiniDocs",
  description: "Document editor for the Ajaia LLC technical assessment.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en" translate="no"><body>{children}</body></html>;
}
