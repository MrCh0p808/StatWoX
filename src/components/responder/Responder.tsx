"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle2, Clock, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getVisibleQuestionsForPage, getVisiblePages } from "@/lib/skipLogic";
import { ConversationalResponder } from "./ConversationalResponder";

export function Responder({ surveyId }: { surveyId: string | null }) {
    const router = useRouter();
    const { toast } = useToast();
    const [survey, setSurvey] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [startTime] = useState(Date.now());
    const [countdown, setCountdown] = useState<string | null>(null);
    const [geolocation, setGeolocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!surveyId) return;
        fetch(`/api/surveys/${surveyId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.survey) {
                    setSurvey(data.data.survey);
                    // Request geolocation
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => setGeolocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            () => { } // Silently fail if denied
                        );
                    }
                } else {
                    toast({ title: "Survey not found", variant: "destructive" });
                    router.push("/feed");
                }
            })
            .catch(() => toast({ title: "Error loading survey", variant: "destructive" }));
    }, [surveyId, router, toast]);

    // Countdown timer
    useEffect(() => {
        if (!survey?.closesAt) return;
        const interval = setInterval(() => {
            const diff = new Date(survey.closesAt).getTime() - Date.now();
            if (diff <= 0) { setCountdown("Expired"); clearInterval(interval); return; }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            setCountdown(days > 0 ? `${days}d ${hours}h left` : `${hours}h ${mins}m left`);
        }, 1000);
        return () => clearInterval(interval);
    }, [survey?.closesAt]);

    if (!survey) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-pulse h-8 w-32 bg-primary/20 rounded-full" />
            </div>
        );
    }

    // Route to conversational mode if enabled
    if (survey.conversational && !isComplete) {
        return <ConversationalResponder survey={survey} onComplete={() => setIsComplete(true)} />;
    }

    // Apply theme if present
    const themeStyle: React.CSSProperties = survey.theme ? {
        '--theme-primary': survey.theme.primaryColor,
        '--theme-bg': survey.theme.backgroundColor,
        '--theme-text': survey.theme.textColor,
    } as any : {};

    const pageNumbers = getVisiblePages(survey.questions || [], answers);
    const totalPages = pageNumbers.length;
    const currentQuestions = getVisibleQuestionsForPage(survey.questions || [], answers, pageNumbers[currentPage - 1] || 1);

    const handleAnswer = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleCheckbox = (questionId: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            return { ...prev, [questionId]: checked ? [...current, option] : current.filter((o: string) => o !== option) };
        });
    };

    const handleFileUpload = async (questionId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                handleAnswer(questionId, data.data.fileUrl);
                toast({ title: "File uploaded successfully" });
            }
        } catch {
            toast({ title: "Upload failed", variant: "destructive" });
        }
    };

    const validatePage = () => {
        for (const q of currentQuestions) {
            if (q.required) {
                const answer = answers[q.id];
                if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
                    toast({ title: "Required", description: `"${q.title}" is required.`, variant: "destructive" });
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => { if (validatePage()) setCurrentPage(prev => Math.min(prev + 1, totalPages)); };
    const handleBack = () => { setCurrentPage(prev => Math.max(prev - 1, 1)); };

    const handleSubmit = async () => {
        if (!validatePage()) return;
        setIsSubmitting(true);

        const duration = Math.round((Date.now() - startTime) / 1000);
        const payload = Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }));

        try {
            const res = await fetch(`/api/surveys/${surveyId}/responses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: payload,
                    metadata: { geolocation, duration, deviceType: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop' }
                })
            });
            const data = await res.json();
            if (data.success) setIsComplete(true);
            else toast({ title: "Submission Failed", description: data.message, variant: "destructive" });
        } catch {
            toast({ title: "Network Error", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isComplete) {
        return (
            <div className="flex h-screen items-center justify-center bg-background p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md text-center space-y-6 bg-card p-10 rounded-2xl shadow-xl border border-primary/20">
                    <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                    <h1 className="text-3xl font-bold">Thank You!</h1>
                    <p className="text-muted-foreground">{survey.thankYouMessage || "Your response has been recorded."}</p>
                    <Button className="w-full" onClick={() => router.push(survey.redirectUrl || '/feed')}>
                        Return Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    const progressPct = ((currentPage - 1) / totalPages) * 100;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col" style={themeStyle}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b backdrop-blur-md">
                <div className="container max-w-3xl mx-auto py-4 px-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold truncate max-w-[300px]">{survey.title}</h1>
                        <p className="text-sm text-muted-foreground">{survey.author?.name || "StatWoX"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {countdown && (
                            <div className="flex items-center gap-1 text-xs text-orange-400">
                                <Clock className="h-3 w-3" />
                                <span>{countdown}</span>
                            </div>
                        )}
                        {survey.showProgress && (
                            <div className="hidden sm:flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground">Step {currentPage}/{totalPages}</span>
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-primary" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {survey.showProgress && (
                    <motion.div className="h-1 bg-primary sm:hidden" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
                )}
            </div>

            {/* Questions */}
            <div className="flex-1 container max-w-3xl mx-auto py-8 px-4 relative">
                {currentPage === 1 && survey.description && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-card border border-primary/20 rounded-xl shadow-lg">
                        <p className="text-lg leading-relaxed whitespace-pre-wrap">{survey.description}</p>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div key={currentPage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6 pb-24">
                        {currentQuestions.map((q: any) => (
                            <Card key={q.id} className="border-border/50 hover:border-primary/30 transition-colors shadow-sm">
                                <CardContent className="pt-6">
                                    <Label className="text-lg font-medium block mb-4">
                                        {survey.showQuestionNumbers && <span className="text-primary mr-2 font-bold">{q.order + 1}.</span>}
                                        {q.title}
                                        {q.required && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    {q.description && <p className="text-muted-foreground text-sm mb-4">{q.description}</p>}

                                    <div className="pl-1 sm:pl-6">
                                        {q.type === "shortText" && (
                                            <Input value={answers[q.id] || ""} onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                placeholder={q.placeholder || "Enter your answer"} className="bg-muted/30 h-12 text-base" />
                                        )}
                                        {q.type === "longText" && (
                                            <Textarea value={answers[q.id] || ""} onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                placeholder={q.placeholder || "Enter your answer"} className="bg-muted/30 min-h-[120px] text-base" />
                                        )}
                                        {q.type === "multipleChoice" && (
                                            <div className="space-y-3">
                                                {q.options?.map((opt: string, i: number) => (
                                                    <label key={i} className={`flex items-start p-4 rounded-xl cursor-pointer border transition-all ${answers[q.id] === opt ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/50'}`}>
                                                        <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt}
                                                            onChange={() => handleAnswer(q.id, opt)} className="mt-1 h-5 w-5" />
                                                        <span className="ml-3 text-base">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === "checkbox" && (
                                            <div className="space-y-3">
                                                {q.options?.map((opt: string, i: number) => {
                                                    const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                                                    return (
                                                        <label key={i} className={`flex items-start p-4 rounded-xl cursor-pointer border transition-all ${isChecked ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/50'}`}>
                                                            <input type="checkbox" checked={isChecked}
                                                                onChange={(e) => handleCheckbox(q.id, opt, e.target.checked)} className="mt-1 h-5 w-5 rounded" />
                                                            <span className="ml-3 text-base">{opt}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {q.type === "rating" && (
                                            <div className="flex gap-2 flex-wrap">
                                                {Array.from({ length: (q.max || 5) - (q.min || 1) + 1 }, (_, i) => i + (q.min || 1)).map(val => (
                                                    <button key={val} onClick={() => handleAnswer(q.id, String(val))}
                                                        className={`w-12 h-12 rounded-xl border-2 font-bold transition-all ${answers[q.id] === String(val) ? 'border-primary bg-primary text-primary-foreground' : 'border-border/50 hover:border-primary/50'}`}>
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === "date" && (
                                            <Input type="date" value={answers[q.id] || ""} onChange={(e) => handleAnswer(q.id, e.target.value)}
                                                className="bg-muted/30 h-12 w-auto" />
                                        )}
                                        {q.type === "matrix" && q.options && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left p-2"></th>
                                                            {(q.options.columns || []).map((col: string) => (
                                                                <th key={col} className="p-2 text-center text-muted-foreground">{col}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(q.options.rows || []).map((row: string) => (
                                                            <tr key={row} className="border-t border-border/30">
                                                                <td className="p-2 font-medium">{row}</td>
                                                                {(q.options.columns || []).map((col: string) => {
                                                                    const key = `${row}::${col}`;
                                                                    const matrixAnswers = answers[q.id] || {};
                                                                    return (
                                                                        <td key={col} className="p-2 text-center">
                                                                            <input type="radio" name={`matrix-${q.id}-${row}`}
                                                                                checked={matrixAnswers[row] === col}
                                                                                onChange={() => handleAnswer(q.id, { ...matrixAnswers, [row]: col })}
                                                                                className="h-4 w-4" />
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        {q.type === "likert" && (
                                            <div className="flex justify-between items-center gap-2">
                                                {['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].map((label, i) => (
                                                    <button key={i} onClick={() => handleAnswer(q.id, String(i + 1))}
                                                        className={`flex-1 py-3 px-2 rounded-xl text-xs text-center border-2 transition-all ${answers[q.id] === String(i + 1) ? 'border-primary bg-primary/10 font-bold' : 'border-border/50 hover:border-primary/50'}`}>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {(q.type === "fileUpload" || q.fileUpload) && (
                                            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                                                {answers[q.id] ? (
                                                    <div className="text-green-400 flex flex-col items-center gap-2">
                                                        <CheckCircle2 className="h-8 w-8" />
                                                        <span>File uploaded</span>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                                        <Upload className="h-8 w-8" />
                                                        <span>Click to upload (max 5MB)</span>
                                                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(q.id, e.target.files[0])} />
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t py-4 px-4 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <div className="container max-w-3xl mx-auto flex items-center justify-between">
                    <Button variant="outline" size="lg" onClick={handleBack} disabled={currentPage === 1 || isSubmitting} className="w-[100px]">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    {currentPage < totalPages ? (
                        <Button onClick={handleNext} disabled={isSubmitting} size="lg" className="w-[120px] bg-primary">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting} size="lg"
                            className="w-[140px] bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-black font-bold">
                            {isSubmitting ? "Submitting..." : "Submit"} {!isSubmitting && <CheckCircle2 className="ml-2 h-5 w-5" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
