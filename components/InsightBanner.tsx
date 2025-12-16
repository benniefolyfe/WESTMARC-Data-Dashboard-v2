
import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

const FACTS = [
    "The West Valley is home to 1.7 million residents and growing.",
    "Over 50% of the West Valley population is workforce age (25-54).",
    "Buckeye was one of the fastest growing cities in the US in 2022.",
    "Healthcare and Manufacturing are among the top growth industries in the region.",
    "The Loop 303 corridor is a major hub for logistics and industrial development.",
    "69% of the West Valley workforce commutes outside the region for work—a major opportunity for local employers.",
];

const InsightBanner: React.FC = () => {
    const [factIndex, setFactIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % FACTS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gradient-to-r from-westmarc-midnight to-westmarc-saguaro text-white rounded-lg p-4 shadow-lg flex items-start sm:items-center gap-3 animate-fade-in mb-6 flex-shrink-0">
            <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
                <SparklesIcon className="h-5 w-5 text-westmarc-brittlebrush" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-westmarc-brittlebrush mb-1">Did you know?</p>
                <p className="text-sm sm:text-base font-medium leading-tight min-h-[1.25rem] transition-opacity duration-500">
                    {FACTS[factIndex]}
                </p>
            </div>
        </div>
    )
}

export default InsightBanner;
