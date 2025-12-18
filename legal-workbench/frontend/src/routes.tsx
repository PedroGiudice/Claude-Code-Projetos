import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const HubHome = lazy(() => import('@/pages/HubHome'));
const TrelloModule = lazy(() => import('@/pages/TrelloModule'));
const DocAssemblerModule = lazy(() => import('@/pages/DocAssemblerModule'));
const STJModule = lazy(() => import('@/pages/STJModule'));
const TextExtractorModule = lazy(() => import('@/pages/TextExtractorModule'));
const LedesConverterModule = lazy(() => import('@/pages/LedesConverterModule'));

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LazyPage><HubHome /></LazyPage> },
      { path: 'trello', element: <LazyPage><TrelloModule /></LazyPage> },
      { path: 'doc-assembler', element: <LazyPage><DocAssemblerModule /></LazyPage> },
      { path: 'stj', element: <LazyPage><STJModule /></LazyPage> },
      { path: 'text-extractor', element: <LazyPage><TextExtractorModule /></LazyPage> },
      { path: 'ledes-converter', element: <LazyPage><LedesConverterModule /></LazyPage> },
    ],
  },
]); // Root path - no basename needed
