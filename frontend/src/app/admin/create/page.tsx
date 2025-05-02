'use client'; // 标记为 Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // 使用 App Router 的 useRouter
import Link from 'next/link'; // 导入 Link 组件

export default function CreatePostPage() {
  const [title, setTitle] = useState<string>(''); (''); // 修正：添加 setTitle
  const [content, setContent] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiUrl) {
      setError("API URL is not configured.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST', // 指定 POST 方法 [35]
        headers: {
          'Content-Type': 'application/json', // 指定内容类型为 JSON
        },
        body: JSON.stringify({ title, content, authorEmail }), // 序列化请求体 [35]
      });

      if (!res.ok) {
        // 尝试解析错误响应体
        let errorMsg = `Failed to create post: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg; // 使用后端返回的错误信息（如果可用）
        } catch (parseError) {
          // 如果响应体不是 JSON 或解析失败，使用状态文本
          errorMsg = `Failed to create post: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      } // 创建成功后，可以重定向到首页或新帖子的页面
      router.push('/'); // 重定向到首页
      // 或者 router.refresh(); // 刷新当前路由数据

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700">Author Email</label>
          <input
            type="email"
            id="authorEmail"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)} // 修正：使用 setTitle
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Post'}
        </button>
        {/* 可以添加返回链接 */}
        <Link href="/">Back to posts</Link>
      </form>
    </main>
  );
}