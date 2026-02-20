'use client'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    useEffect(() => {
        console.error('Application Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-slate-950 text-slate-200 rounded-xl border border-slate-800 m-8">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-rose-600 bg-clip-text text-transparent mb-4">
                Something went wrong!
            </h2>
            <p className="text-slate-400 mb-8 max-w-md">
                An unexpected error occurred while rendering this module.
            </p>
            <button
                onClick={() => reset()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] cursor-pointer"
            >
                Try again
            </button>
        </div>
    )
}
