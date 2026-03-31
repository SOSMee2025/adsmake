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
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = async () => {
      console.log("ADSmake: Sincronizando estado de autenticación...");
      
      // 1. Detectar tokens de OAuth en la URL
      if (window.location.hash.includes('access_token')) {
        console.log("ADSmake: Detectado token OAuth, importando sesión...");
        const hashParams = new URLSearchParams(window.location.hash.substring(1).replace(/#/g, '&'));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        
        if (access_token && refresh_token) {
          try {
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            console.log("ADSmake: Sesión OAuth inyectada con éxito:", data.user?.email);
            window.location.hash = 'app';
          } catch (e) {
            console.error("ADSmake: Error fatal al inyectar sesión:", e);
          }
        }
      }

      // 2. Obtener sesión actual
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      // 3. Determinar vista inicial
      if (currentSession) {
        if (window.location.hash !== '#app') window.location.hash = 'app';
        setView('app');
      } else {
        if (window.location.hash === '#app') setView('app'); // Permitir puerta de auth
        else setView('landing');
      }
      
      setIsLoadingAuth(false);
    };

    syncAuth();
    
    // Captura errores globales de red
    window.addEventListener('unhandledrejection', (e) => {
      if (e.reason?.message?.includes('Supabase')) {
        setAuthError("Error de Conexión: " + e.reason.message);
      }
    });

    // Listener de cambios de sesión (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("ADSmake: Cambio de Auth detectado:", event);
      setSession(newSession);
      if (newSession) {
        if (window.location.hash !== '#app') window.location.hash = 'app';
        setView('app');
      } else {
        setView('landing');
      }
    });

    // Listener de navegación manual (Atrás/Adelante)
    const handleHash = () => {
      const isApp = window.location.hash === '#app';
      setView(isApp ? 'app' : 'landing');
    };

    window.addEventListener('hashchange', handleHash);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const changeView = (newView: 'landing' | 'app') => {
    window.location.hash = newView === 'app' ? 'app' : '';
  };

  if (isLoadingAuth) {
    return (
      <div className="app-container" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ textAlign: 'center' }}>
          <div className="gradient-text-primary" style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ADSmake.ai</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sincronizando con satélites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      {authError && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ff4444', color: '#fff', padding: '10px', zIndex: 10000, textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
          ⚠️ {authError}
        </div>
      )}
      {view === 'landing' 
        ? <LandingPage setView={changeView} session={session} />
        : (view === 'app' && !session)
          ? <LandingPage setView={changeView} session={session} forceLogin={true} />
          : <Dashboard setView={changeView} session={session} />
      }
    </div>
  );
}
