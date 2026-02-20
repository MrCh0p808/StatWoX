"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, LineChart, Line, FunnelChart,
    Funnel, LabelList
} from "recharts";
import { TrendingUp, Users, Clock, BarChart3, Target, Download } from "lucide-react";

const CHART_COLORS = ['#00d4ff', '#00ff88', '#ff6b6b', '#ffd93d', '#6c5ce7', '#fd79a8', '#00b894', '#e17055'];

interface DashboardProps {
    surveyId: string;
}

export function AnalyticsDashboard({ surveyId }: DashboardProps) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [nps, setNps] = useState<any>(null);
    const [funnel, setFunnel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, npsRes, funnelRes] = await Promise.all([
                    fetch(`/api/surveys/${surveyId}/analytics`),
                    fetch(`/api/surveys/${surveyId}/analytics/nps`),
                    fetch(`/api/surveys/${surveyId}/analytics/funnel`)
                ]);

                const [analyticsData, npsData, funnelData] = await Promise.all([
                    analyticsRes.json(),
                    npsRes.json(),
                    funnelRes.json()
                ]);

                if (analyticsData.success) setAnalytics(analyticsData.data);
                if (npsData.success) setNps(npsData.data);
                if (funnelData.success) setFunnel(funnelData.data);
            } catch (error) {
                console.error('Analytics fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [surveyId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <BarChart3 className="h-12 w-12 text-primary/30" />
                    <p className="text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return <p className="text-center text-muted-foreground py-12">No analytics data available yet.</p>;
    }

    const { totalResponses, completionRate, averageTime, questionBreakdown } = analytics;

    return (
        <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={<Users className="h-5 w-5" />} label="Total Responses" value={totalResponses} />
                <StatCard icon={<Target className="h-5 w-5" />} label="Completion Rate" value={`${completionRate}%`} />
                <StatCard icon={<Clock className="h-5 w-5" />} label="Avg. Time" value={averageTime ? `${Math.round(averageTime / 60)}m` : 'N/A'} />
                <StatCard icon={<TrendingUp className="h-5 w-5" />} label="NPS Score" value={getNPSScore(nps)} />
            </div>

            <Tabs defaultValue="responses" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="responses">Responses</TabsTrigger>
                    <TabsTrigger value="nps">NPS</TabsTrigger>
                    <TabsTrigger value="funnel">Funnel</TabsTrigger>
                    <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                </TabsList>

                <TabsContent value="responses" className="space-y-6">
                    {questionBreakdown?.map((q: any, idx: number) => (
                        <Card key={q.questionId} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{q.title}</CardTitle>
                                <Badge variant="outline" className="w-fit">{q.type} • {q.totalAnswers} answers</Badge>
                            </CardHeader>
                            <CardContent>
                                {(q.type === 'multipleChoice' || q.type === 'checkbox') ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(q.answerDistribution).map(([name, value]) => ({ name, value }))}
                                                cx="50%" cy="50%" outerRadius={80}
                                                dataKey="value" label={({ name, percent }: any) => `${name || ''} (${(((percent as number) ?? 0) * 100).toFixed(0)}%)`}
                                            >
                                                {Object.keys(q.answerDistribution).map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : q.type === 'rating' ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={Object.entries(q.answerDistribution).map(([name, value]) => ({ rating: name, count: value }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="rating" stroke="rgba(255,255,255,0.5)" />
                                            <YAxis stroke="rgba(255,255,255,0.5)" />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {Object.entries(q.answerDistribution).slice(0, 10).map(([answer, count]) => (
                                            <div key={answer} className="flex items-center justify-between py-1 px-2 bg-muted/10 rounded">
                                                <span className="text-sm truncate max-w-[70%]">{answer}</span>
                                                <Badge variant="secondary">{count as number}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="nps">
                    {nps?.nps && Object.entries(nps.nps).length > 0 ? (
                        Object.entries(nps.nps).map(([qId, data]: [string, any]) => (
                            <Card key={qId} className="mt-4">
                                <CardHeader>
                                    <CardTitle className="text-lg">{data.questionTitle}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="text-center">
                                        <div className={`text-6xl font-bold ${data.score >= 50 ? 'text-green-400' : data.score >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {data.score}
                                        </div>
                                        <p className="text-muted-foreground mt-1">Net Promoter Score</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={[
                                            { name: 'Promoters', value: data.promoterPct, fill: '#00ff88' },
                                            { name: 'Passives', value: data.passivePct, fill: '#ffd93d' },
                                            { name: 'Detractors', value: data.detractorPct, fill: '#ff6b6b' }
                                        ]}>
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                            <YAxis stroke="rgba(255,255,255,0.5)" />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {[0, 1, 2].map(i => <Cell key={i} fill={['#00ff88', '#ffd93d', '#ff6b6b'][i]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No rating questions found for NPS calculation.</p>
                    )}
                </TabsContent>

                <TabsContent value="funnel">
                    {funnel ? (
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Response Funnel</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {funnel.totalCompleted}/{funnel.totalStarted} completed ({funnel.overallCompletionRate}%)
                                </p>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={funnel.funnel?.map((s: any) => ({
                                        name: s.page <= (funnel.funnel.length - 1) ? `Page ${s.page}` : 'Submitted',
                                        responses: s.started,
                                        dropOff: s.dropOffRate
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                        <YAxis stroke="rgba(255,255,255,0.5)" />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        <Bar dataKey="responses" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No funnel data available.</p>
                    )}
                </TabsContent>

                <TabsContent value="breakdown">
                    <Card className="mt-4">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {questionBreakdown?.map((q: any) => (
                                    <div key={q.questionId} className="p-4 border rounded-lg bg-muted/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">{q.title}</p>
                                                <Badge variant="outline" className="text-xs">{q.type}</Badge>
                                            </div>
                                            <span className="text-2xl font-bold text-primary">{q.totalAnswers}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {Object.entries(q.answerDistribution).slice(0, 5).map(([answer, count]) => {
                                                const pct = q.totalAnswers > 0 ? ((count as number) / q.totalAnswers) * 100 : 0;
                                                return (
                                                    <div key={answer} className="flex items-center gap-2">
                                                        <div className="w-24 text-xs truncate text-muted-foreground">{answer}</div>
                                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs w-12 text-right">{pct.toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">{icon}</div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function getNPSScore(nps: any): string {
    if (!nps?.nps) return 'N/A';
    const scores = Object.values(nps.nps) as any[];
    if (scores.length === 0) return 'N/A';
    return String(scores[0]?.score ?? 'N/A');
}
