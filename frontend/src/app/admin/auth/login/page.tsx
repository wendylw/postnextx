'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';


const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;

    if (!apiUrl) {
      setError("API URL is not configured.");
      setIsLoading(false);
      return;
    }

    // Mock login logic
    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Mock successful login
      setIsLoading(false);

      // Redirect to posts page
      router.replace('/'); // <-- 在這裡執行替換導航

    } catch (err: unknown) {
      let errorMessage = "An unexpected error occurred."; // 2. 提供一个默认错误消息

      // 3. 进行类型检查以安全地获取错误消息
      if (err instanceof Error) {
        errorMessage = err.message; // 如果是 Error 实例，安全地使用它的 message
      } else if (typeof err === 'string') {
        errorMessage = err; // 如果错误本身就是个字符串
      }
      // 可选：添加更多检查，比如检查是否是一个包含 message 属性的普通对象
      // else if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
      //   errorMessage = err.message;
      // }

      // 4. 使用提取出的、类型安全的消息来更新状态
      setError(errorMessage);
    } finally {
      setIsLoading(false); // 5. 确保在请求结束后重置加载状态
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className={`w-full py-2 px-4 font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;