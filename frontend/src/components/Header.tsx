"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext'; // Adjusted path to match relative location

export default function Header() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // 顯示加載狀態
  }

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link href="/">Home</Link>
      <nav>
        {user ? (
          <>
            <span>Welcome, {user.name || user.email}!</span>
            <button onClick={logout} style={{ marginLeft: '1rem' }}>Logout</button>
          </>
        ) : (
          <Link href="/login">Login</Link> // 假設你有 /login 頁面
        )}
      </nav>
    </header>
  );
}