import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IntervueAI — AI Technical & Behavioral Mock Interviewer',
  description:
    'Conversational AI mock technical and behavioral interviews for Software Engineers, Full-Stack Developers, Data Science, System Design, and custom roles.',
  keywords: [
    'Mock Interview',
    'AI Interview Bot',
    'Technical Interview',
    'Behavioral Interview',
    'System Design',
    'Software Engineer',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
