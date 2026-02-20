'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Vote, Plus, Search, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SurveyCard } from './SurveyCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { View, Survey } from '@/types';
import { useRouter } from 'next/navigation';

type FeedTab = 'featured' | 'trending' | 'quickPolls';

export function HomeFeed() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<FeedTab>('featured');
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSurveys();
    }, [activeTab]);

    const fetchSurveys = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/feed?tab=${activeTab}`);
            const data = await response.json();
            if (data.success && data.data) {
                setSurveys(data.data.surveys || []);
            } else {
                setSurveys([]);
            }
        } catch (error) {
            console.error('Failed to fetch surveys:', error);
            setSurveys([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSurveyClick = (surveyId: string) => {
        router.push(`/responder/${surveyId}`);
    };

    const filteredSurveys = Array.isArray(surveys)
        ? surveys.filter(survey =>
            survey.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const getShareTypeIcon = (shareType: string) => {
        switch (shareType) {
            case 'community':
                return <Users className="w-3.5 h-3.5" />;
            case 'public':
            default:
                return <Globe className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Home Feed</h1>
                    <p className="text-[#94a3b8] mt-1">
                        Discover and participate in public surveys, polls, and forms
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/builder/new')}
                    size="sm"
                    className="bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:from-[#00c8ff] hover:to-[#0088ff] w-full sm:w-auto shadow-lg shadow-[#00d4ff]/25 btn-hover-lift"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative max-w-md"
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <Input
                    placeholder="Search surveys, polls, forms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#111827] border-[#1e3a5f] text-white placeholder:text-[#64748b] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 transition-all"
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)}>
                    <TabsList className="bg-[#111827] border border-[#1e3a5f] h-auto p-1 gap-1">
                        <TabsTrigger value="featured" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d4ff] data-[state=active]:to-[#0066ff] data-[state=active]:text-white text-[#94a3b8] transition-all">
                            <Sparkles className="w-4 h-4" />
                            Featured
                        </TabsTrigger>
                        <TabsTrigger value="trending" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d4ff] data-[state=active]:to-[#0066ff] data-[state=active]:text-white text-[#94a3b8] transition-all">
                            <TrendingUp className="w-4 h-4" />
                            Trending
                        </TabsTrigger>
                        <TabsTrigger value="quickPolls" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d4ff] data-[state=active]:to-[#0066ff] data-[state=active]:text-white text-[#94a3b8] transition-all">
                            <Vote className="w-4 h-4" />
                            Quick Polls
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                >
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="space-y-3 p-6 rounded-xl bg-[#111827] border border-[#1e3a5f]">
                                            <Skeleton className="h-4 w-3/4 bg-[#1e3a5f]" />
                                            <Skeleton className="h-4 w-1/2 bg-[#1e3a5f]" />
                                            <Skeleton className="h-20 w-full bg-[#1e3a5f]" />
                                        </div>
                                    ))}
                                </motion.div>
                            ) : filteredSurveys.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-center py-12 bg-[#111827] rounded-xl border border-[#1e3a5f]"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                                        <Search className="w-8 h-8 text-[#64748b]" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">No surveys found</h3>
                                    <p className="text-[#94a3b8] mb-4">
                                        {searchQuery ? 'Try a different search term' : 'Be the first to create a survey!'}
                                    </p>
                                    <Button onClick={() => router.push('/builder/new')} className="bg-gradient-to-r from-[#00d4ff] to-[#0066ff]">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add New
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                >
                                    {filteredSurveys.map((survey, index) => (
                                        <motion.div
                                            key={survey.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <SurveyCard
                                                survey={survey}
                                                onClick={() => handleSurveyClick(survey.id)}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </div>
    );
}
