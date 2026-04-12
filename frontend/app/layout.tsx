import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import HeaderBar from './_components/HeaderBar';
import Footer from './_components/Footer';
import Skeleton from './_components/Skeleton';
import MainContent from './_components/MainContent';

export const metadata: Metadata = {
  title: 'Matriz 3D Studio',
  description: 'Loja de objetos 3D, assets e coleções para projetos, cenas e impressão.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"     // adiciona/remover classe "dark"
          defaultTheme="light"  // tema inicial
          enableSystem={false}  // ignore tema do sistema (opcional)
        >
          <div className="flex min-h-dvh flex-col">
            {/* Header global (wrapped in Suspense to allow client navigation hooks to hydrate) */}
              <Suspense
                fallback={(
                  <header
                    className="sticky top-0 z-40 border-b"
                    style={{ background: 'var(--color-header)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                      <Skeleton className="h-10 w-full max-w-xl" />
                    </div>
                  </header>
                )}
              >
                <HeaderBar />
              </Suspense>

            {/* Toaster global */}
            <Toaster richColors position="top-right" />

            {/* Conteúdo principal */}
            <MainContent>{children}</MainContent>

            {/* Footer global */}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
