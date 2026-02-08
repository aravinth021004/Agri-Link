import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { IntlClientProvider } from "@/components/intl-provider";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AgriLink - Farm Fresh, Direct to You",
  description: "Connect directly with local farmers. Fresh produce, fair prices, no middlemen.",
  keywords: "farmers, fresh produce, organic, local food, farm to table, agriculture, India",
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
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <IntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
              <BottomNav />
            </div>
          </Providers>
        </IntlClientProvider>
      </body>
    </html>
  );
}
