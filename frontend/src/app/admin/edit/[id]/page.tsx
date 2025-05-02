'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditPostPage() {
  const [title, setTitle] = useState<string>(''); ('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(false); // 添加 published 状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string; // 获取路由参数中的帖子 ID

  // 获取现有帖子数据
  useEffect(() => {
    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiUrl) {
      setError("API URL is not configured.");
      setIsLoading(false);
      return;
    }

    if (!postId || typeof postId !== 'string') {
      setError("Error: Invalid postId received in getPost");
      setIsLoading(false);
      return;
    }


    fetch(`${apiUrl}/posts/${postId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch post data');
        }
        return res.json();
      })
      .then(data => {
        setTitle(data.title);
        setContent(data.content || ''); // 处理可能为 null 的 content
        setPublished(data.published); // 设置 published 状态
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [postId]);

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
      const res = await fetch(`${apiUrl}/posts/${postId}`, {
        method: 'PUT', // 使用 PUT 方法
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, published }), // 发送更新的数据
      });

      if (!res.ok) {
        let errorMsg = `Failed to update post: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          errorMsg = `Failed to update post: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }

      router.push(`/posts/${postId}`); // 更新成功后跳转回帖子详情页
      router.refresh(); // 刷新数据

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !title) { // 初始加载状态
    return <p className="container mx-auto p-4">Loading post data...</p>;
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        {/* Content Input */}
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
        {/* Published Checkbox */}
        <div className="flex items-center">
          <input
            id="published"
            name="published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
            Published
          </label>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Post'}
          </button>
          <button onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            router.back()
          }} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}