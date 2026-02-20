'use client';
import { Responder } from '@/components/responder/Responder';
import { useParams } from 'next/navigation';

export default function ResponderPage() {
    const params = useParams();
    const id = typeof params?.id === 'string' ? params.id : null;
    return <Responder surveyId={id} />;
}
