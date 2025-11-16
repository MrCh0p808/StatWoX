import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- MOCK DATA ---
const mockPublicSurveys = {
    featured: [
        { id: '101', title: 'Community Gaming Habits', responses: 1205, author: 'GameDev Weekly' },
        { id: '102', title: 'Future of Remote Work', responses: 876, author: 'Workplace Insights' },
        { id: '103', title: 'Annual Developer Ecosystem', responses: 3450, author: 'CodeStack' },
    ],
    trending: [
        { id: '201', title: 'What\'s your favorite JS Framework?', responses: 982, author: 'Frontend Masters' },
        { id: '202', title: 'AI in Creative Arts: A Poll', responses: 765, author: 'ArtGen' },
        { id: '203', title: 'The Ultimate Pizza Topping Duel', responses: 5432, author: 'FoodieFun' },
    ],
    quickPolls: [
        { id: '301', title: 'Tabs vs. Spaces?', responses: 11034, author: 'DevHumor' },
        { id: '302', title: 'Is a hotdog a sandwich?', responses: 9001, author: 'The Big Questions' },
        { id: '303', title: 'Light Mode or Dark Mode?', responses: 2348, author: 'UI/UX Collective' },
    ]
}

// --- SVG ICONS ---
const StatwoxLogo = ({className = "w-16 h-16"}) => (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-indigo-400" style={{stopColor: 'currentColor'}} />
            <stop offset="100%" className="text-indigo-600" style={{stopColor: 'currentColor'}} />
            </linearGradient>
        </defs>
        <path fill="url(#grad1)" d="M128 0 L158.4 69.6 L236.8 69.6 L174.4 112.8 L204.8 182.4 L128 139.2 L51.2 182.4 L81.6 112.8 L19.2 69.6 L97.6 69.6 Z M128 41.6 L112.8 96 L60.8 96 L102.4 128 L87.2 182.4 L128 156.8 L168.8 182.4 L153.6 128 L195.2 96 L143.2 96 Z" />
    </svg>
);
const PlusIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);
const BellIcon = ({className = "w-6 h-6"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
);
const UserCircleIcon = () => (
    <svg className="w-8 h-8 text-gray-400 dark:text-gray-400 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd"></path></svg>
);
const DocumentTextIcon = ({className = "w-5 h-5 mr-3"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);
const HomeIcon = ({className = "w-5 h-5 mr-3"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
);
const UserIcon = ({className = "w-5 h-5 mr-3"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const SearchIcon = ({className = "w-5 h-5"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);
const MenuIcon = ({className = "w-6 h-6"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const XIcon = ({className = "w-6 h-6"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);
const GoogleIcon = ({className = "w-5 h-5"}) => (
    <svg className={className} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-5.067 2.4-4.354 0-7.893-3.573-7.893-7.96s3.539-7.96 7.893-7.96c2.32 0 3.893 1.04 4.8 1.973l2.6-2.587C18.16.933 15.667 0 12.48 0 5.867 0 .333 5.393.333 12.013s5.534 12.013 12.147 12.013c3.2 0 5.6-1.08 7.4-2.84 1.88-1.88 2.667-4.48 2.667-7.467 0-.533-.053-1.02-.12-1.48h-9.88z" fill="currentColor"/></svg>
);
const PhoneIcon = ({className = "w-5 h-5"}) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
);
const SunIcon = ({className}) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const MoonIcon = ({className}) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>);
const LogoutIcon = ({className}) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);

// --- GLOBAL CONFIG ---
// @ts-ignore
const API_BASE_URL = window.STATWOX_API_URL || 'http://localhost:5000';


// --- APP STATE ---
type View = 'surveys' | 'feed' | 'profile';
type ProfileTab = 'account' | 'security';
type HomeFeedTab = 'featured' | 'trending' | 'quickPolls';
type Theme = 'light' | 'dark';
type Survey = {
    id: string;
    title: string;
    responses: number;
    status: 'Published' | 'Draft';
    author?: string;
};


// --- HOOKS ---
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}


// --- COMPONENTS ---

const Header = ({ onMenuClick, theme, setTheme, onLogout }: { onMenuClick: () => void, theme: Theme, setTheme: (theme: Theme) => void, onLogout: () => void }) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useClickOutside(notificationRef, () => setNotificationsOpen(false));
    useClickOutside(profileRef, () => setProfileOpen(false));

    return (
        <header className="bg-white/5 dark:bg-black/20 backdrop-blur-lg border-b border-black/10 dark:border-white/10 sticky top-0 z-20 text-gray-800 dark:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={onMenuClick}
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none"
                            aria-label="Open sidebar"
                        >
                            <MenuIcon />
                        </button>
                    </div>
                     <div className="hidden lg:flex lg:w-1/3"></div>
                    <div className="flex-1 flex justify-center lg:w-1/3">
                        <div className="statwox-title">StatWoX</div>
                    </div>

                    <div className="flex items-center justify-end lg:w-1/3 space-x-4">
                        <div className="relative" ref={notificationRef}>
                            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none">
                                <BellIcon />
                            </button>
                            {notificationsOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm font-semibold">Notifications</div>
                                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">New response on "Customer Satisfaction"</a>
                                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">Your poll "Tabs vs Spaces" is trending!</a>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={profileRef}>
                            <button onClick={() => setProfileOpen(!profileOpen)} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none">
                                <UserCircleIcon />
                            </button>
                            {profileOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem">Change Profile Photo</a>
                                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem">
                                            <span>Change Theme</span>
                                            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                        </button>
                                        <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700" role="menuitem">
                                            <LogoutIcon className="w-5 h-5 mr-2" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

const SurveyCard = ({ survey }: { survey: Survey }) => (
    <div 
        className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-lg p-5 shadow-lg group cursor-pointer text-gray-800 dark:text-white"
        style={{ perspective: '1000px' }}
        role="button"
        tabIndex={0}
        aria-label={`View survey: ${survey.title}`}
    >
        <div className="transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-x-3">
             <div className="absolute -inset-2 bg-indigo-500/30 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
                <h3 className="text-lg font-semibold truncate">{survey.title}</h3>
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17z"></path></svg>
                        {survey.responses} Responses
                    </span>
                    {survey.status && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            survey.status === 'Published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                            {survey.status}
                        </span>
                    )}
                </div>
                 {survey.author && <p className="text-xs text-gray-500 mt-2">by {survey.author}</p>}
            </div>
        </div>
    </div>
);


const MySurveys = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    useEffect(() => {
        const fetchSurveys = async () => {
            try {
                const token = localStorage.getItem('statwox_token');
                if (!token) {
                    throw new Error('Authentication token not found.');
                }

                const response = await fetch(`${API_BASE_URL}/api/surveys`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch surveys.');
                }

                const data = await response.json();
                setSurveys(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSurveys();
    }, []);


    const CreationCard = ({ title, description, icon }) => (
        <button className="w-full text-left p-6 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg transition-all transform hover:scale-105">
            <div className="flex items-center">
                <div className="p-3 bg-indigo-500/20 rounded-lg mr-4">{icon}</div>
                <div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>
        </button>
    );

    return (
    <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Surveys</h1>
                <div className="flex-grow lg:flex-grow-0"></div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full lg:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors">
                <PlusIcon />
                Create New
                </button>
            </div>

            {isLoading && <p>Loading surveys...</p>}
            {error && <p className="text-red-400">{error}</p>}
            {!isLoading && !error && surveys.length === 0 && (
                <div className="text-center py-12 bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg">
                    <h3 className="text-xl font-semibold">No Surveys Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click "Create New" to get started.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map(survey => (
                    <SurveyCard key={survey.id} survey={survey} />
                ))}
            </div>
        </div>

        {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-100/10 dark:bg-gray-900/50 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-2xl p-8 relative fade-in">
                    <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <XIcon />
                    </button>
                    <h2 className="text-2xl font-bold mb-6 text-center">What would you like to create?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CreationCard title="Form" description="Collect detailed information." icon={<DocumentTextIcon className="w-6 h-6 text-indigo-400"/>} />
                        <CreationCard title="Survey" description="Gather feedback & opinions." icon={<svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
                        <CreationCard title="Poll" description="A quick, single question." icon={<svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>} />
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

const HomeFeed = () => {
    const [activeTab, setActiveTab] = useState<HomeFeedTab>('featured');

    const tabs: {id: HomeFeedTab, label: string}[] = [
        { id: 'featured', label: 'Featured' },
        { id: 'trending', label: 'Trending' },
        { id: 'quickPolls', label: 'Quick Polls' },
    ];

    const FeedRow = ({ surveys }: { surveys: any[] }) => (
        <div className="relative md:pl-2 lg:pl-0">
            <div className="grid grid-cols-1 gap-6 md:flex md:overflow-x-auto md:space-x-6 md:pb-6 md:scroll-smooth hide-scrollbar md:[scroll-snap-type:x_mandatory]">
                <div className="hidden md:block md:flex-shrink-0 md:w-2 lg:w-0"></div>
                {surveys.map(survey => (
                    <div key={survey.id} className="md:w-80 md:flex-shrink-0 md:[scroll-snap-align:start]">
                        <SurveyCard survey={survey} />
                    </div>
                ))}
                <div className="hidden md:block md:flex-shrink-0 md:w-2 lg:w-0"></div>
            </div>
            <div className="absolute top-0 right-0 bottom-6 w-16 bg-gradient-to-l from-gray-200/50 dark:from-slate-900/50 to-transparent pointer-events-none hidden md:block"></div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'featured': return <FeedRow surveys={mockPublicSurveys.featured} />;
            case 'trending': return <FeedRow surveys={mockPublicSurveys.trending} />;
            case 'quickPolls': return <FeedRow surveys={mockPublicSurveys.quickPolls} />;
            default: return null;
        }
    };
    
    return (
        <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-4">Home Feed</h1>
                <div className="w-full max-w-lg lg:max-w-xs my-4">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <div className="relative text-gray-500 dark:text-gray-400 focus-within:text-gray-200">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><SearchIcon /></div>
                        <input id="search" className="block w-full bg-white/5 dark:bg-white/5 py-2 pl-10 pr-3 border border-black/10 dark:border-white/10 rounded-md leading-5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white/10 dark:focus:bg-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition" placeholder="Search" type="search" name="search"/>
                    </div>
                </div>
                <div className="border-b border-black/10 dark:border-white/10">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${ activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-500' }`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:px-0 lg:px-0">
                <div key={activeTab} className="fade-in">{renderContent()}</div>
            </div>
        </div>
    );
};

const Profile = () => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('account');
    const inputClasses = "mt-1 block w-full bg-white/5 dark:bg-white/5 border-black/10 dark:border-white/10 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const disabledInputClasses = "mt-1 block w-full bg-black/10 dark:bg-black/20 border-black/10 dark:border-white/10 rounded-md shadow-sm text-gray-500 dark:text-gray-400 cursor-not-allowed";
    const cardClasses = "bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-lg";
    const cardFooterClasses = "p-6 bg-black/5 dark:bg-black/20 rounded-b-lg flex justify-end";
    
    const renderTabContent = () => {
        if (activeTab === 'security') {
            return (
                <div className="flex flex-col gap-8">
                     <div className={cardClasses}>
                        <div className="p-6"><h3 className="text-lg font-semibold">Change Password</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your password for enhanced security.</p></div>
                        <div className="p-6 border-t border-black/10 dark:border-white/10"><div className="grid grid-cols-1 gap-y-6"><div><label className="block text-sm font-medium">Current Password</label><input type="password" className={inputClasses} /></div><div><label className="block text-sm font-medium">New Password</label><input type="password" className={inputClasses} /></div></div></div>
                        <div className={cardFooterClasses}><button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Save Changes</button></div>
                    </div>
                    <div className={cardClasses}>
                        <div className="p-6"><h3 className="text-lg font-semibold">Two-Factor Authentication</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add an extra layer of security to your account.</p></div>
                        <div className="p-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between"><p className="text-sm">Status: <span className="font-semibold text-red-500 dark:text-red-400">Disabled</span></p><button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Enable</button></div>
                    </div>
                     <div className="mt-8 border-2 border-red-500/50 rounded-lg">
                        <div className="p-6"><h3 className="text-lg font-semibold text-red-500 dark:text-red-400">Danger Zone</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Permanently delete your account and all associated data.</p></div>
                        <div className="p-6 border-t border-red-500/50 flex items-center justify-between"><p className="text-sm">This action is irreversible.</p><button className="px-4 py-2 border border-red-500 text-sm font-medium rounded-md shadow-sm text-red-500 dark:text-red-400 hover:bg-red-500/20">Delete Account</button></div>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold">Profile Picture</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your avatar.</p>
                     <div className="mt-4 flex items-center space-x-4"><div className="w-20 h-20 rounded-full bg-black/10 dark:bg-black/20 flex items-center justify-center"><UserIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" /></div><button className="px-4 py-2 border border-black/10 dark:border-white/10 text-sm font-medium rounded-md shadow-sm hover:bg-black/5 dark:hover:bg-white/5">Change</button></div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-8">
                     <div className={cardClasses}>
                        <div className="p-6"><h3 className="text-lg font-semibold">User Details</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Edit your username and email.</p></div>
                        <div className="p-6 border-t border-black/10 dark:border-white/10"><div className="grid grid-cols-1 gap-y-6"><div><label className="block text-sm font-medium">Username</label><input type="text" defaultValue="V3ND377A" className={inputClasses} /></div><div><label className="block text-sm font-medium">Email Address</label><input type="email" disabled defaultValue="v3nd377a@example.com" className={disabledInputClasses} /></div></div></div>
                        <div className={cardFooterClasses}><button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Save Changes</button></div>
                    </div>
                     <div className={cardClasses}>
                        <div className="p-6"><h3 className="text-lg font-semibold">Connected Accounts</h3><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage third-party accounts connected to StatWoX.</p></div>
                        <div className="p-6 border-t border-black/10 dark:border-white/10"><button className="w-full flex items-center justify-center space-x-3 px-4 py-2 border border-black/10 dark:border-white/10 text-sm font-medium rounded-md shadow-sm hover:bg-black/5 dark:hover:bg-white/5"><GoogleIcon /><span>Connect with Google</span></button></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        <div className="flex border-b border-black/10 dark:border-white/10 mb-8">
            <button onClick={() => setActiveTab('account')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'account' ? 'border-indigo-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Account</button>
            <button onClick={() => setActiveTab('security')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'security' ? 'border-indigo-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Security</button>
        </div><div>{renderTabContent()}</div>
    </div>
    );
};

const Sidebar = ({ activeView, setActiveView, isOpen, setIsOpen }: { activeView: View, setActiveView: (view: View) => void, isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) => {
    const navItems = [
        { id: 'feed', label: 'Home Feed', icon: HomeIcon },
        { id: 'surveys', label: 'My Surveys', icon: DocumentTextIcon },
        { id: 'profile', label: 'Profile', icon: UserIcon },
    ];

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
            <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-white/5 dark:bg-black/20 backdrop-blur-xl border-r border-black/10 dark:border-white/10 p-4 flex-shrink-0 z-40 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} text-gray-800 dark:text-white`}>
                <div className="flex items-center justify-between h-16 mb-4 px-2"><div className="w-full text-center lg:text-left"><span className="text-xl font-bold">Menu</span></div><button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden"><XIcon /></button></div>
                <nav className="flex flex-col space-y-2">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => { setActiveView(item.id as View); setIsOpen(false); }} className={`flex items-center p-2 rounded-md text-sm font-medium transition-colors duration-200 ${ activeView === item.id ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white' }`}>
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
};

const Login = ({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        const endpoint = isLogin ? '/login' : '/register';
        const payload = isLogin 
            ? { email: formData.email, password: formData.password }
            : { email: formData.email, password: formData.password, username: formData.username };

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            if (isLogin) {
                onLoginSuccess(data.token);
            } else {
                setSuccessMessage('Account created successfully! Please sign in.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
                    <div className="flex justify-center"><StatwoxLogo /></div>
                    <h2 className="text-center text-3xl font-extrabold text-white">{isLogin ? 'Sign in to StatWoX' : 'Create an Account'}</h2>
                    {error && <p className="text-center text-red-400 bg-red-500/20 p-3 rounded-md">{error}</p>}
                    {successMessage && <p className="text-center text-green-400 bg-green-500/20 p-3 rounded-md">{successMessage}</p>}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (<div><label className="block text-sm font-medium text-gray-300">Username</label><input type="text" name="username" value={formData.username} onChange={handleInputChange} required className="mt-1 block w-full bg-white/5 border-white/10 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" /></div>)}
                        <div><label className="block text-sm font-medium text-gray-300">Email address</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full bg-white/5 border-white/10 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" /></div>
                        <div><label className="block text-sm font-medium text-gray-300">Password</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="mt-1 block w-full bg-white/5 border-white/10 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" /></div>
                        {!isLogin && (<div><label className="block text-sm font-medium text-gray-300">Confirm Password</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required className="mt-1 block w-full bg-white/5 border-white/10 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" /></div>)}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
                    </form>
                    <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900 text-gray-400">Or continue with</span></div></div>
                    <div className="grid grid-cols-2 gap-4">
                         <button className="w-full inline-flex justify-center items-center py-2 px-4 border border-white/10 rounded-md shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10"><GoogleIcon className="mr-2" />Google</button>
                         <button className="w-full inline-flex justify-center items-center py-2 px-4 border border-white/10 rounded-md shadow-sm bg-white/5 text-sm font-medium text-white hover:bg-white/10"><PhoneIcon className="mr-2" />Mobile</button>
                    </div>
                     <p className="text-center text-sm text-gray-400">{isLogin ? "Don't have an account?" : "Already have an account?"}<button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }} className="font-medium text-indigo-400 hover:text-indigo-300 ml-1">{isLogin ? 'Sign up' : 'Sign in'}</button></p>
                </div>
            </div>
        </div>
    );
};


const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<View>('feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const token = localStorage.getItem('statwox_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('statwox_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('statwox_token');
    setIsAuthenticated(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'surveys': return <MySurveys />;
      case 'feed': return <HomeFeed />;
      case 'profile': return <Profile />;
      default: return <HomeFeed />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen flex text-gray-900 dark:text-white`}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} theme={theme} setTheme={setTheme} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto bg-gray-200/50 dark:bg-transparent">
            <div key={activeView} className="fade-in">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
