// src/app/page.jsx
"use client";

import dynamic from 'next/dynamic';

const OSMMap = dynamic(() => import('@/components/OSMMap'), { ssr: false });

export default function HomePage() {
  return (
    <div className="p-4">
      <OSMMap />
    </div>
  );
}
