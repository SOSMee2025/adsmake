import React, { useState } from 'react';
import { 
  Wand2, Video, Download, 
  UploadCloud, 
  Settings2, Bot, RefreshCw, Layers, DownloadCloud 
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface DashboardProps {
  setView: (view: 'landing' | 'app') => void;
  session?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, session }) => {
  const [description, setDescription] = useState('');
  const [mainImages, setMainImages] = useState<{ url: string, part: any }[]>([]);
  const [supportImages, setSupportImages] = useState<{ url: string, part: any }[]>([]);
  const [ratio, setRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [numImages, setNumImages] = useState(4);
  const [error, setError] = useState('');
  const [processStatus, setProcessStatus] = useState("Analizando producto...");
  const [geminiPrompts, setGeminiPrompts] = useState<{ id: string, title: string, prompt: string, imageUrl?: string, generating?: boolean, videoGenerating?: boolean, isVideo?: boolean, failed?: boolean }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxPromptEdit, setLightboxPromptEdit] = useState('');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [logoImage, setLogoImage] = useState<{ url: string, part: any } | null>(null);
  const [includeLogo, setIncludeLogo] = useState(false);

  const getApiKey = () => (import.meta.env.VITE_GEMINI_API_KEY?.trim() || "");

  const generateImageViaGemini = async (
    prompt: string,
    refImages: { inlineData: { data: string, mimeType: string } }[] = []
  ): Promise<string> => {
    const key = getApiKey();
    const mName = 'gemini-3.1-flash-image-preview';
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
    throw new Error("No se pudo generar la imagen.");
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
        setMainImages(prev => [...prev, ...newPairs]);
      } else if (type === 'logo') {
        setLogoImage(newPairs[0]);
        setIncludeLogo(true);
      } else {
        setSupportImages(prev => [...prev, ...newPairs]);
      }
    }
  };

  const handleGenerate = async () => {
    if (!description.trim() && mainImages.length === 0) {
      setError("Por favor, ingresa instrucciones o sube al menos una imagen del producto.");
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
        Rules: Product is SACRED. methodology: ANDROMEDA (high-end). Language: ${language === 'es' ? 'SPANISH' : 'ENGLISH'}.
        Ratio: ${ratioDesc}.
        Product Instructions: ${description}
        Return JSON array: [{"title": "concept name", "scene": "English cinematic prompt for the product in a lifestyle scene", "headline": "Short punchy headline", "features": ["feature 1", "feature 2"], "cta": "Short CTA"}]
      `;

      const analysisParts = [];
      mainImages.forEach(mi => analysisParts.push(mi.part));
      if (logoImage) analysisParts.push(logoImage.part);
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
        generating: true,
        isVideo: false
      }));

      setGeminiPrompts(prev => [...prev, ...slugs]);
      setIsProcessing(false);
      slugs.forEach((slug: any) => generateImage(slug));
    } catch (err: any) {
      setError("Error al procesar: " + err.message);
      setIsProcessing(false);
    }
  };

  const generateImage = async (itemShell: any) => {
    try {
      const logoInstruction = includeLogo && logoImage
        ? "INTEGRATE THE BRAND LOGO provided."
        : includeLogo ? "Identify brand logo from product." : "NO TEXT LOGOS.";

      const imagePrompt = `PHOTOREALISTIC HIGH CONVERSION AD. Ratio: ${ratio}. ${logoInstruction}\nSCENE: ${itemShell.prompt}\nOVERLAY: "${itemShell.headline}", badges: ${itemShell.features.join(', ')}, CTA: "${itemShell.cta}"`;

      const refs = [];
      mainImages.forEach(mi => refs.push(mi.part));
      if (logoImage) refs.push(logoImage.part);
      supportImages.slice(0, 4).forEach(si => refs.push(si.part));

      const imageUrl = await generateImageViaGemini(imagePrompt, refs);
      setGeminiPrompts(prev => prev.map(p => p.id === itemShell.id ? { ...p, imageUrl, generating: false } : p));
    } catch (err) {
      setGeminiPrompts(prev => prev.map(p => p.id === itemShell.id ? { ...p, failed: true, generating: false } : p));
    }
  };

  const quickRegenerate = async (id: string, currentPrompt: string) => {
    setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, generating: true, isVideo: false } : p));
    try {
      const imagePrompt = `PHOTOREALISTIC AD. Ratio: ${ratio}. Generate an alternative but similar composition: ${currentPrompt}`;
      const refs = [];
      mainImages.forEach(mi => refs.push(mi.part));
      if (logoImage) refs.push(logoImage.part);
      supportImages.slice(0, 4).forEach(si => refs.push(si.part));

      const imageUrl = await generateImageViaGemini(imagePrompt, refs);
      setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, imageUrl, generating: false } : p));
    } catch (e) {
      setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, failed: true, generating: false } : p));
    }
  };

  const deleteCard = (id: string) => setGeminiPrompts(prev => prev.filter(p => p.id !== id));
  const resetFlow = () => {
    setDescription(''); 
    setMainImages([]); 
    setSupportImages([]); 
    setLogoImage(null);
    setIncludeLogo(false);
    setGeminiPrompts([]);
    setIsProcessing(false); 
    setError('');
  };

  const downloadSingle = (imageUrl: string, id: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `adsmake-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllZip = async () => {
    const validImages = geminiPrompts.filter(p => p.imageUrl && !p.generating);
    if (validImages.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("ADSmake_Campaign");

    validImages.forEach((item, index) => {
      // Extract base64 part
      const base64Data = item.imageUrl!.split(',')[1];
      folder?.file(`ad-${index + 1}-${ratio.replace(':','-')}.png`, base64Data, {base64: true});
    });

    const content = await zip.generateAsync({type: "blob"});
    saveAs(content, "ADSmake_Campaign.zip");
  };

  const createVideo = async (id: string) => {
    setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, videoGenerating: true } : p));
    // Simulate AI video generation delay
    await new Promise(r => setTimeout(r, 4500));
    // Set as finished and activate dynamic zoom video mode
    setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, videoGenerating: false, isVideo: true } : p));
  };

  const renderAndDownloadVideo = async (imageUrl: string, id: string) => {
    setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, videoGenerating: true } : p));
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(30);
      const options = { mimeType: 'video/webm;codecs=vp9' };
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      
      const renderPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `ADSmake-Video-${id}.webm`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
          resolve();
        };
      });

      recorder.start();

      const duration = 5000;
      const startTime = performance.now();

      const drawFrame = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const scale = 1 + (0.15 * progress);
        
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        const panX = (canvas.width * 0.02) * progress;
        const panY = (canvas.height * 0.02) * progress;
        ctx.translate(-panX, -panY);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();

        if (progress < 1) {
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };
      
      requestAnimationFrame(drawFrame);
      await renderPromise;

    } catch (e) {
      console.error(e);
      alert("Error renderizando video");
    } finally {
      setGeminiPrompts(prev => prev.map(p => p.id === id ? { ...p, videoGenerating: false } : p));
    }
  };

  return (
    <div className="app-container dashboard-view">
      <div className="ambient-background">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>

      <nav className="navbar" style={{ padding: '0.6rem 1.5rem' }}>
        <div className="logo cursor-pointer" onClick={() => setView('landing')} style={{ fontSize: '1.25rem' }}>
          <Bot size={24} />
          ADSmake<span>.ai</span>
        </div>
        <div className="actions" style={{ gap: '0.5rem', alignItems: 'center' }}>
          {session?.user?.email && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.5rem' }} className="hidden-mobile">{session.user.email}</span>}
          <button className="btn btn-ghost" onClick={() => setView('landing')}>Volver</button>
          <button className="btn magic-glow" style={{ padding: '0.5rem 1rem' }}>Plan Pro</button>
        </div>
      </nav>

      <main className="main-content">
        <div className="dashboard-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fff', margin: 0 }}>
                <Settings2 size={20} className="gradient-text-primary" /> Configuración 
              </h2>
            </div>
            
            <div className="sidebar-content">
              <div className="input-group">
                <label className="input-label">1. Descripción del Producto</label>
                <textarea className="textarea-field" placeholder="Ej: SOSMee pulsera GPS para niños..." value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>

              <div className="input-group">
                <label className="input-label">2. Imágenes del Producto ({mainImages.length})</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.5rem', marginBottom: mainImages.length > 0 ? '0.5rem' : 0 }}>
                  {mainImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => setMainImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  ))}
                  <label className="btn-upload" style={{ cursor: 'pointer', aspectRatio: '1/1', minHeight: 'auto', padding: 0 }}>
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'main')} />
                    <UploadCloud size={16} className="gradient-text-primary" />
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">3. Identidad Visual</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label className="btn-upload" style={{ cursor: 'pointer', padding: '0.75rem' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'logo')} />
                    {logoImage ? <img src={logoImage.url} style={{ height: '30px', objectFit: 'contain' }} /> : <><Bot size={16} /> Logo</>}
                  </label>
                  <label className="btn-upload" style={{ cursor: 'pointer', padding: '0.75rem' }}>
                    <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'support')} />
                    <Layers size={16} /> {supportImages.length > 0 ? `${supportImages.length} Fotos` : 'Galería'}
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Idioma</label>
                  <div className="options-grid">
                    {['es', 'en'].map(l => (
                      <div key={l} className={`option-card ${language === l ? 'selected' : ''}`} onClick={() => setLanguage(l as any)}>{l === 'es' ? '🇪🇸' : '🇺🇸'}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="input-label">Formato</label>
                  <div className="options-grid">
                    {['1:1', '4:5', '9:16'].map(r => (
                      <div key={r} className={`option-card ${ratio === r ? 'selected' : ''}`} onClick={() => setRatio(r as any)}>{r}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label">Generar X Anuncios</label>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{numImages}</span>
                </div>
                <input 
                  type="range" min="1" max="10" step="1" 
                  value={numImages} 
                  onChange={(e) => setNumImages(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div className="input-group" style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} className="gradient-text-primary" />
                  <span style={{ fontSize: '0.85rem' }}>Brand Safety</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={includeLogo} 
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="sidebar-footer">
              <button className="generate-button-premium" style={{ width: '100%' }} disabled={isProcessing || mainImages.length === 0} onClick={handleGenerate}>
                <div className="button-content">
                  {isProcessing ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                  <span>{isProcessing ? 'Generando Magia...' : `Crear ${numImages} anuncios`}</span>
                </div>
                <div className="shiny-track"></div>
              </button>
            </div>
          </aside>

          <section className="content-area">
            {isProcessing && geminiPrompts.length === 0 ? (
              <div className="processing-container animate-fade-in glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '4rem' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '2rem' }}>
                   <div className="ai-scanning-ring"></div>
                   <Bot size={48} className="gradient-text-primary" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                </div>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', color: 'transparent', textAlign: 'center' }}>
                  {processStatus}
                </h3>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill"></div>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '2rem', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6' }}>
                  Nuestra red neuronal está extrayendo los patrones de luz y volumen de tu producto...
                </p>
              </div>
            ) : error && geminiPrompts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#ff6b6b' }}>
                <h3>Error en el proceso</h3>
                <p>{error}</p>
                <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={resetFlow}>Intentar de nuevo</button>
              </div>
            ) : geminiPrompts.length > 0 ? (
              <div className="animate-fade-in">
                <div className="results-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ flex: '1 1 min-content' }}>
                    <h2 style={{ fontSize: '2rem', margin: 0 }}>Resultados</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Rendimiento esperado: Alto (Categoría: {ratio})</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={downloadAllZip}>
                      <DownloadCloud size={18} /> Descargar .ZIP
                    </button>
                    <button className="btn btn-outline" style={{ whiteSpace: 'nowrap' }} onClick={resetFlow}>
                      <RefreshCw size={18} /> Resetear
                    </button>
                  </div>
                </div>
                
                <div className="results-grid" style={{ '--aspect-ratio': ratio.replace(':', '/') } as React.CSSProperties}>
                  {geminiPrompts.map((item, i) => (
                    <div key={item.id} className={`result-card ${item.isVideo ? 'video-ad-mode' : ''}`} onClick={() => { if (item.imageUrl) { setLightboxIndex(i); setLightboxPromptEdit(item.prompt); } }}>
                      {item.generating ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(255,255,255,0.05)' }}>
                          <RefreshCw className="animate-spin" size={32} color="var(--primary)" />
                        </div>
                      ) : item.imageUrl ? (
                        <>
                          <img src={item.imageUrl} className="result-image" alt="Generated Ad" />
                          {item.isVideo && (
                            <div className="video-badge">
                              <Video size={12} fill="#fff" /> AI Video
                            </div>
                          )}
                          {item.videoGenerating && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                              <RefreshCw size={24} className="animate-spin gradient-text-primary" style={{ marginBottom: '0.5rem' }} />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sintetizando video...</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>Fallo al generar</div>
                      )}
                      
                      {!item.generating && item.imageUrl && !item.videoGenerating && (
                        <div className="result-overlay">
                          <div className="card-actions-row">
                            <button className="btn-overlay" onClick={e => { e.stopPropagation(); downloadSingle(item.imageUrl!, item.id); }}>
                              <Download size={14} /> {item.isVideo ? 'JPG' : 'Bajar'}
                            </button>
                            {!item.isVideo ? (
                              <button className="btn-overlay" onClick={e => { e.stopPropagation(); createVideo(item.id); }}>
                                <Video size={14} /> Auto-Video
                              </button>
                            ) : (
                              <button className="btn-overlay" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={e => { e.stopPropagation(); renderAndDownloadVideo(item.imageUrl!, item.id); }}>
                                <DownloadCloud size={14} /> Bajar Video
                              </button>
                            )}
                            <button className="btn-overlay" style={{ background: 'rgba(100, 41, 205, 0.4)' }} onClick={e => { e.stopPropagation(); quickRegenerate(item.id, item.prompt); }}>
                              <RefreshCw size={14} /> Renovar
                            </button>
                            <button className="icon-btn" style={{ marginLeft: 'auto', width: '30px', height: '30px' }} onClick={e => { e.stopPropagation(); deleteCard(item.id); }}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hero glass-panel animate-fade-in" style={{ padding: '6rem 2rem', opacity: 0.9, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', overflow: 'hidden' }}>
                <div className="empty-state-glow"></div>
                <div className="icon-container-floating">
                  <Layers size={64} className="gradient-text-primary" />
                </div>
                <h1 style={{ fontSize: '3rem', margin: '2rem 0 1rem 0', zIndex: 1, textAlign: 'center' }}>Adéntrate en el <span className="gradient-text-primary">Futuro</span></h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', zIndex: 1, textAlign: 'center', maxWidth: '500px' }}>
                  Sube tus imágenes en el panel izquierdo. ADSmake analizará la geometría y generará escenas fotorrealistas con iluminación de estudio en segundos.
                </p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem', zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="step-badge">1. Sube tu Foto</div>
                  <div className="step-badge">2. Elige el Formato</div>
                  <div className="step-badge">3. Magia Pura</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {lightboxIndex !== null && geminiPrompts[lightboxIndex] && (() => {
        const item = geminiPrompts[lightboxIndex];
        return (
          <div className="lightbox-modal" onClick={() => setLightboxIndex(null)}>
            <div className="lightbox-content glass-panel" onClick={e => e.stopPropagation()}>
              <div style={{ flex: 1.2, position: 'relative' }}>
                <img src={item.imageUrl} className={item.isVideo ? "video-ad-mode" : ""} style={{ width: '100%', height: '100%', objectFit: 'contain', animation: item.isVideo ? 'dynamic-zoom 8s alternate infinite ease-in-out' : 'none' }} />
                {item.isVideo && (
                  <div className="video-badge" style={{ top: '2rem', right: '2rem' }}>
                    <Video size={16} fill="#fff" /> AI Video Playing
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3>{item.title}</h3>
                <label className="input-label">Editar Copy o Escena y Regenerar</label>
                <textarea className="textarea-field" value={lightboxPromptEdit} onChange={e => setLightboxPromptEdit(e.target.value)} style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => quickRegenerate(item.id, lightboxPromptEdit)}><RefreshCw size={16} /> Regenerar Imagen</button>
                  <button className="btn btn-outline" onClick={() => downloadSingle(item.imageUrl!, item.id)}><Download size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
