const defaultUrl = process.env.NODE_ENV === 'production'
  ? 'http://64.225.3.4:3000'
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Macros - Social Nutrition Tracker",
  description: "Track and share your daily macro intake",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Macros - Social Nutrition Tracker',
    description: 'Track and share your daily macro intake',
    url: defaultUrl,
    siteName: 'Macros',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Macros - Social Nutrition Tracker',
    description: 'Track and share your daily macro intake',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#000000',
}; 