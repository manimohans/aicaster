import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from 'next-themes'

export const metadata: Metadata = {
  title: "AICaster",
  description: "A Farcaster Social Feed Viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Permissions-Policy" content="browsing-topics=()" />
        <script async src="https://platform.twitter.com/widgets.js"></script>
      </head>
      <body className="bg-white dark:bg-gray-900 text-black dark:text-white">
        <ThemeProvider attribute="class">
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}