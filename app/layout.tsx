import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escape.exe: The Logical Escape Room Platform",
  description: "Decode the chain of logic, decrypt ciphers, and find the master key before time runs out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-accent/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
