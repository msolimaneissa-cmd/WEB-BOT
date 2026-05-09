import type { Metadata } from "next";
import { Cairo, Cinzel } from 'next/font/google';
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutContent } from "@/components/layout-content";
import { AuthProvider } from "@/components/auth-provider";
import { GlobalErrorBoundary } from "@/components/global-error-boundary";

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-body',
  weight: ['400', '700', '900'],
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-headline',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://familylegends.com';
const LOGO_URL = `${SITE_URL}/images/logo.png`;

// Viewport configuration for mobile responsiveness
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FFD700',
};

export const metadata: Metadata = {
  title: {
    default: "𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮 — مجتمع الأساطير",
    template: "%s | 𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮"
  },
  description: "مجتمع الأساطير حيث يجتمع أفضل اللاعبين. انضم إلينا وكن جزءاً من النخبة. بطولات، تحديات، وألعاب ممتعة.",
  keywords: ["ألعاب", "مجتمع", "ديسكورد", "أساطير", "Family Legends", "gaming community", "Discord"],
  authors: [{ name: "سام المصري" }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: SITE_URL,
    title: '𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮 — مجتمع الأساطير',
    description: 'مجتمع الأساطير حيث يجتمع أفضل اللاعبين. انضم إلينا الآن!',
    siteName: '𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮',
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: 'Family Legends Community',
      },
    ],
  },
  alternates: {
    languages: {
      'ar': SITE_URL,
      'en': SITE_URL,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: '𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮',
    description: 'مجتمع الأساطير — انضم لعالمنا',
    images: [LOGO_URL],
  },
  icons: {
    icon: [
      { url: '/images/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Structured Data (JSON-LD)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Family Legends",
  "alternateName": "𝐹𝒜𝑀𝐼𝐿Y 𝐿𝐸𝒢𝐸𝒩𝒟𝒮",
  "url": SITE_URL,
    "logo": LOGO_URL,
    "image": LOGO_URL,
    "description": "مجتمع الأساطير حيث يجتمع أفضل اللاعبين",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Middle East",
      "addressCountry": "EG"
    },
    "sameAs": [
      "https://discord.gg/familylegends"
    ]
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={cn(cairo.variable, cinzel.variable, "min-h-screen bg-background font-body antialiased overflow-x-hidden")} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <AuthProvider>
            <FirebaseClientProvider>
              <GlobalErrorBoundary>
                <LayoutContent>{children}</LayoutContent>
              </GlobalErrorBoundary>
            </FirebaseClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
