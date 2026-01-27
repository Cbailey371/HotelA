import type { Metadata } from "next";
import { Questrial, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const questrial = Questrial({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-questrial",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hotel",
  description: "Página de hotel",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className={`${questrial.variable} ${inter.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers locale={locale}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
