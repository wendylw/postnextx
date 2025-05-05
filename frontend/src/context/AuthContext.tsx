'use client'; // Context needs to be used in Client Components

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Use App Router's router

// Define the shape of the user object (adjust based on your actual user data)
interface User {
  id: string;
  email: string;
  name?: string | null;
  // Add other relevant user fields like roles, permissions etc.
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  isLoading: boolean; // To handle loading states (e.g., initial check, login process)
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// Create the context with a default value (null or an object with default values)
const AuthContext = createContext<AuthContextType | null>(null);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// --- Environment Variable for API Base URL ---
// Ensure this is set in your.env.local and prefixed with NEXT_PUBLIC_
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL;
// --------------------------------------------

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until initial check is done
  const router = useRouter();
  // Function to check authentication status on initial load
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    if (!API_BASE_URL) {
      console.error("API_BASE_URL is not configured.");
      setIsLoading(false);
      setUser(null); // Assume not logged in if API URL is missing
      return;
    }
    try {
      // Attempt to fetch user data - assumes backend verifies session via HttpOnly cookie
      // Adjust endpoint ('/me', '/validate', etc.) and method as needed
      const response = await fetch(`${API_BASE_URL}/users/profile`, { // EXAMPLE ENDPOINT
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Important: Include credentials if your backend relies on cookies for session verification
        credentials: 'include',
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
      } else {
        setUser(null); // Not authenticated or error occurred
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies, runs once on mount

  // Run the check on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (!API_BASE_URL) {
      setIsLoading(false);
      return { success: false, error: "API URL is not configured." };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        // Important: Include credentials if backend sets HttpOnly cookies upon login
        credentials: 'include',
      });

      if (response.ok) {
        const loginData = await response.json();
        // Assuming backend returns user data in loginData.user
        // Adjust based on your actual API response structure
        if (loginData.user) {
          setUser(loginData.user);
          setIsLoading(false);
          return { success: true };
        } else {
          // Handle cases where login is ok but user data is missing
          setIsLoading(false);
          return { success: false, error: 'Login successful, but user data missing.' };
        }
      } else {
        // Handle login failure (e.g., 401 Unauthorized)
        const errorData = await response.json().catch(() => ({ message: 'Invalid credentials or server error' }));
        setIsLoading(false);
        return {
          success: false, error: errorData.message || `Login failed with status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      return {
        success: false, error: error.message || 'An unexpected error occurred during login.'
      };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    if (!API_BASE_URL) {
      console.error("API_BASE_URL is not configured.");
      setIsLoading(false);
      // Still clear local state even if API call fails
      setUser(null);
      router.push('/login'); // Redirect to login page
      router.refresh(); // Attempt to refresh layout/data
      return;
    }

    try {
      // Call the backend logout endpoint
      // Use GET '/logout' if following the cache invalidation pattern [1]
      // Use POST '/api/auth/logout' if backend expects POST to invalidate tokens/clear cookies
      const response = await fetch(`${API_BASE_URL}/auth/logout`, { // Or GET '/logout'
        method: 'POST', // Or 'GET'
        headers: {
          'Content-Type': 'application/json',
        },
        // Important: Include credentials so backend can identify session/cookies to clear
        credentials: 'include',
      });

      if (!response.ok && response.status !== 204) { // 204 No Content is also a success
        // Log error but proceed with client-side logout anyway
        console.error(`Logout API call failed with status: ${response.status}`);
      }

    } catch (error) {
      console.error('Logout error:', error);
      // Proceed with client-side logout even if API call fails
    } finally {
      setUser(null); // Clear user state on the client
      setIsLoading(false);
      // Redirect to login page after logout
      // Using window.location.href for a full page reload might be necessary
      // if you encounter caching issues with Next.js <Link> or router.push [1]
      // router.push('/login');
      window.location.href = '/login'; // Force full reload
    }
  };

  // Value provided by the context
  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};