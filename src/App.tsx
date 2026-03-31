import { useState, useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import './index.css';

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>(
    window.location.hash === '#app' ? 'app' : 'landing'
  );

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#app') {
        setView('app');
      } else {
        setView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeView = (newView: 'landing' | 'app') => {
    if (newView === 'app') {
      window.location.hash = 'app';
    } else {
      // Clear hash completely (or go back in history if possible)
      if (window.location.hash === '#app') {
         window.history.back(); // Native back behavior
      } else {
         window.location.hash = '';
      }
    }
  };

  if (view === 'landing') {
    return <LandingPage setView={changeView} />;
  }

  return <Dashboard setView={changeView} />;
}
