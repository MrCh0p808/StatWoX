"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Layout, Users, Heart, TrendingUp, BookOpen, Star } from "lucide-react";

const CATEGORIES = [
    { value: '', label: 'All', icon: Layout },
    { value: 'feedback', label: 'Feedback', icon: Heart },
    { value: 'nps', label: 'NPS', icon: TrendingUp },
    { value: 'satisfaction', label: 'Satisfaction', icon: Star },
    { value: 'quiz', label: 'Quiz', icon: BookOpen },
    { value: 'rsvp', label: 'RSVP', icon: Users },
];

interface TemplateMarketplaceProps {
    onSelect: (template: any) => void;
}

export function TemplateMarketplace({ onSelect }: TemplateMarketplaceProps) {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, [category]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category) params.set('category', category);
            const res = await fetch(`/api/templates?${params}`);
            const data = await res.json();
            if (data.success) setTemplates(data.data.templates);
        } catch {
            toast({ title: "Failed to load templates", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const filtered = search
        ? templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
        : templates;

    return (
        <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(c => (
                        <Button key={c.value} variant={category === c.value ? "default" : "outline"} size="sm"
                            onClick={() => setCategory(c.value)}>
                            <c.icon className="h-3 w-3 mr-1" /> {c.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Template Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-muted/10 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Layout className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No templates found. Create a survey and save it as a template!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(template => (
                        <Card key={template.id} className="hover:border-primary/50 transition-all cursor-pointer group"
                            onClick={() => onSelect(template)}>
                            <CardContent className="pt-6 space-y-3">
                                <div className="flex items-start justify-between">
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{template.name}</h3>
                                    <Badge variant="outline" className="text-xs capitalize">{template.category}</Badge>
                                </div>
                                {template.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                                )}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex gap-1">
                                        {template.tags?.slice(0, 3).map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                        ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{template.usageCount} uses</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
