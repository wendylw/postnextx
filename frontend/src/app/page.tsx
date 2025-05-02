import Link from 'next/link'; // 如果要使用 Link，需要導入

// ---> 類型定義 <---
type PostType = {
  id: number;
  title: string;
  content?: string | null;
  author?: {
    name: string | null;
    email?: string;
  } | null;
};

// 定義獲取數據的異步函數
async function getPosts(): Promise<PostType[] | undefined> { // <--- 添加返回值類型
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    console.error("Error: NEXT_PUBLIC_API_BASE_URL is not configured.");
    return undefined; // 返回 undefined 而不是空數組可能更清晰表明是配置錯誤
  }

  try {
    const res = await fetch(`${apiUrl}/posts`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
    }

    // 假設 API 正確返回 PostType 數組
    const posts: PostType[] = await res.json(); // <--- 給解析的數據添加類型
    return posts;
  } catch (error) {
    console.error("Fetching posts failed:", error);
    // 發生錯誤時返回 undefined 或根據需要處理
    // 如果返回空數組，下游需要區分是真沒數據還是出錯了
    return undefined;
  }
}

// 頁面組件
export default async function HomePage() {
  const posts: PostType[] | undefined = await getPosts(); // <--- 給變數添加類型

  // 檢查 posts 是否為 undefined (表示獲取失敗或配置錯誤)
  if (posts === undefined) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">My Blog</h1>
        <p>Error loading posts.</p>
      </main>
    );
  }

  // 檢查 posts 是否為空數組 (表示成功獲取但沒有帖子)
  if (!Array.isArray(posts)) { // 這個檢查理論上可以移除，因為 getPosts 返回值類型已約束
    console.error("Received non-array data for posts:", posts);
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">My Blog</h1>
        <p>Error: Received invalid data for posts.</p>
      </main>
    );
  }


  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Blog</h1>
      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post: PostType) => ( // <--- 使用 PostType
            <div key={post.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-600">By {post.author?.name || post.author?.email || 'Unknown Author'}</p>

              <Link href={`/posts/${post.id}`} className="text-blue-500 hover:underline">
                Read more
              </Link>

            </div>
          ))}
        </div>
      )}
    </main>
  );
}