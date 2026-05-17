import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AtomQuest 1.0 - Goal Setting Portal',
  description: 'In-House Goal Setting & Tracking Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <div className="brand">AtomQuest 1.0</div>
        </header>
        {children}
      </body>
    </html>
  );
}
