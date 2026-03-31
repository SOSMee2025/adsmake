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
      console.log("ADSmake: Sincronizando estado...");
      
      // 1. Detectar si estamos en medio de un login OAuth
      const hasToken = window.location.hash.includes('access_token');
      
      if (hasToken) {
        console.log("ADSmake: OAuth en progreso, esperando validación...");
        // Damos un respiro para que Supabase procese el token automáticamente
        await new Promise(r => setTimeout(r, 1000));
      }

      // 2. Obtener sesión persistente
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthError("Fallo al obtener sesión: " + error.message);
      }

      setSession(initialSession);
      
      // 3. Decidir vista
      if (initialSession) {
        setView('app');
        if (window.location.hash !== '#app') window.location.hash = 'app';
      } else if (!hasToken) {
        // Solo resetear a landing si NO estamos esperando un token
        if (window.location.hash === '#app') setView('app');
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
