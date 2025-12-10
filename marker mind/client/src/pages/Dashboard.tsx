import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, LogOut, User, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Board {
    id: string;
    boardName: string;
    createdAt: string;
    updatedAt: string;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [, setLocation] = useLocation();
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch user's boards
    const { data: boards = [], isLoading } = useQuery({
        queryKey: ['/api/boards'],
        queryFn: async () => {
            const res = await fetch('/api/boards', {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch boards');
            return res.json() as Promise<Board[]>;
        },
    });

    // Create board mutation
    const createBoardMutation = useMutation({
        mutationFn: async (boardName: string) => {
            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ boardName }),
            });
            if (!res.ok) throw new Error('Failed to create board');
            return res.json() as Promise<Board>;
        },
        onSuccess: (newBoard) => {
            queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
            toast({ title: 'Board created!', description: `Created "${newBoard.boardName}"` });
            setNewBoardName('');
            setIsCreating(false);
            setLocation(`/board/${newBoard.id}`);
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to create board', variant: 'destructive' });
        },
    });

    // Delete board mutation
    const deleteBoardMutation = useMutation({
        mutationFn: async (boardId: string) => {
            const res = await fetch(`/api/boards/${boardId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to delete board');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
            toast({ title: 'Board deleted' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to delete board', variant: 'destructive' });
        },
    });

    async function handleLogout() {
        await logout();
        setLocation('/login');
    }

    function handleCreateBoard() {
        if (newBoardName.trim()) {
            createBoardMutation.mutate(newBoardName.trim());
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">MarkerMind</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Welcome back, {user?.username}!
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <User className="w-4 h-4" />
                                <span className="hidden sm:inline">{user?.username}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{user?.username}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Create Board Section */}
                <div className="mb-8">
                    {isCreating ? (
                        <Card className="max-w-md">
                            <CardHeader>
                                <CardTitle>Create New Board</CardTitle>
                                <CardDescription>Give your board a name</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Board name"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                                        autoFocus
                                    />
                                    <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
                                        Create
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Button onClick={() => setIsCreating(true)} size="lg">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Create New Board
                        </Button>
                    )}
                </div>

                {/* Boards Grid */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading boards...</p>
                    </div>
                ) : boards.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You don't have any boards yet.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Create your first board to get started!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {boards.map((board) => (
                            <Card
                                key={board.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                                onClick={() => setLocation(`/board/${board.id}`)}
                            >
                                <CardHeader>
                                    <CardTitle className="truncate pr-8">{board.boardName}</CardTitle>
                                    <CardDescription>
                                        Updated {new Date(board.updatedAt).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Board?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete "{board.boardName}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteBoardMutation.mutate(board.id);
                                                        }}
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <div className="flex justify-start">
                                        <Button variant="secondary" size="sm" className="w-full">Open Board</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
