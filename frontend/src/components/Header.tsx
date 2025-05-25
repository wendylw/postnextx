'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header
      style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}
    >
      <Link href="/">Home</Link>
      <nav>test</nav>
    </header>
  );
}
