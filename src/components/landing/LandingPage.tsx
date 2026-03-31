import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Star, Zap, Bot, ShieldCheck, Clock, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  setView: (view: 'landing' | 'app') => void;
}

const TypingEffect = () => {
  const words = ["imágenes épicas", "videos virales", "conversión masiva"];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <span>
      <span className="gradient-text-primary">{words[index].substring(0, subIndex)}</span>
      <span className="typing-cursor"></span>
    </span>
  );
};

const AnimatedNumber = ({ value, duration = 2500, prefix = "", suffix = "", decimals = 0 }: any) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrame: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo for dramatic slowdown
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(easeProgress * value);
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

const BeforeAfter = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const pos = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  };

  const activeListener = (e: MouseEvent | TouchEvent) => handleMove(e);

  const handleDown = () => {
    window.addEventListener('mousemove', activeListener);
    window.addEventListener('mouseup', () => window.removeEventListener('mousemove', activeListener), { once: true });
    window.addEventListener('touchmove', activeListener as EventListener);
    window.addEventListener('touchend', () => window.removeEventListener('touchmove', activeListener as EventListener), { once: true });
  };

  return (
    <div className="slider-container" ref={containerRef} onMouseDown={handleDown} onTouchStart={handleDown}>
      <img src="/assets/ad_shoe.png" className="slider-img" alt="Generado" />
      <div className="ad-badge" style={{ right: 'auto', left: '1rem', background: 'var(--primary)' }}>Generado por IA en 5s</div>
      <div className="slider-overlay" style={{ width: `${sliderPos}%` }}>
        <img src="/assets/raw_shoe.png" className="slider-img" alt="Original" />
        <div className="ad-badge" style={{ left: 'auto', right: '1rem', background: 'rgba(255,255,255,0.9)', color: '#000' }}>Celular Original</div>
      </div>
      <div className="slider-handle" style={{ left: `${sliderPos}%` }}>
        <div className="slider-handle-btn">
          <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  return (
    <div className="app-container" style={{ overflowX: 'hidden' }}>
      <div className="ambient-background">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>

      <div className="nav-pill-container">
        <nav className="nav-pill">
          <div className="logo cursor-pointer" onClick={() => window.scrollTo(0,0)} style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            <img src="/assets/icon.png" alt="logo" style={{ width: '32px', display: 'none' }} />
            <Bot size={24} className="gradient-text-primary" />
            ADSmake<span style={{ color: 'var(--primary)' }}>.ai</span>
          </div>
          <div className="actions" style={{ gap: '1rem' }}>
            <button className="btn btn-ghost hidden-mobile">Cómo funciona</button>
            <button className="btn btn-ghost hidden-mobile">Precios</button>
            <button className="btn magic-glow" style={{ padding: '0.6rem 1.4rem' }} onClick={() => setView('app')}>Ingresar</button>
          </div>
        </nav>
      </div>

      <main style={{ position: 'relative', zIndex: 10 }}>
        <div className="bg-grid"></div>
        {/* HERO SECTION */}
        <div className="hero hero-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(100, 41, 205, 0.15)', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(100, 41, 205, 0.3)', marginBottom: '2rem' }}>
              <Zap size={16} className="gradient-text-primary" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e0c8ff' }}>Google Gemini 3.1 Pro | Integrado</span>
            </div>
            <h1 className="hero-title-responsive">
              Transforma fotos simples en{' '}
              <div className="typing-container">
                <TypingEffect />
              </div>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '90%', lineHeight: '1.6' }}>
              Olvídate de estudios costosos y diseñadores lentos. Sube el producto que tomaste con tu celular y nuestra IA generará anuncios de nivel SuperBowl listos para Meta Ads y TikTok.
            </p>
            <div className="hero-cta-group">
              <button className="btn magic-glow" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '100px', boxShadow: '0 10px 30px rgba(100, 41, 205, 0.4)' }} onClick={() => setView('app')}>
                Comenzar Gratis <ArrowRight size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <span style={{ fontWeight: 600 }}>4.9/5 de Agencias</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }} className="animate-float">
            {/* The magic element */}
            <BeforeAfter />
          </div>
        </div>

        {/* PERFORMANCE METRICS BAR */}
        <div style={{ padding: '3rem 2rem', margin: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)' }}>
          <div className="metrics-container">
            <div style={{ textAlign: 'center' }}>
              <div className="metric-number" style={{ color: 'var(--primary)' }}><AnimatedNumber value={9.4} decimals={1} suffix="x" /></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Aumento Promedio ROAS</div>
            </div>
            <div className="metric-divider"></div>
            <div style={{ textAlign: 'center' }}>
              <div className="metric-number"><AnimatedNumber value={50} prefix="+" suffix="k" /></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Anuncios Generados</div>
            </div>
            <div className="metric-divider"></div>
            <div style={{ textAlign: 'center' }}>
              <div className="metric-number"><AnimatedNumber value={40} prefix="-" suffix="%" /></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Costo Por Adquisición</div>
            </div>
          </div>
        </div>

        {/* THE PROBLEM SECTION */}
        <div style={{ padding: '6rem 2rem', background: 'var(--bg-background)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="section-title">Tú quieres vender. No pagar agencias ni vivir diseñando.</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '4rem', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
              Pagar $2,000/mes a una agencia y esperar semanas por un par de imágenes... Mientras tanto tu competencia duplica sus ventas con automatización.
            </p>
            
            <div className="cards-grid">
              <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(255,0,0,0.2)' }}>
                <h3 style={{ color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><span style={{ fontSize: '1.5rem' }}>❌</span> La Vía Lenta</h3>
                <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <li>Pagar miles de dólares a estudios fotográficos.</li>
                  <li>Semanas de espera para recibir propuestas de diseño.</li>
                  <li>Imágenes genéricas de stock que no convierten.</li>
                  <li>Inviertes tu presupuesto sin saber si funcionará.</li>
                </ul>
              </div>
              
              <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--primary)', background: 'linear-gradient(135deg, rgba(100, 41, 205, 0.1) 0%, transparent 100%)' }}>
                <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><span style={{ fontSize: '1.5rem' }}>✅</span> El Método ADSmake</h3>
                <ul style={{ listStyle: 'none', padding: 0, color: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem', fontWeight: 500 }}>
                  <li>Toma una foto con tu celular y súbela en segundos.</li>
                  <li>IA entrenada con +$20M en data de ROAS comprobado.</li>
                  <li>10 creativos profesionales hiper-realistas al instante.</li>
                  <li>Listos para Meta Ads y TikTok: Vende inmediatamente.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div style={{ background: '#09090b', padding: '8rem 2rem', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 className="section-title">¿Por qué ADSmake destroza<br /> a la competencia?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>La plataforma más avanzada en el mercado hispano.</p>
            </div>

            <div className="features-grid-3">
              <div className="glass-panel glow-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <Clock size={48} className="gradient-text-primary" style={{ margin: '0 auto 1.5rem auto' }} />
                <h3>Diseños en Segundos</h3>
                <p style={{ color: 'var(--text-muted)' }}>Lo que antes tomaba una semana de estudio fotográfico y diseño, ahora toma exactamente 5 segundos. Escalabilidad infinita.</p>
              </div>
              <div className="glass-panel glow-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <TrendingUp size={48} className="gradient-text-primary" style={{ margin: '0 auto 1.5rem auto' }} />
                <h3>Enfocados en ROAS</h3>
                <p style={{ color: 'var(--text-muted)' }}>Nuestra IA no hace arte abstracto. Analiza millones de anuncios exitosos en Meta Ads y genera pautas con alto CTR garantizado.</p>
              </div>
              <div className="glass-panel glow-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <ShieldCheck size={48} className="gradient-text-primary" style={{ margin: '0 auto 1.5rem auto' }} />
                <h3>Identidad de Marca Intacta</h3>
                <p style={{ color: 'var(--text-muted)' }}>No inventamos productos. El enfoque principal es que el artículo sea 100% idéntico al que subes, sin deformaciones.</p>
              </div>
            </div>
          </div>
        </div>

        {/* INFINITE MARQUEE RESULTS */}
        <div style={{ padding: '6rem 0', textAlign: 'center', overflow: 'hidden' }}>
          <h2 className="section-title-md">Míralo con tus propios ojos</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Agencias y marcas globales ya confían en nosotros.</p>
          
          <div className="marquee-wrapper">
            <div className="marquee-content" style={{ animationDuration: '60s' }}>
              {[
                { src: 'ad_shoe.png', text: '"ADSmake redujo nuestro CPA un 40% este mes."' },
                { src: 'ad_cosmetics.png', text: '"La calidad de las texturas es idéntica a una foto real."' },
                { src: 'ad_watch.png', text: '"Pasamos de 2 ads semanales a 50 diarios."' },
                { src: 'ad_drink.png', text: '"El nivel de detalle en efectos es impresionante."' },
                { src: 'ad_glasses.png', text: '"Dobló nuestro ROAS en la campaña de verano."' },
                { src: 'ad_shoe.png', text: '"La interfaz es adictiva y los resultados absurdos."' },
                { src: 'ad_cosmetics.png', text: '"Despedimos a la agencia. ADSmake rinde x10 más."' }
              ].map((item, i) => (
                <div key={i} className="glass-panel glow-card" style={{ padding: '10px', minWidth: '320px', borderRadius: 'var(--radius-lg)' }}>
                  <img src={`/assets/${item.src}`} style={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }} alt="Demo" />
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                      <Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" /><Star size={14} fill="#f59e0b" />
                    </div>
                    <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)', textAlign: 'left', fontStyle: 'italic' }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA SECTION */}
        <div className="cta-section">
          <h2 className="cta-title">Listo para el futuro de Ads?</h2>
          <button className="btn magic-glow" style={{ padding: '1.25rem 3.5rem', fontSize: '1.25rem', borderRadius: '100px', boxShadow: '0 0 40px rgba(100, 41, 205, 0.5)' }} onClick={() => setView('app')}>
            Crear Anuncios Mágicos Ahora
          </button>
        </div>

      </main>
    </div>
  );
};

export default LandingPage;
