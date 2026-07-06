import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider, NO_FLASH_THEME_SCRIPT } from "../lib/theme-context";
import { MouseParallax } from "../components/brand/MouseParallax";

export const metadata: Metadata = {
  title: "Utado — Your music, logged.",
  description: "Log every song you listen to, rate it, review it, and see what your friends are hearing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Sets the `dark` class before paint, from localStorage or system preference, to avoid a flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <MouseParallax />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
