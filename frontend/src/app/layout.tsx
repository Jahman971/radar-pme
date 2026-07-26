import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radar PME',
  description: 'Détecter les PME dont la trajectoire économique évolue sur votre territoire.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <a href="/radar" className="text-gray-900 font-semibold text-lg hover:text-blue-600 transition-colors">
              Radar PME
            </a>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/radar" className="text-gray-600 hover:text-gray-900 font-medium">Radar</a>
            <a href="/watchlist" className="text-gray-600 hover:text-gray-900 font-medium">Ma liste</a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
