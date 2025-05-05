'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeletePostButtonProps {
  postId: number; // 或者 string，取决于你的 ID 类型
}

export default function DeletePostButton({ postId }: DeletePostButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    // 添加确认对话框
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
    if (!apiUrl) {
      setError("API URL is not configured.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        let errorMsg = `Failed to delete post: ${res.status}`;
        // 尝试解析错误体，如果后端返回 JSON 错误信息
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          errorMsg = `Failed to delete post: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }
      // 删除成功后，跳转到首页并刷新数据
      router.push('/');
      router.refresh();

    } catch (err: unknown) { // 1. 将 err 的类型改为 unknown
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
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
      >
        {isLoading ? 'Deleting...' : 'Delete'}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  );
}