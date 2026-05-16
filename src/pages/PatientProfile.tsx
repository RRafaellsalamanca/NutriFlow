import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Activity, FileText, Save, Plus, 
  Calendar, Clipboard, TrendingUp, CheckCircle, AlertCircle, 
  Clock, ChevronRight, X, Loader2, Sparkles, Trash2, Edit2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

type MainSection = 'dados' | 'consultas' | 'planos';
type DataTab = 'pessoal' | 'clinico' | 'habitos';

export const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [activeSection, setActiveSection] = useState<MainSection>('dados');
  const [activeDataTab, setActiveDataTab] = useState<DataTab>('pessoal');
  
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  
  // Form State for Patient Data
  const [formData, setFormData] = useState<any>({});
  
  // Modal State for New Consultation
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultFormData, setConsultFormData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // AI Meal Plan States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [viewingPlan, setViewingPlan] = useState<any>(null);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  async function fetchPatientData() {
    setLoading(true);
    try {
      // Fetch Patient
      const { data: pData, error: pError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (pError) throw pError;
      setPatient(pData);
      setFormData(pData);

      // Fetch Consultations
      const { data: cData, error: cError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', id)
        .order('data_consulta', { ascending: false });
      
      if (cError) throw cError;
      setConsultations(cData || []);

      // Fetch Plans
      const { data: plData, error: plError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });
      
      if (plError) throw plError;
      setPlans(plData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleMultiSelect = (category: string, value: string) => {
    const current = formData[category] || [];
    let updated;
    if (value === 'Nenhum') {
      updated = ['Nenhum'];
    } else {
      const filtered = current.filter((item: string) => item !== 'Nenhum');
      if (filtered.includes(value)) {
        updated = filtered.filter((item: string) => item !== value);
      } else {
        updated = [...filtered, value];
      }
    }
    setFormData((prev: any) => ({ ...prev, [category]: updated }));
  };

  const handleUpdatePatient = async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error: updateError } = await supabase
        .from('pacientes')
        .update({
          ...formData,
          refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia) : null,
          peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
          altura: formData.altura ? parseFloat(formData.altura) : null,
          litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setSuccess('Dados atualizados com sucesso!');
      setPatient(formData);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { error: cError } = await supabase
        .from('consultas')
        .insert([{
          ...consultFormData,
          paciente_id: id,
          peso: consultFormData.peso ? parseFloat(consultFormData.peso) : null,
          cintura: consultFormData.cintura ? parseFloat(consultFormData.cintura) : null,
          quadril: consultFormData.quadril ? parseFloat(consultFormData.quadril) : null,
          percentual_gordura: consultFormData.percentual_gordura ? parseFloat(consultFormData.percentual_gordura) : null,
        }]);

      if (cError) throw cError;

      setShowConsultModal(false);
      setConsultFormData({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      fetchPatientData();
      setSuccess('Consulta registrada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPlan(null);
    setViewingPlan(null);

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientData: patient })
      });

      if (!response.ok) {
        // Tenta ler o erro como JSON, se falhar, usa um texto padrão
        let errorMessage = 'Erro ao conectar com o serviço de IA.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (response.status === 404) {
            errorMessage = 'Serviço de IA não encontrado localmente. Esta função requer deploy na Vercel para funcionar.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setGeneratedPlan(data.plano_semanal);
      setSuccess('Plano gerado com sucesso! Você pode editá-lo antes de salvar.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    setUpdating(true);
    setError(null);

    try {
      const { error: plError } = await supabase
        .from('planos_alimentares')
        .insert([{
          paciente_id: id,
          conteudo: { plano_semanal: generatedPlan }
        }]);

      if (plError) throw plError;

      setSuccess('Plano alimentar salvo com sucesso!');
      setGeneratedPlan(null);
      fetchPatientData(); // Refresh history
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleOptionChange = (dayIndex: number, mealKey: string, optionIndex: number, value: string) => {
    const updatedPlan = [...generatedPlan];
    updatedPlan[dayIndex].refeicoes[mealKey][optionIndex] = value;
    setGeneratedPlan(updatedPlan);
  };

  // Chart Data Preparation
  const chartData = [...consultations]
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())
    .map(c => ({
      data: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: parseFloat(c.peso)
    }));

  if (loading) return <div className="loading-container">Carregando perfil...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="profile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button className="btn" style={{ width: 'auto', padding: '0.5rem' }} onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{patient?.nome}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <span className="badge" style={{ background: 'var(--surface-active)', color: 'var(--primary-dark)' }}>
                {patient?.sexo}
              </span>
              <span className="badge">
                {patient?.data_nascimento ? 
                  `${new Date().getFullYear() - new Date(patient.data_nascimento).getFullYear()} anos` : 
                  'Idade não informada'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {activeSection === 'dados' && (
            <button className="btn btn-primary" onClick={handleUpdatePatient} disabled={updating}>
              <Save size={20} />
              {updating ? 'Salvando...' : 'Salvar alterações'}
            </button>
          )}
          {activeSection === 'consultas' && (
            <button className="btn btn-primary" onClick={() => setShowConsultModal(true)}>
              <Plus size={20} />
              Nova Consulta
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="error-message" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--border)', color: 'var(--success-text)' }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="profile-nav">
        <button 
          className={`profile-nav-item ${activeSection === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveSection('dados')}
        >
          <User size={18} />
          Dados do Paciente
        </button>
        <button 
          className={`profile-nav-item ${activeSection === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveSection('consultas')}
        >
          <Activity size={18} />
          Consultas
        </button>
        <button 
          className={`profile-nav-item ${activeSection === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveSection('planos')}
        >
          <FileText size={18} />
          Planos Alimentares
        </button>
      </nav>

      {/* SECTION 1: DADOS DO PACIENTE */}
      {activeSection === 'dados' && (
        <div className="card" style={{ padding: '0' }}>
          <div className="tabs-header" style={{ padding: '0 1.5rem' }}>
            <button 
              className={`tab-button ${activeDataTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveDataTab('pessoal')}
            >
              Pessoal
            </button>
            <button 
              className={`tab-button ${activeDataTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveDataTab('clinico')}
            >
              Clínico
            </button>
            <button 
              className={`tab-button ${activeDataTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveDataTab('habitos')}
            >
              Hábitos
            </button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeDataTab === 'pessoal' && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nome Completo</label>
                  <input name="nome" value={formData.nome || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input type="date" name="data_nascimento" value={formData.data_nascimento || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Sexo</label>
                  <select name="sexo" value={formData.sexo || ''} onChange={handleInputChange}>
                    <option value="">Selecione</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input name="telefone" value={formData.telefone || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>E-mail</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} />
                </div>
              </div>
            )}

            {activeDataTab === 'clinico' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Peso Inicial (kg)</label>
                  <input type="number" name="peso_inicial" value={formData.peso_inicial || ''} onChange={handleInputChange} step="0.1" />
                </div>
                <div className="form-group">
                  <label>Altura (cm)</label>
                  <input type="number" name="altura" value={formData.altura || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Nível de Atividade</label>
                  <select name="nivel_atividade" value={formData.nivel_atividade || ''} onChange={handleInputChange}>
                    <option value="">Selecione</option>
                    <option value="Sedentário">Sedentário</option>
                    <option value="Levemente ativo">Levemente ativo</option>
                    <option value="Moderadamente ativo">Moderadamente ativo</option>
                    <option value="Muito ativo">Muito ativo</option>
                    <option value="Extremamente ativo">Extremamente ativo</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Objetivos</label>
                  <div className="checkbox-group">
                    {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={(formData.objetivos || []).includes(opt)}
                          onChange={() => handleMultiSelect('objetivos', opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Patologias</label>
                  <div className="checkbox-group">
                    {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(opt => (
                      <label key={opt} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={(formData.patologias || []).includes(opt)}
                          onChange={() => handleMultiSelect('patologias', opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Medicamentos Contínuos</label>
                  <textarea name="medicamentos" value={formData.medicamentos || ''} onChange={handleInputChange} rows={2} />
                </div>
              </div>
            )}

            {activeDataTab === 'habitos' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Refeições por dia</label>
                  <input type="number" name="refeicoes_por_dia" value={formData.refeicoes_por_dia || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Litros de água por dia</label>
                  <input type="number" name="litros_agua" value={formData.litros_agua || ''} onChange={handleInputChange} step="0.1" />
                </div>
                <div className="form-group">
                  <label>Horário que acorda</label>
                  <input name="horario_acorda" value={formData.horario_acorda || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Horário que dorme</label>
                  <input name="horario_dorme" value={formData.horario_dorme || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      name="atividade_fisica" 
                      checked={formData.atividade_fisica || false} 
                      onChange={handleInputChange} 
                    />
                    Pratica atividade física?
                  </label>
                  {formData.atividade_fisica && (
                    <textarea 
                      name="atividade_fisica_descricao" 
                      value={formData.atividade_fisica_descricao || ''} 
                      onChange={handleInputChange} 
                      style={{ marginTop: '1rem' }}
                      rows={2}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: CONSULTAS */}
      {activeSection === 'consultas' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Chart Section */}
          <div className="card">
            <h3 className="section-title">
              <TrendingUp size={20} className="text-info" />
              Evolução de Peso
            </h3>
            <div style={{ height: '300px', width: '100%' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="data" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} unit="kg" domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                      labelStyle={{ fontWeight: 700, marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="var(--secondary)" 
                      strokeWidth={3} 
                      dot={{ r: 6, fill: 'var(--secondary)', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <p>Nenhuma consulta registrada ainda.</p>
                </div>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="card">
            <h3 className="section-title">
              <Clock size={20} className="text-info" />
              Histórico de Consultas
            </h3>
            <div className="history-list">
              {consultations.length > 0 ? (
                consultations.map(c => (
                  <div key={c.id} className="history-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Calendar size={16} className="text-muted" />
                          <span style={{ fontWeight: 700 }}>
                            {new Date(c.data_consulta).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {c.observacoes && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            {c.observacoes}
                          </p>
                        )}
                        <div className="consult-stats">
                          <div className="stat-item">
                            <span className="stat-label">Peso</span>
                            <span className="stat-value">{c.peso} kg</span>
                          </div>
                          {c.cintura && (
                            <div className="stat-item">
                              <span className="stat-label">Cintura</span>
                              <span className="stat-value">{c.cintura} cm</span>
                            </div>
                          )}
                          {c.quadril && (
                            <div className="stat-item">
                              <span className="stat-label">Quadril</span>
                              <span className="stat-value">{c.quadril} cm</span>
                            </div>
                          )}
                          {c.percentual_gordura && (
                            <div className="stat-item">
                              <span className="stat-label">% Gordura</span>
                              <span className="stat-value">{c.percentual_gordura}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {c.proximo_retorno && (
                        <div className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                          Retorno: {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">Nenhum registro encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PLANOS ALIMENTARES */}
      {activeSection === 'planos' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                <FileText size={20} className="text-info" />
                Planos Alimentares
              </h3>
              {!generatedPlan && !viewingPlan && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: 'auto' }} 
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Gerando Plano...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Gerar Plano com IA
                    </>
                  )}
                </button>
              )}
              {generatedPlan && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" style={{ width: 'auto' }} onClick={() => setGeneratedPlan(null)}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSavePlan} disabled={updating}>
                    <Save size={20} />
                    {updating ? 'Salvando...' : 'Salvar Plano'}
                  </button>
                </div>
              )}
              {viewingPlan && (
                <button className="btn" style={{ width: 'auto' }} onClick={() => setViewingPlan(null)}>
                  Voltar ao Histórico
                </button>
              )}
            </div>

            {isGenerating && (
              <div className="empty-state" style={{ padding: '4rem 0' }}>
                <Loader2 size={48} className="animate-spin text-primary" style={{ marginBottom: '1.5rem' }} />
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Criando Plano Personalizado</h4>
                <p className="text-muted">Analisando dados do paciente e consultando a IA...</p>
              </div>
            )}

            {/* Generated Plan Editor */}
            {generatedPlan && (
              <div style={{ display: 'grid', gap: '2rem' }}>
                {generatedPlan.map((day: any, dIdx: number) => (
                  <div key={dIdx} className="day-plan-card">
                    <h4 className="day-title">{day.dia}</h4>
                    <div className="meals-grid">
                      {Object.entries(day.refeicoes).map(([mealKey, options]: [string, any]) => (
                        <div key={mealKey} className="meal-section">
                          <label className="meal-label">
                            {mealKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <div className="options-list">
                            {options.map((opt: string, oIdx: number) => (
                              <input 
                                key={oIdx}
                                className="meal-option-input"
                                value={opt}
                                onChange={(e) => handleOptionChange(dIdx, mealKey, oIdx, e.target.value)}
                                placeholder={`Opção ${oIdx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Viewing Saved Plan */}
            {viewingPlan && (
              <div style={{ display: 'grid', gap: '2rem' }}>
                <div className="badge" style={{ padding: '1rem', background: 'var(--surface-active)', textAlign: 'center' }}>
                  Visualizando plano salvo em {new Date(viewingPlan.created_at).toLocaleDateString('pt-BR')}
                </div>
                {viewingPlan.conteudo.plano_semanal.map((day: any, dIdx: number) => (
                  <div key={dIdx} className="day-plan-card">
                    <h4 className="day-title">{day.dia}</h4>
                    <div className="meals-grid">
                      {Object.entries(day.refeicoes).map(([mealKey, options]: [string, any]) => (
                        <div key={mealKey} className="meal-section">
                          <label className="meal-label">
                            {mealKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                          <ul className="options-display-list">
                            {options.map((opt: string, oIdx: number) => (
                              <li key={oIdx}>{opt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isGenerating && !generatedPlan && !viewingPlan && (
              <div className="history-list">
                {plans.length > 0 ? (
                  plans.map(p => (
                    <div 
                      key={p.id} 
                      className="history-card" 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setViewingPlan(p)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="icon-box-info">
                          <Clipboard size={20} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 700 }}>Plano Alimentar Semanal</span>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {new Date(p.created_at).toLocaleDateString('pt-BR')} às {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-muted" />
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p>Nenhum plano alimentar gerado ainda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NOVA CONSULTA */}
      {showConsultModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registrar Nova Consulta</h2>
              <button className="btn" style={{ width: 'auto', padding: '0.25rem' }} onClick={() => setShowConsultModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveConsultation}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Data da Consulta *</label>
                    <input 
                      type="date" 
                      required 
                      value={consultFormData.data_consulta} 
                      onChange={e => setConsultFormData({...consultFormData, data_consulta: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso Atual (kg) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      value={consultFormData.peso} 
                      onChange={e => setConsultFormData({...consultFormData, peso: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cintura (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={consultFormData.cintura} 
                      onChange={e => setConsultFormData({...consultFormData, cintura: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Quadril (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={consultFormData.quadril} 
                      onChange={e => setConsultFormData({...consultFormData, quadril: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>% de Gordura</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={consultFormData.percentual_gordura} 
                      onChange={e => setConsultFormData({...consultFormData, percentual_gordura: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Próximo Retorno</label>
                    <input 
                      type="date" 
                      value={consultFormData.proximo_retorno} 
                      onChange={e => setConsultFormData({...consultFormData, proximo_retorno: e.target.value})}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Observações</label>
                    <textarea 
                      value={consultFormData.observacoes} 
                      onChange={e => setConsultFormData({...consultFormData, observacoes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ width: 'auto' }} onClick={() => setShowConsultModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={updating}>
                  {updating ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
