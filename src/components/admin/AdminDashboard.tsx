import React, { useState, useEffect } from 'react';
import { Bot, ArrowLeft, Users, DollarSign, Image as ImageIcon, Zap, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminDashboardProps {
  setView: (view: 'landing' | 'app' | 'admin') => void;
  session: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setView }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats Mokups (Hasta conectar Stripe)
  const stats = [
    { label: 'Usuarios Totales', value: '1,248', icon: <Users size={20} color="var(--primary)" />, trend: '+12% este mes' },
    { label: 'Ingresos (MRR)', value: '$4,590', icon: <DollarSign size={20} color="#10b981" />, trend: '+5% este mes' },
    { label: 'Imágenes Generadas', value: '15,892', icon: <ImageIcon size={20} color="#8b5cf6" />, trend: '+24% este mes' },
    { label: 'Créditos Circulantes', value: '89,400', icon: <Zap size={20} color="#f59e0b" />, trend: 'Activos' }
  ];

  // Fetch real users from perfiles_usuario
  useEffect(() => {
    const fetchUsers = async () => {
      // Nota: Si no hay columna 'email' en perfiles_usuario, mostraremos el ID.
      // Se recomienda añadir trigger en BD para copiar email a perfiles_usuario.
      const { data, error } = await supabase
        .from('perfiles_usuario')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleUpdateCredits = async (userId: string, currentCredits: number, isAdd: boolean) => {
    const amount = parseInt(prompt(`¿Cuántos créditos quieres ${isAdd ? 'añadir' : 'quitar'}?`, "100") || "0");
    if (amount <= 0) return;
    
    const newCredits = isAdd ? currentCredits + amount : Math.max(0, currentCredits - amount);
    
    const { error } = await supabase
      .from('perfiles_usuario')
      .update({ creditos: newCredits })
      .eq('id', userId);
      
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, creditos: newCredits } : u));
    } else {
      alert("Error al actualizar créditos. Verifica permisos RLS.");
    }
  };

  return (
    <div className="app-container" style={{ background: '#0a0a0f', minHeight: '100vh', overflowY: 'auto', paddingBottom: '3rem' }}>
      
      {/* Top Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="icon-btn" onClick={() => setView('app')} title="Volver a la App">
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <Bot size={24} className="gradient-text-primary" />
            ADSmake <span>Admin</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="glass-pill" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '0.3rem' }} /> Sistema Operativo
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Panel de Control Core</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas globales y gestión de usuarios.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {stats.map((s, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.label}</span>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: s.trend.includes('+') ? '#10b981' : 'var(--text-muted)' }}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Bóveda de Usuarios</h2>
            <div className="input-group" style={{ margin: 0, width: '300px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar usuario o ID..." 
                  className="glass-input" 
                  style={{ paddingLeft: '2.5rem', width: '100%', margin: 0 }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'normal' }}>ID de Usuario / Email</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'normal' }}>Estado</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'normal' }}>Créditos Disponibles</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 'normal', textAlign: 'right' }}>Acciones Financieras</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando registros...</td>
                  </tr>
                ) : users.filter(u => u.id.includes(searchTerm)).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                      No hay usuarios registrados (Si RLs está activo, debes dar permisos a admin).
                    </td>
                  </tr>
                ) : users.filter(u => u.id.includes(searchTerm) || (u.email && u.email.includes(searchTerm))).map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{u.email || "Usuario Oculto (Privacidad)"}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.id}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', background: u.creditos > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.creditos > 0 ? '#10b981' : '#ef4444', borderRadius: '100px', fontSize: '0.75rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></div>
                        {u.creditos > 0 ? 'Activo' : 'Sin Saldo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} color="var(--primary)" />
                        <span style={{ fontWeight: 800 }}>{u.creditos}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleUpdateCredits(u.id, u.creditos, true)}>
                          + Créditos
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '0.4rem', color: '#ef4444' }} onClick={() => handleUpdateCredits(u.id, u.creditos, false)}>
                          - Reducir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
