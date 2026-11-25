import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './architecture.css';
import './gallery.css';

const Page = /^\/admin\/?$/.test(window.location.pathname)
  ? lazy(() => import('./Admin.jsx'))
  : lazy(() => import('./App.jsx'));

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Suspense fallback={<div className="shell loading-content" role="status">Loading…</div>}><Page/></Suspense></React.StrictMode>,
);