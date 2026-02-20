'use client';

import { MessageSquare, FileText, Vote, ArrowRight, MessageCircle, Heart, Users, Globe, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Survey } from '@/types';

interface SurveyCardProps {
    survey: Survey;
    onClick: () => void;
}

const categoryConfig = {
    survey: {
        icon: MessageSquare,
        color: 'from-[#00d4ff] to-[#0066ff]',
        bgColor: 'bg-[#00d4ff]/10',
        textColor: 'text-[#00d4ff]'
    },
    form: {
        icon: FileText,
        color: 'from-[#00ff88] to-[#00cc66]',
        bgColor: 'bg-[#00ff88]/10',
        textColor: 'text-[#00ff88]'
    },
    poll: {
        icon: Vote,
        color: 'from-[#ff00aa] to-[#ff6699]',
        bgColor: 'bg-[#ff00aa]/10',
        textColor: 'text-[#ff00aa]'
    },
};

export function SurveyCard({ survey, onClick }: SurveyCardProps) {
    const config = categoryConfig[survey.category as keyof typeof categoryConfig] || categoryConfig.survey;
    const Icon = config.icon;

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#111827] rounded-2xl border border-[#1e3a5f] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-[#00d4ff]/10 hover:-translate-y-1 hover:border-[#00d4ff]/50"
        >
            {survey.mediaUrl && survey.mediaType === 'image' && (
                <div className="relative h-32 overflow-hidden">
                    <img
                        src={survey.mediaUrl}
                        alt={survey.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
                </div>
            )}

            {survey.mediaUrl && survey.mediaType === 'video' && (
                <div className="relative h-32 overflow-hidden bg-[#1e3a5f] flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent z-10" />
                    <Play className="w-12 h-12 text-white/50 z-20" />
                </div>
            )}

            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />

            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <div className="flex items-center gap-2">
                        {survey.shareType === 'community' ? (
                            <Badge variant="secondary" className="text-xs bg-[#1e3a5f] text-[#00d4ff] border-0">
                                <Users className="w-3 h-3 mr-1" />
                                Community
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-xs bg-[#1e3a5f] text-[#94a3b8] border-0">
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs bg-[#1e3a5f] text-[#94a3b8] border-0 capitalize">
                            {survey.category}
                        </Badge>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#00d4ff] transition-colors">
                    {survey.title}
                </h3>

                {survey.caption && (
                    <p className="text-sm text-[#94a3b8] mb-3 line-clamp-2">
                        {survey.caption}
                    </p>
                )}

                {survey.description && !survey.caption && (
                    <p className="text-sm text-[#94a3b8] mb-3 line-clamp-2">
                        {survey.description}
                    </p>
                )}

                <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-6 w-6 border border-[#1e3a5f]">
                        <AvatarImage src={survey.author?.image || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-[#00d4ff] to-[#0066ff] text-white">
                            {survey.author?.name?.[0] || survey.author?.username?.[0] || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-[#94a3b8]">
                        {survey.author?.name || survey.author?.username || 'Anonymous'}
                    </span>
                    <span className="text-xs text-[#64748b]">·</span>
                    <span className="text-xs text-[#64748b]">
                        {formatTimeAgo(survey.createdAt)}
                    </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1e3a5f]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-[#94a3b8]">
                            <Heart className="w-4 h-4" />
                            <span>{survey.likeCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-[#94a3b8]">
                            <MessageCircle className="w-4 h-4" />
                            <span>{survey.commentCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-[#94a3b8]">
                            <MessageSquare className="w-4 h-4" />
                            <span>{survey.responseCount}</span>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#64748b] group-hover:text-[#00d4ff] transition-colors group-hover:translate-x-1 duration-200" />
                </div>
            </div>
        </div>
    );
}
