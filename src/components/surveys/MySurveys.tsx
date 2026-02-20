"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import {
    MoreHorizontal,
    Plus,
    Search,
    Pencil,
    Trash2,
    Eye,
    BarChart2,
    Copy,
    Globe,
    Lock
} from "lucide-react";
import { format } from "date-fns";

interface Survey {
    id: string;
    title: string;
    status: "draft" | "published" | "closed";
    responses: number;
    createdAt: string;
    updatedAt: string;
    visibility: "public" | "private" | "community";
}

export function MySurveys() {
    const router = useRouter();
    const { toast } = useToast();
    const { token } = useAuthStore();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Mock data fetching
    useEffect(() => {
        // In a real app, fetch from API
        const loadSurveys = async () => {
            setLoading(true);
            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Mock data
                setSurveys([
                    {
                        id: "1",
                        title: "Customer Satisfaction Survey 2024",
                        status: "published",
                        responses: 128,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        visibility: "public"
                    },
                    {
                        id: "2",
                        title: "Product Feedback",
                        status: "draft",
                        responses: 0,
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        updatedAt: new Date(Date.now() - 86400000).toISOString(),
                        visibility: "community"
                    },
                    {
                        id: "3",
                        title: "Internal Team Pulse",
                        status: "closed",
                        responses: 45,
                        createdAt: new Date(Date.now() - 172800000).toISOString(),
                        updatedAt: new Date(Date.now() - 172800000).toISOString(),
                        visibility: "private"
                    }
                ]);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load surveys",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadSurveys();
        }
    }, [token, toast]);

    const filteredSurveys = surveys.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            setSurveys(prev => prev.filter(s => s.id !== deleteId));
            toast({
                title: "Survey deleted",
                description: "The survey has been permanently deleted.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete survey",
                variant: "destructive"
            });
        } finally {
            setDeleteId(null);
        }
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/survey/${id}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link copied",
            description: "Survey link copied to clipboard",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Surveys</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your surveys, polls, and forms
                    </p>
                </div>
                <Button onClick={() => router.push("/create")} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search surveys..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Responses</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading surveys...
                                </TableCell>
                            </TableRow>
                        ) : filteredSurveys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No surveys found. Create one to get started!
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSurveys.map((survey) => (
                                <TableRow key={survey.id}>
                                    <TableCell className="font-medium">
                                        {survey.title}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                survey.status === "published" ? "default" :
                                                    survey.status === "draft" ? "secondary" : "outline"
                                            }
                                        >
                                            {survey.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            {survey.visibility === "public" && <Globe className="h-3 w-3" />}
                                            {survey.visibility === "private" && <Lock className="h-3 w-3" />}
                                            <span className="capitalize">{survey.visibility}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{survey.responses}</TableCell>
                                    <TableCell>
                                        {format(new Date(survey.updatedAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/builder/${survey.id}`)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/survey/${survey.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Preview
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/analytics/${survey.id}`)}>
                                                    <BarChart2 className="mr-2 h-4 w-4" />
                                                    Analytics
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => copyLink(survey.id)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copy Link
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeleteId(survey.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            survey and all collected response data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
