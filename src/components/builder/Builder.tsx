"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Save,
    Eye,
    Send,
    Plus,
    Loader2,
    BookOpen,
} from "lucide-react";
import { SurveySettings, SurveySettingsData } from "./SurveySettings";
import { Card, CardContent } from "@/components/ui/card";
import { SortableQuestionCard } from "./SortableQuestionCard";
import type { Question, QuestionType } from "./SortableQuestionCard";
import { QuestionBankPanel } from "./QuestionBankPanel";
import { ThemeEditor } from "./ThemeEditor";
import type { SurveyTheme } from "@/types";

interface BuilderComponentProps {
    initialData?: any;
    category?: string;
}

export function Builder({ initialData, category }: BuilderComponentProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("build");
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [showQuestionBank, setShowQuestionBank] = useState(false);
    const [theme, setTheme] = useState<SurveyTheme | null>(initialData?.theme || null);

    // DND-04: Pre-drag snapshot for graceful degradation
    const questionsSnapshot = useRef<Question[]>([]);

    // Safety check and parser for initial questions
    const parseQuestions = (qs: any[]): Question[] => {
        return qs.map(q => ({
            id: q.id || crypto.randomUUID(),
            type: (q.type as QuestionType) || "shortText",
            title: q.title || "",
            required: !!q.required,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : (Array.isArray(q.options) ? q.options : undefined),
            min: q.min,
            max: q.max,
            page: q.page || 1,
            logic: q.logic || undefined,
            fileUpload: q.fileUpload || false,
        }));
    };

    const [questions, setQuestions] = useState<Question[]>(() => {
        if (initialData?.questions && Array.isArray(initialData.questions)) {
            return parseQuestions(initialData.questions);
        }
        return [{ id: "1", type: "multipleChoice" as QuestionType, title: "Untitled Question", required: false, options: ["Option 1"], page: 1 }];
    });

    // Helper to merge partial settings with defaults
    const getSettingsDefaults = (partial: any): SurveySettingsData => ({
        visibility: partial?.visibility || "public",
        allowAnonymous: partial?.allowAnonymous !== undefined ? partial.allowAnonymous : true,
        requiresLogin: partial?.requiresLogin || false,
        passwordProtected: partial?.passwordProtected || false,
        password: partial?.password,
        multipleResponses: partial?.multipleResponses || false,
        responseLimit: partial?.responseLimit,
        closingDate: partial?.closingDate ? new Date(partial.closingDate) : undefined,
        showProgressBar: partial?.showProgressBar !== undefined ? partial.showProgressBar : true,
        showQuestionNumbers: partial?.showQuestionNumbers !== undefined ? partial.showQuestionNumbers : true,
        shuffleQuestions: partial?.shuffleQuestions || false,
        thankYouMessage: partial?.thankYouMessage || "Thank you for completing the survey!",
        redirectUrl: partial?.redirectUrl
    });

    const [settings, setSettings] = useState<SurveySettingsData>(() =>
        getSettingsDefaults(initialData?.settings)
    );

    // ─── DND-02: Sensors & Drag Handlers ───────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }, // 8px threshold prevents accidental drags
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = useCallback((_event: DragStartEvent) => {
        // DND-04: Snapshot current order before drag begins
        questionsSnapshot.current = [...questions];
    }, [questions]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setQuestions((prev) => {
            const oldIndex = prev.findIndex((q) => q.id === active.id);
            const newIndex = prev.findIndex((q) => q.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });
    }, []);

    // ─── Question CRUD ─────────────────────────────────────────
    const addQuestion = () => {
        const newQ: Question = {
            id: crypto.randomUUID(),
            type: "multipleChoice",
            title: "New Question",
            required: false,
            options: ["Option 1", "Option 2"],
            page: questions.length > 0 ? questions[questions.length - 1].page : 1
        };
        setQuestions([...questions, newQ]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const deleteQuestion = (id: string) => {
        if (questions.length === 1) {
            toast({ title: "Cannot delete", description: "Survey must have at least one question.", variant: "destructive" });
            return;
        }
        setQuestions(questions.filter(q => q.id !== id));
    };

    const duplicateQuestion = (id: string) => {
        const q = questions.find(q => q.id === id);
        if (!q) return;
        const newQ = { ...q, id: crypto.randomUUID(), title: `${q.title} (Copy)` };
        const idx = questions.findIndex(q => q.id === id);
        const newQuestions = [...questions];
        newQuestions.splice(idx + 1, 0, newQ);
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qId: string, optIdx: number, val: string) => {
        const q = questions.find(q => q.id === qId);
        if (!q || !q.options) return;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        updateQuestion(qId, { options: newOpts });
    };

    const addOption = (qId: string) => {
        const q = questions.find(q => q.id === qId);
        if (!q || !q.options) return;
        updateQuestion(qId, { options: [...q.options, `Option ${q.options.length + 1}`] });
    };

    const removeOption = (qId: string, optIdx: number) => {
        const q = questions.find(q => q.id === qId);
        if (!q || !q.options || q.options.length <= 1) return;
        const newOpts = q.options.filter((_, i) => i !== optIdx);
        updateQuestion(qId, { options: newOpts });
    };

    // ─── DND-03: Real PATCH/POST API ───────────────────────────
    const handleSave = async (publish = false) => {
        if (!title.trim()) {
            toast({ title: "Missing Information", description: "Please provide a survey title.", variant: "destructive" });
            return;
        }

        setIsSaving(true);

        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (!token) {
            toast({ title: "Not authenticated", description: "Please log in first.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        const payload: Record<string, any> = {
            title: title.trim(),
            description: description.trim() || null,
            category: category || initialData?.category || "general",
            isPublic: settings.visibility === "public",
            allowAnon: settings.allowAnonymous,
            showProgress: settings.showProgressBar,
            showQuestionNumbers: settings.showQuestionNumbers,
            shuffleQuestions: settings.shuffleQuestions,
            thankYouMessage: settings.thankYouMessage,
            redirectUrl: settings.redirectUrl || null,
            maxResponses: settings.responseLimit || null,
            closesAt: settings.closingDate?.toISOString() || null,
            questions: questions.map(q => ({
                title: q.title,
                type: q.type,
                required: q.required,
                options: q.options || null,
                min: q.min || null,
                max: q.max || null,
                page: q.page,
                logic: q.logic || null,
                fileUpload: q.fileUpload || false,
            })),
            theme: theme || undefined,
        };

        try {
            const isExisting = !!initialData?.id;
            const url = isExisting ? `/api/surveys/${initialData.id}` : "/api/surveys";
            const method = isExisting ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Save failed");
            }

            // Publish if requested
            if (publish && data.data?.survey?.id) {
                const pubRes = await fetch(`/api/surveys/${data.data.survey.id}/publish`, {
                    method: "PATCH",
                    headers: { "Authorization": `Bearer ${token}` },
                });
                const pubData = await pubRes.json();
                if (!pubRes.ok || !pubData.success) {
                    toast({ title: "Saved but publish failed", description: pubData.message, variant: "destructive" });
                    setIsSaving(false);
                    return;
                }
            }

            toast({
                title: publish ? "Survey Published! 🚀" : "Draft Saved ✓",
                description: publish ? "Your survey is now live." : "All changes saved successfully.",
            });

            if (publish) {
                router.push("/feed");
            } else if (!isExisting && data.data?.survey?.id) {
                // Redirect to edit mode for newly created surveys
                router.push(`/builder/${data.data.survey.id}`);
            }
        } catch (error: any) {
            console.error("Save error:", error);

            // DND-04: Revert to snapshot if we had a drag in progress
            if (questionsSnapshot.current.length > 0) {
                setQuestions(questionsSnapshot.current);
                questionsSnapshot.current = [];
            }

            toast({
                title: "Save Failed",
                description: error.message || "Could not save your survey. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-background text-foreground">
            {/* Top Bar */}
            <div className="border-b bg-card px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/feed")}>
                        &larr; Back
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="border-none shadow-none text-lg font-semibold bg-transparent hover:bg-muted/50 w-[300px]"
                        placeholder="Survey Title"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Draft
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab("preview")}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                    <Button size="sm" className="bg-primary" onClick={() => handleSave(true)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Publish
                    </Button>
                </div>
            </div>

            <div className="flex-1 container max-w-5xl mx-auto py-8 px-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid w-[400px] grid-cols-3">
                            <TabsTrigger value="build">Build</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="build" className="space-y-6">
                        {/* Title / Description Card */}
                        <Card className="border-t-4 border-t-primary">
                            <CardContent className="pt-6 space-y-4">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
                                    placeholder="Survey Title"
                                />
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="resize-none border-none shadow-none px-0 focus-visible:ring-0 text-muted-foreground"
                                    placeholder="Form description"
                                />
                            </CardContent>
                        </Card>

                        {/* DND-02: Sortable Question List */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={questions.map(q => q.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {questions.map((q) => (
                                        <SortableQuestionCard
                                            key={q.id}
                                            question={q}
                                            allQuestions={questions}
                                            onUpdate={updateQuestion}
                                            onDelete={deleteQuestion}
                                            onDuplicate={duplicateQuestion}
                                            onOptionChange={handleOptionChange}
                                            onAddOption={addOption}
                                            onRemoveOption={removeOption}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        <div className="flex gap-2">
                            <Button onClick={addQuestion} className="flex-1 py-8 border-dashed border-2" variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Add Question
                            </Button>
                            <Button onClick={() => setShowQuestionBank(!showQuestionBank)} className="py-8 border-dashed border-2" variant="outline">
                                <BookOpen className="mr-2 h-4 w-4" /> {showQuestionBank ? 'Hide' : 'Question Bank'}
                            </Button>
                        </div>

                        {showQuestionBank && (
                            <QuestionBankPanel onInsert={(bankQ) => {
                                const newQ: Question = {
                                    id: crypto.randomUUID(),
                                    type: (bankQ.type as QuestionType) || 'shortText',
                                    title: bankQ.title,
                                    required: false,
                                    options: bankQ.options ? (Array.isArray(bankQ.options) ? bankQ.options : undefined) : undefined,
                                    page: questions.length > 0 ? questions[questions.length - 1].page : 1,
                                };
                                setQuestions(prev => [...prev, newQ]);
                            }} />
                        )}
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardContent className="pt-6">
                                <SurveySettings settings={settings} onSettingsChange={setSettings} />
                            </CardContent>
                        </Card>
                        <ThemeEditor value={theme} onChange={setTheme} />
                    </TabsContent>

                    <TabsContent value="preview" className="flex justify-center">
                        <div
                            className="w-full max-w-2xl border rounded-lg p-8 bg-card shadow-lg transition-all"
                            style={theme ? {
                                backgroundColor: theme.backgroundColor,
                                color: theme.textColor,
                                fontFamily: theme.fontFamily,
                                borderRadius: theme.borderRadius,
                            } : {}}
                        >
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold">{title || "Untitled Survey"}</h1>
                                <p className="text-muted-foreground mt-2">{description}</p>
                            </div>

                            <div className="space-y-8">
                                {Array.from(new Set(questions.map(q => q.page))).sort((a, b) => a - b).map(pageNum => (
                                    <div key={`page-${pageNum}`} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px bg-border flex-1" />
                                            <Badge variant="outline" className="text-muted-foreground bg-muted/20">Page {pageNum}</Badge>
                                            <div className="h-px bg-border flex-1" />
                                        </div>
                                        {questions.filter(q => q.page === pageNum).map((q, idx) => (
                                            <div key={q.id} className="space-y-2 p-4 border border-border/50 rounded-lg bg-muted/5">
                                                <Label className="text-base font-medium">
                                                    {settings.showQuestionNumbers && <span className="mr-1">{idx + 1}.</span>}
                                                    {q.title}
                                                    {q.required && <span className="text-destructive ml-1">*</span>}
                                                </Label>
                                                <div className="pt-1">
                                                    {q.type === "shortText" && <Input placeholder="Your answer" disabled />}
                                                    {q.type === "longText" && <Textarea placeholder="Your answer" disabled />}
                                                    {q.type === "multipleChoice" && (
                                                        <div className="space-y-2 opacity-70">
                                                            {q.options?.map((opt, i) => (
                                                                <div key={i} className="flex items-center space-x-2">
                                                                    <div className="h-4 w-4 rounded-full border border-primary/50" />
                                                                    <span>{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.type === "checkbox" && (
                                                        <div className="space-y-2 opacity-70">
                                                            {q.options?.map((opt, i) => (
                                                                <div key={i} className="flex items-center space-x-2">
                                                                    <div className="h-4 w-4 rounded-sm border border-primary/50" />
                                                                    <span>{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.type === "rating" && (
                                                        <div className="flex gap-2">
                                                            {Array.from({ length: (q.max || 5) - (q.min || 1) + 1 }, (_, i) => i + (q.min || 1)).map(val => (
                                                                <div key={val} className="w-10 h-10 rounded-lg border flex items-center justify-center text-sm">{val}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {q.type === "date" && <Input type="date" disabled className="w-auto" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t flex justify-between items-center">
                                {settings.showProgressBar && (
                                    <div className="w-1/3 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-0" />
                                    </div>
                                )}
                                <Button disabled>Submit</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
