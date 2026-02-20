"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Search, Save } from "lucide-react";

interface Question {
    id: string;
    title: string;
    type: string;
    options?: any;
    tags: string[];
}

interface QuestionBankPanelProps {
    onInsert: (question: { title: string; type: string; options?: any }) => void;
}

export function QuestionBankPanel({ onInsert }: QuestionBankPanelProps) {
    const { toast } = useToast();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/question-bank');
            const data = await res.json();
            if (data.success) setQuestions(data.data.questions || []);
        } catch {
            toast({ title: "Failed to load question bank", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const filtered = search
        ? questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()))
        : questions;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Question Bank
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search saved questions..."
                        className="pl-8 h-8 text-sm"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-pulse h-4 w-32 bg-muted/20 rounded" />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        {search ? "No matching questions" : "Save questions to build your library"}
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {filtered.map(q => (
                            <div key={q.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{q.title}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Badge variant="outline" className="text-xs">{q.type}</Badge>
                                        {q.tags?.slice(0, 2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        onInsert({ title: q.title, type: q.type, options: q.options });
                                        toast({ title: "Question added!" });
                                    }}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
