import type { Metadata } from "next";
import { Epilogue, Public_Sans, Space_Grotesk } from "next/font/google";
import { TopNav } from "@/components/layout/top-nav";
import { SideNav } from "@/components/layout/side-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAIO-X DO GOVERNO",
  description:
    "Plataforma de transparencia governamental com dados abertos sobre gastos publicos, licitacoes e desempenho de politicos eleitos no Brasil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${epilogue.variable} ${publicSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <TopNav />
          <SideNav />

          <main className="flex-1 pt-20 lg:ml-72 pb-24 md:pb-0">
            {children}
          </main>

          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
