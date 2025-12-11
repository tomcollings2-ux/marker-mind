import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include',
            });

            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            // User will see auth errors via login page
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(username: string, password: string) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }

        const userData = await res.json();
        setUser(userData);
    }

    async function register(username: string, email: string, password: string) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
            credentials: 'include',
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Registration failed');
        }

        const userData = await res.json();
        setUser(userData);
    }

    async function logout() {
        const res = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });

        if (res.ok) {
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
