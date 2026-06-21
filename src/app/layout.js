import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://watermark-remover.example.com";

export const metadata = {
  title: {
    default: "Free Video Watermark Remover — Remove Watermarks from Images & Videos Online Free",
    template: "%s — Free Video Watermark Remover",
  },
  description:
    "Remove unwanted watermarks, logos, and text from images and videos online for free. Fast AI-powered watermark removal — no signup required.",
  keywords: [
    "watermark remover",
    "remove watermark from image",
    "remove watermark from video",
    "AI watermark removal",
    "free watermark remover online",
    "delete watermark from photo",
    "logo remover",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free Video Watermark Remover — Remove Watermarks from Images & Videos Online Free",
    description:
      "Remove unwanted watermarks, logos, and text from images and videos online for free. Fast AI-powered watermark removal — no signup required.",
    url: "/",
    siteName: "Free Video Watermark Remover",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Video Watermark Remover — Remove Watermarks from Images & Videos Online Free",
    description:
      "Remove unwanted watermarks, logos, and text from images and videos online for free.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Free Video Watermark Remover",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      description:
        "Remove unwanted watermarks, logos, and text from images and videos online for free.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      browserRequirements: "Requires JavaScript",
    },
    {
      "@type": "HowTo",
      name: "How to Remove a Watermark from an Image or Video",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Upload your file",
          text: "Drag and drop or browse to select an image or video containing a watermark.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "AI removes watermark",
          text: "Our engine detects and removes the watermark using smart inpainting or frequency analysis.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Download clean result",
          text: "Preview the result and download your watermark-free file in its original format.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is the watermark remover free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, our watermark remover is completely free to use. No signup or payment required.",
          },
        },
        {
          "@type": "Question",
          name: "What file formats are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We support PNG, JPG, and WebP for images, and MP4, AVI, MOV, and WebM for videos.",
          },
        },
        {
          "@type": "Question",
          name: "How does the AI watermark removal work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our tool uses smart inpainting, color thresholding, and frequency analysis to detect and remove watermarks while preserving the original image or video quality.",
          },
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
