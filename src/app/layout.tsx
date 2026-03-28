import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { Navbar } from "@/components/ui/navbar";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "DevRoast",
  description: "DevRoast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetBrainsMono.variable} bg-bg-page`}>
        <Navbar />
        {/* Cache Components: isolate uncached TRPC client reads under Suspense. */}
        <Suspense fallback={null}>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
