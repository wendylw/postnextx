
import Link from 'next/link'; // 如果要使用 Link，需要導入
import { notFound } from 'next/navigation'; // 用于处理 404
import DeletePostButton from '@/components/DeletePostButton'; // 假设组件位于 components 文件夹

async function getPost(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
  // 建議保留日誌，方便調試
  console.log('[getPost] Trying to fetch post. ID:', id, 'API URL:', apiUrl);

  if (!apiUrl) {
    console.error("Error: NEXT_PUBLIC_ADMIN_API_BASE_URL is not configured.");
    // 考慮拋出錯誤或返回特定錯誤狀態，而不是 null，以便上游更好地區分
    // throw new Error("API URL not configured");
    return null;
  }

  // 最好也檢查一下 id 是否有效
  if (!id || typeof id !== 'string') {
    console.error("Error: Invalid id received in getPost:", id);
    return null;
  }

  try {
    // *** 使用正確的模板字符串語法 ***
    const url = `${apiUrl}/posts/${id}`;
    console.log('[getPost] Fetching URL:', url); // 打印最終 URL 確保正確

    const res = await fetch(url, { cache: 'no-store' }); // 使用修正後的 url

    // 404 處理
    if (res.status === 404) {
      notFound(); // 調用 Next.js 的 notFound 函數
    }

    // 其他錯誤處理
    if (!res.ok) {
      // 嘗試讀取錯誤訊息體，如果有的話
      let errorBody = '';
      try {
        errorBody = await res.text(); // 或者 res.json() 如果後端返回 JSON 錯誤
      } catch (_) {
        // 忽略讀取 body 的錯誤
      }
      throw new Error(`Failed to fetch post ${id}: ${res.status} ${res.statusText}. Body: ${errorBody}`);
    }

    // 解析 JSON，最好也加上類型
    // const post: PostType = await res.json(); // 假設你有 PostType 類型
    // return post;
    return res.json();

  } catch (error) {
    // 可以在這裡更細緻地區分錯誤類型
    console.error(`[getPost] Fetching post ${id} failed:`, error);
    // 根據錯誤類型決定是返回 null 還是向上拋出錯誤
    // 例如，如果是 URL 解析本身的錯誤，可能是配置問題，向上拋出可能更合適
    // throw error; // 如果希望頁面顯示通用錯誤
    return null; // 如果希望頁面處理 null 狀態
  }
}

// 页面组件接收 params 作为 props
export default async function PostPage({ params: { id } }: { params: { id: string } }) {
  console.log("Page parameter ID (destructured in signature):", id);
  const post = await getPost(id); // 直接使用 id


  if (!post) {
    // 如果 getPost 返回 null (例如配置错误)，也可以触发 notFound
    // 或者显示一个通用的错误消息
    notFound();
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-700 mb-2">By {post.author?.name || post.author?.email || 'Unknown Author'}</p>
      <div className="prose lg:prose-xl">
        {/* 假设 content 是 Markdown 或纯文本 */}
        <p>{post.content || 'No content available.'}</p>
      </div>
      {/* 编辑按钮 */}
      <Link href={`/admin/edit/${post.id}`} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm">
        Edit
      </Link>
      {/* 删除按钮 */}
      <DeletePostButton postId={post.id} />
      {/* 可以添加返回链接 */}
      <Link href="/">Back to posts</Link>
    </main >
  );
}