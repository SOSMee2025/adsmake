import { useState } from 'react';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import './index.css';

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');

  if (view === 'landing') {
    return <LandingPage setView={setView} />;
  }

  return <Dashboard setView={setView} />;
}
