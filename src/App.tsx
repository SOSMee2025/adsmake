import React, { useState, useEffect } from 'react';
import {
  Wand2, Video, Download,
  UploadCloud, Sparkles,
  Settings2, Bot, RefreshCw, Layers
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';

export default function App() {
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<{ url: string, part: any } | null>(null);
  const [supportImages, setSupportImages] = useState<{ url: string, part: any }[]>([]);
  const [ratio, setRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [numImages, setNumImages] = useState(4);
  const [error, setError] = useState('');
  const [processStatus, setProcessStatus] = useState("Analyzing request with Gemini AI...");
  const [geminiPrompts, setGeminiPrompts] = useState<{ id: string, title: string, prompt: string, imageUrl?: string, generating?: boolean, videoGenerating?: boolean, videoUrl?: string, failed?: boolean }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxPromptEdit, setLightboxPromptEdit] = useState('');
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [logoImage, setLogoImage] = useState<{ url: string, part: any } | null>(null);
  const [includeLogo, setIncludeLogo] = useState(false);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', userApiKey);
  }, [userApiKey]);

  const getApiKey = () => (userApiKey?.trim() || import.meta.env.VITE_GEMINI_API_KEY?.trim() || "");

  const generateImageViaGemini = async (
    prompt: string,
    refImages: { inlineData: { data: string, mimeType: string } }[] = []
  ): Promise<string> => {
    const key = getApiKey();
    const mName = 'gemini-3.1-flash-image-preview';

    // Explicitly label the first image as the PRODUCT if it's the mainImage
    const parts = [...refImages, { text: prompt }];

    try {
      let res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { responseModalities: ["IMAGE"] }
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (imagePart) {
          return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data.replace(/\s/g, '')}`;
        }
      }
    } catch (e) {
      console.error(`Generation error:`, e);
    }

    throw new Error("No se pudo generar la imagen. Intenta con un prompt más corto o revisa tu clave.");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'support' | 'logo') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPairs = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);
          const part = await new Promise<{ inlineData: { data: string, mimeType: string } }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                  if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                  if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                resolve({ inlineData: { data: base64, mimeType: "image/jpeg" } });
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
          });
          return { url, part };
        })
      );

      if (type === 'main') {
        setMainImage(newPairs[0]);
      } else if (type === 'logo') {
        setLogoImage(newPairs[0]);
        setIncludeLogo(true);
      } else {
        setSupportImages(prev => [...prev, ...newPairs]);
      }
    }
  };

  const handleGenerate = async () => {
    if (!description.trim() && !mainImage) {
      setError("Por favor, ingresa instrucciones o sube una imagen del producto.");
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const apiKey = getApiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const aiModel = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
        generationConfig: { responseMimeType: "application/json" }
      });

      const toGenerate = Math.min(numImages, 10 - geminiPrompts.length);
      if (toGenerate <= 0) { setIsProcessing(false); return; }

      setProcessStatus("Analizando identidad del producto...");

      const ratioDesc = ratio === '1:1' ? 'SQUARE (1:1)' : ratio === '4:5' ? 'PORTRAIT (4:5)' : 'VERTICAL (9:16) Stories';

      const promptText = `
        You are a conversion-expert Meta Ads Creative Director.
        Analyze the product identified as the "MAIN PRODUCT" and create ${toGenerate} ad concepts.
        
        CRITICAL RULES:
        1. The product in the image is SACRED. Do not change its colors, materials, or basic shape.
        2. Use the "ANDROMEDA" methodology: high-end look, social proof (5 stars), feature badges.
        3. All generated copy MUST be in ${language === 'es' ? 'SPANISH' : 'ENGLISH'}.
        
        Ratio: ${ratioDesc}.
        Product Instructions: ${description}
        
        Return JSON array: [{"title": "concept name", "scene": "English cinematic prompt for the product in a lifestyle scene", "headline": "Short punchy headline", "features": ["feature 1", "feature 2"], "cta": "Short CTA"}]
      `;

      // Context for text analysis (Strategy)
      const analysisParts = [];
      if (mainImage) analysisParts.push(mainImage.part);
      if (logoImage) analysisParts.push(logoImage.part);
      // Include support images to help Gemini understand the context/scenarios
      supportImages.slice(0, 3).forEach(si => analysisParts.push(si.part));
      analysisParts.push({ text: promptText });

      const result = await aiModel.generateContent(analysisParts);
      const concepts = JSON.parse(result.response.text());

      const slugs = concepts.map((c: any) => ({
        id: Math.random().toString(36).substring(7),
        title: c.title,
        prompt: c.scene,
        headline: c.headline,
        features: c.features,
        cta: c.cta,
        generating: true
      }));

      setGeminiPrompts(prev => [...prev, ...slugs]);
      setIsProcessing(false);

      // Start image generation for each
      slugs.forEach((slug: any) => generateImage(slug));

    } catch (err: any) {
      setError("Error al procesar: " + err.message);
      setIsProcessing(false);
    }
  };

  const generateImage = async (itemShell: any) => {
    try {
      const logoInstruction = includeLogo && logoImage
        ? "INTEGRATE THE BRAND LOGO provided in the logo reference image into the ad layout. Place it naturally."
        : includeLogo
          ? "Identify the brand logo from the product and integrate it into the ad."
          : "ABSOLUTELY NO TEXT LOGOS or brand names unless they are physically part of the product. No 'Your Logo' placeholders.";

      const imagePrompt = `
        PHOTOREALISTIC HIGH CONVERSION AD. 
        Ratio: ${ratio}.
        ${logoInstruction}
        
        VISUAL IDENTITY: The product in the main reference image is the core.
        CONTEXT & SCENARIO: Use the visual environments, lighting, and backgrounds from the provided support images as a reference for the lifestyle scenes.
        
        SCENE: ${itemShell.prompt}
        
        OVERLAY REQUIREMENTS:
        1. Render an elegant headline: "${itemShell.headline}"
        2. Visual badges for: ${itemShell.features.join(', ')}
        3. A premium CTA button: "${itemShell.cta}"
        4. Modern, minimalist typography.
      `;

      // Context images: main image (primary), then logo, then up to 4 support images
      const refs = [];
      if (mainImage) refs.push(mainImage.part);
      if (logoImage) refs.push(logoImage.part);
      // Send as many support images as reasonable for better context
      supportImages.slice(0, 4).forEach(si => refs.push(si.part));

      const imageUrl = await generateImageViaGemini(imagePrompt, refs);

      setGeminiPrompts(prev => prev.map(p => p.id === itemShell.id ? { ...p, imageUrl, generating: false } : p));
    } catch (err) {
      setGeminiPrompts(prev => prev.map(p => p.id === itemShell.id ? { ...p, failed: true, generating: false } : p));
    }
  };

  const updateConceptPrompt = async (index: number, newPrompt: string) => {
    const item = geminiPrompts[index];
    if (!item) return;

    setGeminiPrompts(prev => prev.map((p, i) => i === index ? { ...p, generating: true, imageUrl: undefined } : p));

    try {
      const imagePrompt = `PHOTOREALISTIC HIGH CONVERSION AD. Ratio: ${ratio}. ${newPrompt}`;
      const refs = [];
      if (mainImage) refs.push(mainImage.part);
      if (logoImage) refs.push(logoImage.part);
      supportImages.slice(0, 4).forEach(si => refs.push(si.part));

      const imageUrl = await generateImageViaGemini(imagePrompt, refs);
      setGeminiPrompts(prev => prev.map((p, i) => i === index ? { ...p, imageUrl, generating: false } : p));
    } catch (e) {
      setGeminiPrompts(prev => prev.map((p, i) => i === index ? { ...p, failed: true, generating: false } : p));
    }
  };

  const deleteCard = (index: number) => {
    setGeminiPrompts(prev => prev.filter((_, i) => i !== index));
  };

  const resetFlow = () => {
    setDescription('');
    setMainImage(null);
    setSupportImages([]);
    setGeminiPrompts([]);
    setIsProcessing(false);
    setError('');
  };

  const downloadAll = () => {
    geminiPrompts.forEach((_, i) => downloadSingle(i));
  };

  const downloadSingle = (index: number) => {
    const item = geminiPrompts[index];
    if (!item?.imageUrl) return;
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `admake-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createVideo = async (id: string) => {
    setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, videoGenerating: true } : p));
    await new Promise(r => setTimeout(r, 4000));
    setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, videoGenerating: false, videoUrl: p.imageUrl } : p));
  };

  return (
    <div className="app-container">
      <div className="ambient-background">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>

      <nav className="navbar" style={{ padding: '0.75rem 2rem' }}>
        <div className="logo cursor-pointer" onClick={resetFlow} style={{ fontSize: '1.25rem' }}>
          <Bot size={24} />
          ADSmake<span>.ai</span>
        </div>
        <div className="actions" style={{ gap: '0.5rem' }}>
          <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Login</button>
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Get Pro</button>
        </div>
      </nav>

      <main className="main-content">
        <div className="dashboard-layout">
          <aside className="sidebar wizard-card glass-panel" style={{ padding: '2rem', gap: '1.5rem', display: 'flex', flexDirection: 'column', width: '420px', minWidth: '420px' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <h2 className="wizard-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fff' }}>
                <Settings2 size={20} className="gradient-text-primary" /> Configuración de Anuncios
              </h2>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>1. Gemini API Key (Opcional)</label>
              <input
                type="password"
                className="input-field"
                placeholder="AIza..."
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                style={{ padding: '0.75rem', fontSize: '0.85rem' }}
              />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>2. Instrucciones y Beneficios</label>
              <textarea
                className="textarea-field"
                placeholder="Ej: SOSMee pulsera de seguridad para niños, impermeable..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: '100px', fontSize: '0.85rem', padding: '0.75rem', lineHeight: '1.5' }}
              ></textarea>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>3. Imagen Principal (Foco del Producto)</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label className="btn btn-outline" style={{ cursor: 'pointer', flex: 1, padding: '0.6rem', fontSize: '0.8rem', borderColor: mainImage ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'main')} />
                  <UploadCloud size={16} /> {mainImage ? 'Foto seleccionada' : 'Subir Producto'}
                </label>
                {mainImage && (
                  <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 0 10px rgba(168,85,247,0.3)' }}>
                    <img src={mainImage.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>4. Logos y Apoyo</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label className="btn btn-ghost" style={{ cursor: 'pointer', padding: '0.5rem', fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.1)', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'logo')} />
                  {logoImage ? <img src={logoImage.url} style={{ height: '24px', maxWidth: '100%' }} /> : <><Sparkles size={14} style={{ marginRight: '4px' }} /> Logo</>}
                </label>
                <label className="btn btn-ghost" style={{ cursor: 'pointer', padding: '0.5rem', fontSize: '0.75rem', border: '1px dashed rgba(255,255,255,0.1)', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'support')} />
                  <Layers size={14} style={{ marginRight: '4px' }} /> Galería
                </label>
              </div>
              {supportImages.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {supportImages.map((img, i) => (
                    <div key={i} style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setSupportImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-divider" style={{ margin: '0.5rem 0' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>Idioma</label>
                <div className="options-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {['es', 'en'].map(l => (
                    <div key={l} className={`option-card ${language === l ? 'selected' : ''}`} onClick={() => setLanguage(l as any)} style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                      {l === 'es' ? '🇪🇸 Esp' : '🇺🇸 Eng'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>Formato</label>
                <div className="options-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['1:1', '4:5', '9:16'].map(r => (
                    <div key={r} className={`option-card ${ratio === r ? 'selected' : ''}`} onClick={() => setRatio(r as any)} style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Cantidad de Anuncios
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{numImages}</span>
              </label>
              <input
                type="range" min="1" max="10" value={numImages}
                onChange={e => setNumImages(parseInt(e.target.value))}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer', height: '6px' }}
              />
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot size={16} className="gradient-text-primary" /> Incluir Identidad Visual</span>
                <input type="checkbox" checked={includeLogo} onChange={e => setIncludeLogo(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)', cursor: 'pointer' }} />
              </label>
            </div>

            <button
              className="generate-button-premium"
              disabled={isProcessing || !mainImage}
              onClick={handleGenerate}
              style={{ padding: '1rem', marginTop: '0.5rem' }}
            >
              <div className="button-content">
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />}
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{isProcessing ? 'Generando...' : `Crear ${numImages} anuncios`}</span>
              </div>
              <div className="shiny-track"></div>
            </button>
          </aside>

          <section className="content-area">
            {isProcessing && geminiPrompts.length === 0 ? (
              <div className="processing-container animate-fade-in glass-panel" style={{ height: '300px' }}>
                <Sparkles size={32} className="gradient-text-primary animate-pulse" />
                <p style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>{processStatus}</p>
              </div>
            ) : error && geminiPrompts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b', border: '1px solid rgba(255,50,50,0.2)', borderRadius: '1rem' }}>{error}</div>
            ) : geminiPrompts.length > 0 ? (
              <div className="animate-fade-in">
                <div className="results-header" style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Resultados</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={downloadAll}>Descargar Todo</button>
                    <button className="btn btn-ghost btn-sm" onClick={resetFlow}>Reiniciar</button>
                  </div>
                </div>
                <div className="results-grid" style={{ '--aspect-ratio': ratio.replace(':', '/') } as React.CSSProperties}>
                  {geminiPrompts.map((item, i) => (
                    <div key={item.id} className="result-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }} onClick={() => { if (item.imageUrl) { setLightboxIndex(i); setLightboxPromptEdit(item.prompt); } }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="result-image" alt={item.title} />
                      ) : (
                        <div className="result-image" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
                          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
                        </div>
                      )}
                      <div className="result-overlay">
                        <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.title}</p>
                        <div className="result-actions">
                          <button className="icon-btn" onClick={e => { e.stopPropagation(); downloadSingle(i); }}><Download size={14} /></button>
                          <button className="icon-btn" onClick={e => { e.stopPropagation(); createVideo(item.id); }}><Video size={14} /></button>
                          <button className="icon-btn" onClick={e => { e.stopPropagation(); deleteCard(i); }}>✕</button>
                        </div>
                      </div>
                      {item.videoGenerating && <div className="result-overlay" style={{ opacity: 1, background: 'rgba(0,0,0,0.8)' }}><RefreshCw className="animate-spin" size={20} /></div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hero glass-panel" style={{ padding: '4rem 2rem', opacity: 0.8 }}>
                <Layers size={48} className="gradient-text-primary" style={{ marginBottom: '1rem' }} />
                <h1>Tus Anuncios con <span className="gradient-text-primary">IA</span></h1>
                <p>Sube la foto de tu producto y deja que la IA se encargue del resto.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {lightboxIndex !== null && geminiPrompts[lightboxIndex] && (
        <div className="lightbox-modal" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-content glass-panel" style={{ maxWidth: '1000px', width: '100%', display: 'flex', gap: '2rem', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ flex: 1.2, borderRadius: '1rem', overflow: 'hidden' }}>
              <img src={geminiPrompts[lightboxIndex].imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>{geminiPrompts[lightboxIndex].title}</h3>
              <textarea
                className="textarea-field"
                value={lightboxPromptEdit}
                onChange={e => setLightboxPromptEdit(e.target.value)}
                style={{ flex: 1, minHeight: '150px' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => updateConceptPrompt(lightboxIndex, lightboxPromptEdit)}><RefreshCw size={16} /> Regenerar</button>
                <button className="btn btn-outline" onClick={() => downloadSingle(lightboxIndex)}><Download size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
