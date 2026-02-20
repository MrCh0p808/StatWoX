import { LoginClientWrapper } from './LoginClientWrapper';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0a0e1a]">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#00d4ff]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#0066ff]/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-[#00ff88]/5 rounded-full blur-[100px]" />
            </div>

            <LoginClientWrapper />
        </div>
    );
}
