"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronUp } from "lucide-react";
import { computeVisibleQuestions } from "@/lib/skipLogic";

interface ConversationalResponderProps {
    survey: any;
    onComplete: () => void;
}

export function ConversationalResponder({ survey, onComplete }: ConversationalResponderProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const visibleIds = computeVisibleQuestions(survey.questions || [], answers);
    const visibleQuestions = (survey.questions || [])
        .filter((q: any) => visibleIds.includes(q.id))
        .sort((a: any, b: any) => a.order - b.order);

    const currentQuestion = visibleQuestions[currentIndex];
    const isLastQuestion = currentIndex >= visibleQuestions.length - 1;
    const progress = visibleQuestions.length > 0 ? ((currentIndex) / visibleQuestions.length) * 100 : 0;

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [currentIndex]);

    // Simulate typing animation when new question appears
    useEffect(() => {
        setIsTyping(true);
        const timer = setTimeout(() => setIsTyping(false), 600);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    const handleAnswer = (value: any) => {
        if (!currentQuestion) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleNext = () => {
        if (!currentQuestion) return;

        if (currentQuestion.required) {
            const answer = answers[currentQuestion.id];
            if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
                toast({ title: "This question is required", variant: "destructive" });
                return;
            }
        }

        if (isLastQuestion) {
            handleSubmit();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleNext();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const payload = Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }));

        try {
            const res = await fetch(`/api/surveys/${survey.id}/responses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: payload })
            });

            const data = await res.json();
            if (data.success) {
                onComplete();
            } else {
                toast({ title: "Submission failed", description: data.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Network error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentQuestion) {
        return <div className="flex items-center justify-center h-screen text-muted-foreground">No questions available.</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <motion.div
                    className="h-1 bg-gradient-to-r from-[#00d4ff] to-[#00ff88]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Question Counter */}
            <div className="fixed top-4 right-6 z-50">
                <span className="text-sm text-muted-foreground font-mono">
                    {currentIndex + 1} / {visibleQuestions.length}
                </span>
            </div>

            {/* Back button */}
            {currentIndex > 0 && (
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    className="fixed top-4 left-6 z-50 p-2 rounded-full hover:bg-muted/20 transition-colors"
                >
                    <ChevronUp className="h-5 w-5 rotate-[-90deg]" />
                </button>
            )}

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl space-y-8"
                    >
                        {/* Question Number */}
                        <div className="flex items-start gap-4">
                            <span className="text-primary font-bold text-lg mt-1">{currentIndex + 1} →</span>
                            <div className="flex-1">
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-2xl sm:text-3xl font-bold leading-tight"
                                >
                                    {currentQuestion.title}
                                    {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
                                </motion.h2>
                                {currentQuestion.description && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-muted-foreground mt-2 text-lg"
                                    >
                                        {currentQuestion.description}
                                    </motion.p>
                                )}
                            </div>
                        </div>

                        {/* Answer Input */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isTyping ? 0 : 1, y: isTyping ? 10 : 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="pl-10"
                        >
                            {currentQuestion.type === 'shortText' && (
                                <Input
                                    ref={inputRef}
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your answer here..."
                                    className="text-xl border-0 border-b-2 border-muted rounded-none bg-transparent px-0 h-14 focus-visible:ring-0 focus-visible:border-primary"
                                />
                            )}
                            {currentQuestion.type === 'longText' && (
                                <Textarea
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                    placeholder="Type your answer here..."
                                    className="text-lg border-0 border-b-2 border-muted rounded-none bg-transparent px-0 min-h-[100px] focus-visible:ring-0 focus-visible:border-primary resize-none"
                                />
                            )}
                            {currentQuestion.type === 'multipleChoice' && (
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((opt: string, i: number) => {
                                        const letter = String.fromCharCode(65 + i);
                                        const isSelected = answers[currentQuestion.id] === opt;
                                        return (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + i * 0.05 }}
                                                onClick={() => { handleAnswer(opt); setTimeout(handleNext, 400); }}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-primary bg-primary/10 shadow-lg' : 'border-border/50 hover:border-primary/50 hover:bg-muted/5'}`}
                                            >
                                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border-2 ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                                    {letter}
                                                </span>
                                                <span className="text-lg">{opt}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                            {currentQuestion.type === 'checkbox' && (
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((opt: string, i: number) => {
                                        const current = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
                                        const isChecked = current.includes(opt);
                                        return (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + i * 0.05 }}
                                                onClick={() => {
                                                    const newVal = isChecked ? current.filter((v: string) => v !== opt) : [...current, opt];
                                                    handleAnswer(newVal);
                                                }}
                                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${isChecked ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/50'}`}
                                            >
                                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${isChecked ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                                    {isChecked && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                                                </div>
                                                <span className="text-lg">{opt}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                            {currentQuestion.type === 'rating' && (
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: (currentQuestion.max || 10) - (currentQuestion.min || 0) + 1 }, (_, i) => i + (currentQuestion.min || 0)).map(val => (
                                        <motion.button
                                            key={val}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + val * 0.03 }}
                                            onClick={() => { handleAnswer(String(val)); setTimeout(handleNext, 400); }}
                                            className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all ${answers[currentQuestion.id] === String(val) ? 'border-primary bg-primary text-primary-foreground scale-110' : 'border-border/50 hover:border-primary/50 hover:scale-105'}`}
                                        >
                                            {val}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {currentQuestion.type === 'date' && (
                                <Input
                                    type="date"
                                    value={answers[currentQuestion.id] || ''}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="text-xl border-0 border-b-2 border-muted rounded-none bg-transparent px-0 h-14 focus-visible:ring-0 focus-visible:border-primary w-auto"
                                />
                            )}
                        </motion.div>

                        {/* Continue Button */}
                        {currentQuestion.type !== 'multipleChoice' && currentQuestion.type !== 'rating' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isTyping ? 0 : 1 }}
                                transition={{ delay: 0.5 }}
                                className="pl-10 flex items-center gap-4"
                            >
                                <Button
                                    onClick={handleNext}
                                    disabled={isSubmitting}
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 text-lg px-8"
                                >
                                    {isSubmitting ? "Submitting..." : isLastQuestion ? "Submit" : "OK"}
                                    {!isSubmitting && <CheckCircle2 className="ml-2 h-5 w-5" />}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    press <kbd className="px-2 py-0.5 rounded bg-muted/20 border border-border/50 text-xs font-mono">Enter ↵</kbd>
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
