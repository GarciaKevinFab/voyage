import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const BookshelfScreen = lazy(() => import('./screens/BookshelfScreen'));
const BookInteriorScreen = lazy(() => import('./screens/BookInteriorScreen'));
const FlipbookScreen = lazy(() => import('./screens/FlipbookScreen'));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));

function LoadingFallback() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-cream">
      <p className="font-serif text-2xl text-gold animate-pulse tracking-widest">
        VOYAGE
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div className="voyage-cursor h-full">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<BookshelfScreen />} />
          <Route path="/book/:id" element={<BookInteriorScreen />} />
          <Route path="/book/:id/read" element={<FlipbookScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
        </Routes>
      </Suspense>
    </div>
  );
}
