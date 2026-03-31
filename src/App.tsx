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
    const initAuth = async () => {
      // 1. Verificar si regresamos de un OAuth (token en URL)
      if (window.location.hash.includes('access_token')) {
        const hashData = window.location.hash.substring(1);
        const params = new URLSearchParams(hashData.replace(/#/g, '&'));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          window.location.hash = 'app';
          setView('app');
        }
      }

      // 2. Obtener sesión persistente
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      setSession(existingSession);
      if (existingSession && window.location.hash !== '#app') {
        window.location.hash = 'app';
        setView('app');
      }
      setIsLoadingAuth(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        window.location.hash = 'app';
        setView('app');
      }
      if (event === 'SIGNED_OUT') {
        window.location.hash = '';
        setView('landing');
      }
    });

    const handleHashChange = () => {
      if (window.location.hash === '#app') {
        setView('app');
      } else {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
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
