import React, { useState, useEffect, useRef } from 'react';

type View = 'dashboard' | 'compare' | 'aiInsights';

interface HeaderProps {
  onNavigate: (view: View) => void;
  currentView: View;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const scrollThreshold = 60;

      if (!isScrolledRef.current && y > scrollThreshold) {
        isScrolledRef.current = true;
        setIsScrolled(true);
      }
      else if (isScrolledRef.current && y < 10) {
        isScrolledRef.current = false;
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const commonButtonClasses = `font-extrabold rounded-lg transition-all duration-300 flex items-center gap-2 border-2 ${isScrolled ? 'py-1.5 px-3 text-xs' : 'py-2 px-4 text-sm'}`;

  const getButtonClasses = (view: View) => {
    if (currentView === view) {
      return 'bg-westmarc-midnight text-white border-westmarc-midnight';
    }
    return 'bg-transparent text-westmarc-midnight border-westmarc-midnight hover:bg-westmarc-midnight hover:text-white';
  };

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md transition-all duration-500 ease-in-out ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} aria-label="Go to main dashboard">
                <img 
                    src="https://growthzonecmsprodeastus.azureedge.net/sites/1761/2025/04/WESTMARC_Logos_Horizontal_NoTagline-3.png" 
                    alt="WESTMARC Logo"
                    className={`transition-all duration-500 ease-in-out w-auto object-contain ${isScrolled ? 'h-10 md:h-12' : 'h-16 md:h-20'}`}
                />
            </button>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
            <button
                onClick={() => onNavigate('dashboard')}
                className={`${commonButtonClasses} ${getButtonClasses('dashboard')}`}
                aria-current={currentView === 'dashboard' ? 'page' : undefined}
            >
                Dashboard
            </button>
            <button
                onClick={() => onNavigate('compare')}
                className={`${commonButtonClasses} ${getButtonClasses('compare')}`}
                aria-current={currentView === 'compare' ? 'page' : undefined}
            >
                Compare
            </button>
            <button
                onClick={() => onNavigate('aiInsights')}
                className={`${commonButtonClasses} ${getButtonClasses('aiInsights')}`}
                aria-current={currentView === 'aiInsights' ? 'page' : undefined}
            >
                AI Insights
            </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;