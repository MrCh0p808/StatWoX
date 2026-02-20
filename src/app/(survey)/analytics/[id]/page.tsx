'use client';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useParams } from 'next/navigation';

export default function AnalyticsPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : null;
    if (!id) return <div className="flex h-screen items-center justify-center text-muted-foreground">Survey not found</div>;
    return <AnalyticsDashboard surveyId={id} />;
}
