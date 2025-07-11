'use client';

import Image from 'next/image';

export default function BmisLogo() {
  return (
    <Image
      src="/Bmislogo.png"
      alt="BMIS Logo"
      width={100}
      height={100}
      className="rounded-full"
      priority
    />
  );
}