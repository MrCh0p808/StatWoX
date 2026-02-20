"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GitBranch, ChevronDown, ChevronRight } from "lucide-react";

interface SkipLogicRule {
    condition: 'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty';
    value: string;
    targetQuestionId: string;
}

interface QuestionRef {
    id: string;
    title: string;
}

interface LogicConfigPanelProps {
    questionId: string;
    rules: SkipLogicRule[];
    allQuestions: QuestionRef[];
    onChange: (rules: SkipLogicRule[]) => void;
}

const CONDITION_LABELS: Record<string, string> = {
    equals: "equals",
    notEquals: "does not equal",
    contains: "contains",
    gt: "is greater than",
    lt: "is less than",
    isEmpty: "is empty",
    isNotEmpty: "is not empty",
};

export function LogicConfigPanel({ questionId, rules, allQuestions, onChange }: LogicConfigPanelProps) {
    const [isOpen, setIsOpen] = useState(rules.length > 0);

    // Only show questions that come AFTER this one as valid targets
    const currentIdx = allQuestions.findIndex(q => q.id === questionId);
    const targetOptions = allQuestions.filter((_, i) => i > currentIdx);

    const addRule = () => {
        const firstTarget = targetOptions[0];
        if (!firstTarget) return;
        onChange([
            ...rules,
            { condition: "equals", value: "", targetQuestionId: firstTarget.id },
        ]);
        setIsOpen(true);
    };

    const updateRule = (index: number, update: Partial<SkipLogicRule>) => {
        const updated = rules.map((r, i) => (i === index ? { ...r, ...update } : r));
        onChange(updated);
    };

    const deleteRule = (index: number) => {
        onChange(rules.filter((_, i) => i !== index));
    };

    const needsValue = (condition: string) => !['isEmpty', 'isNotEmpty'].includes(condition);

    return (
        <div className="border-t mt-2 pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <GitBranch className="h-3 w-3" />
                <span>Skip Logic</span>
                {rules.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                        {rules.length} rule{rules.length !== 1 ? "s" : ""}
                    </Badge>
                )}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    Rule {idx + 1}
                                </Label>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteRule(idx)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Condition */}
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">If answer</Label>
                                <Select
                                    value={rule.condition}
                                    onValueChange={(val) => updateRule(idx, { condition: val as SkipLogicRule["condition"] })}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key} className="text-xs">
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Value (hidden for isEmpty/isNotEmpty) */}
                            {needsValue(rule.condition) && (
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground">Value</Label>
                                    <Input
                                        value={rule.value}
                                        onChange={(e) => updateRule(idx, { value: e.target.value })}
                                        placeholder="e.g. Yes"
                                        className="h-7 text-xs"
                                    />
                                </div>
                            )}

                            {/* Target */}
                            <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Skip to</Label>
                                <Select
                                    value={rule.targetQuestionId}
                                    onValueChange={(val) => updateRule(idx, { targetQuestionId: val })}
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {targetOptions.map((q) => (
                                            <SelectItem key={q.id} value={q.id} className="text-xs">
                                                {q.title || "Untitled"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ))}

                    {/* Add Rule Button */}
                    {targetOptions.length > 0 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary w-full"
                            onClick={addRule}
                        >
                            <Plus className="mr-1 h-3 w-3" /> Add Rule
                        </Button>
                    ) : (
                        <p className="text-[10px] text-muted-foreground text-center py-1">
                            No questions below this one to skip to.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
