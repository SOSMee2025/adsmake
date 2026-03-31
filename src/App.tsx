import { useState, useEffect } from 'react';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import { supabase } from './lib/supabase';
import './index.css';

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>(
    window.location.hash === '#app' ? 'app' : 'landing'
  );
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Escáner maestro para tokens perdidos en URL (Fuerza la sesión si Supabase se duerme)
    if (window.location.hash.includes('access_token')) {
      const hashData = window.location.hash.substring(1);
      const params = new URLSearchParams(hashData);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(() => {
          window.location.hash = 'app';
          setView('app');
        });
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        window.location.hash = 'app';
        setView('app');
      }
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        window.location.hash = 'app';
        setView('app');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      if (window.location.hash === '#app') {
         window.history.back();
      } else {
         window.location.hash = '';
      }
    }
  };

  if (isLoadingAuth) {
    return <div className="app-container" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Cargando ADSmake...</div></div>;
  }

  // Auth gate
  if (view === 'app' && !session) {
    window.location.hash = '';
    return <LandingPage setView={changeView} session={session} forceLogin={true} />;
  }

  if (view === 'landing') {
    return <LandingPage setView={changeView} session={session} />;
  }

  return <Dashboard setView={changeView} session={session} />;
}
