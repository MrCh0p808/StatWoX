'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    useEffect(() => {
        console.error('Global Critical Error:', error)
    }, [error])

    return (
        <html lang="en">
            <body className="bg-slate-950 text-slate-200">
                <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-6">
                    <h1 className="text-3xl font-bold text-rose-500">Critical System Error</h1>
                    <p className="text-slate-400 max-w-md">
                        A fatal error prevented the application from loading properly. Our team has been notified.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all cursor-pointer"
                    >
                        Refresh Application
                    </button>
                </div>
            </body>
        </html>
    )
}
