'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // Import useParams and useRouter
import DeletePostButton from '@/components/DeletePostButton';

// Interface for the Post object (example, adjust as needed)
interface Post {
  id: string; // Or number, depending on your API
  title: string;
  content?: string;
  author?: { // Optional author object
    name?: string;
    email?: string;
  };
  // Add other fields as needed
}

// --- Custom Hook: usePost ---
function usePost(id: string | undefined | null) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Get router for potential redirects

  useEffect(() => {
    // Don't fetch if id is not available yet
    if (!id || typeof id !== 'string') {
      // Decide how to handle invalid/missing id early on
      // For now, we just don't fetch, but you might want to set an error
      setIsLoading(false); // Stop loading if no valid id
      return;
    }

    // Reset state for new fetch
    setIsLoading(true);
    setError(null);
    setPost(null);

    const fetchPost = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
      console.log('[usePost Hook] Trying to fetch post. ID:', id, 'API URL:', apiUrl);

      if (!apiUrl) {
        console.error("Error: NEXT_PUBLIC_ADMIN_API_BASE_URL is not configured.");
        setError("API URL is not configured.");
        setIsLoading(false);
        return;
      }

      try {
        const url = `${apiUrl}/posts/${id}`;
        console.log('[usePost Hook] Fetching URL:', url);

        const res = await fetch(url); // No cache needed for client-side fetch

        // Handle 404 Not Found specifically
        if (res.status === 404) {
          setError(`Post with ID ${id} not found.`);
          // Optionally redirect to a 404 page:
          // router.push('/not-found'); // Or your custom 404 route
          setIsLoading(false);
          return; // Stop execution
        }

        // Handle other non-successful responses
        if (!res.ok) {
          let errorBody = '';
          try {
            errorBody = await res.text();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            errorBody = 'Failed to read error body';
          }
          throw new Error(`Failed to fetch post ${id}: ${res.status} ${res.statusText}. Body: ${errorBody}`);
        }

        // Parse the JSON response
        const fetchedPost: Post = await res.json();
        setPost(fetchedPost); // Set the fetched post data

      } catch (err) {
        console.error(`[usePost Hook] Fetching post ${id} failed:`, err);
        if (err instanceof Error) {
          setError(err.message); // Set error state from caught error
        } else {
          setError("An unknown error occurred during fetching.");
        }
      } finally {
        setIsLoading(false); // Ensure loading is set to false in all cases
        console.log('[usePost Hook] Finished fetching post attempt.');
      }
    };

    fetchPost();

    // Dependency array: re-run effect if id changes
  }, [id, router]); // Include router if used for navigation inside effect

  // Return the state variables
  return { post, isLoading, error };
}


// --- Updated Page Component ---
export default function PostPage() {
  // Use useParams hook to get route parameters in Client Components
  const params = useParams<{ id: string }>(); // Specify expected param structure
  const { id } = params || {}; // Destructure id, handle potential undefined params

  // Use the custom hook to fetch data
  const { post, isLoading, error } = usePost(id);

  // 1. Handle Loading State
  if (isLoading) {
    return (
      <main className="container mx-auto p-4 text-center">
        <p>Loading post...</p>
      </main>
    );
  }

  // 2. Handle Error State (including 404 handled by the hook)
  if (error) {
    return (
      <main className="container mx-auto p-4 text-center">
        <p className="text-red-500">Error: {error}</p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm mt-4 inline-block">Back to posts</Link>
      </main>
    );
  }

  // 3. Handle case where post is null but no error (should ideally not happen if id is valid)
  if (!post) {
    // This case might indicate an issue if id was valid but fetch didn't error or return data
    // Or if the initial id was invalid/null and fetching didn't start.
    // You could show a specific message or redirect.
    return (
      <main className="container mx-auto p-4 text-center">
        <p>Post data is unavailable.</p>
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm mt-4 inline-block">Back to posts</Link>
      </main>
    );
  }


  // 4. Render the post content if loading is done, no error, and post exists
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-700 mb-2">By {post.author?.name || post.author?.email || 'Unknown Author'}</p>
      <div className="prose lg:prose-xl mb-4">
        <p>{post.content || 'No content available.'}</p>
      </div>
      <div className="flex space-x-2 items-center">
        <Link href={`/admin/edit/${post.id}`} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs">
          Edit
        </Link>
        <DeletePostButton postId={post.id} />
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm">Back to posts</Link>
      </div>
    </main>
  );
}
