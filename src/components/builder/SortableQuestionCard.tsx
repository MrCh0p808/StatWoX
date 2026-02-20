"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    GripVertical,
    Trash2,
    Copy,
    Plus,
} from "lucide-react";
import { LogicConfigPanel } from "./LogicConfigPanel";

export type QuestionType = "shortText" | "longText" | "multipleChoice" | "checkbox" | "rating" | "date" | "matrix" | "likert" | "fileUpload";

export interface Question {
    id: string;
    type: QuestionType;
    title: string;
    required: boolean;
    options?: string[];
    min?: number;
    max?: number;
    page: number;
    logic?: any;
    fileUpload?: boolean;
}

interface SortableQuestionCardProps {
    question: Question;
    allQuestions: Question[];
    onUpdate: (id: string, updates: Partial<Question>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onOptionChange: (qId: string, optIdx: number, val: string) => void;
    onAddOption: (qId: string) => void;
    onRemoveOption: (qId: string, optIdx: number) => void;
}

export function SortableQuestionCard({
    question: q,
    allQuestions,
    onUpdate,
    onDelete,
    onDuplicate,
    onOptionChange,
    onAddOption,
    onRemoveOption,
}: SortableQuestionCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: q.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card className={`relative group ${isDragging ? "shadow-xl ring-2 ring-primary/40" : ""}`}>
                {/* Drag Handle */}
                <div
                    ref={setActivatorNodeRef}
                    {...listeners}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    aria-label="Drag to reorder"
                >
                    <div className="bg-muted p-1 rounded-md hover:bg-primary/20 transition-colors">
                        <GripVertical className="h-4 w-4" />
                    </div>
                </div>

                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-4">
                            <Input
                                value={q.title}
                                onChange={(e) => onUpdate(q.id, { title: e.target.value })}
                                className="font-medium bg-muted/30"
                                placeholder="Question Title"
                            />

                            {/* Question Type Renderer */}
                            <div className="pt-2">
                                {q.type === "shortText" && (
                                    <Input disabled placeholder="Short answer text" className="w-1/2" />
                                )}
                                {q.type === "longText" && (
                                    <Textarea disabled placeholder="Long answer text" />
                                )}
                                {(q.type === "multipleChoice" || q.type === "checkbox") && (
                                    <div className="space-y-2">
                                        {q.options?.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <div className={`h-4 w-4 border rounded-${q.type === 'multipleChoice' ? 'full' : 'sm'}`} />
                                                <Input
                                                    value={opt}
                                                    onChange={(e) => onOptionChange(q.id, oIdx, e.target.value)}
                                                    className="h-8"
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemoveOption(q.id, oIdx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="ghost" size="sm" className="text-primary" onClick={() => onAddOption(q.id)}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Option
                                        </Button>
                                    </div>
                                )}
                                {q.type === "rating" && (
                                    <div className="flex gap-2">
                                        {Array.from({ length: (q.max || 5) - (q.min || 1) + 1 }, (_, i) => i + (q.min || 1)).map(val => (
                                            <div key={val} className="w-10 h-10 rounded-lg border-2 border-border/50 flex items-center justify-center text-sm font-bold text-muted-foreground">
                                                {val}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {q.type === "date" && (
                                    <Input type="date" disabled className="w-auto" />
                                )}
                                {q.type === "fileUpload" && (
                                    <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center text-muted-foreground text-sm">
                                        File upload zone (preview)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Settings Panel */}
                        <div className="w-[200px] border-l pl-4 space-y-4">
                            <Select value={q.type} onValueChange={(val) => onUpdate(q.id, { type: val as QuestionType })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="shortText">Short Answer</SelectItem>
                                    <SelectItem value="longText">Paragraph</SelectItem>
                                    <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="matrix">Matrix</SelectItem>
                                    <SelectItem value="likert">Likert Scale</SelectItem>
                                    <SelectItem value="fileUpload">File Upload</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Required</Label>
                                <Switch
                                    checked={q.required}
                                    onCheckedChange={(c) => onUpdate(q.id, { required: c })}
                                />
                            </div>

                            <div className="pt-2 border-t flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground">Page Assignment</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={q.page}
                                        onChange={(e) => onUpdate(q.id, { page: parseInt(e.target.value) || 1 })}
                                        className="h-8 w-20"
                                    />
                                </div>
                            </div>

                            {/* Skip Logic Config */}
                            <LogicConfigPanel
                                questionId={q.id}
                                rules={Array.isArray(q.logic) ? q.logic : []}
                                allQuestions={allQuestions.map(aq => ({ id: aq.id, title: aq.title }))}
                                onChange={(rules) => onUpdate(q.id, { logic: rules.length > 0 ? rules : undefined })}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="border-t px-6 py-2 flex justify-end gap-2 bg-muted/10">
                    <Button variant="ghost" size="sm" onClick={() => onDuplicate(q.id)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(q.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
