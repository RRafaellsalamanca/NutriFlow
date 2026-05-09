import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, User, Activity, Coffee, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthContext';

export const PatientCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pessoal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [] as string[],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [] as string[],
    restricoes_alimentares: [] as string[],
    alergias: [] as string[],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Automated Calculations
  const [age, setAge] = useState<number | null>(null);
  const [imc, setImc] = useState<number | null>(null);

  useEffect(() => {
    if (formData.data_nascimento) {
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let ageCalc = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        ageCalc--;
      }
      setAge(ageCalc >= 0 ? ageCalc : null);
    }
  }, [formData.data_nascimento]);

  useEffect(() => {
    const weight = parseFloat(formData.peso_inicial);
    const heightCm = parseFloat(formData.altura);
    if (weight > 0 && heightCm > 0) {
      const heightM = heightCm / 100;
      const imcCalc = weight / (heightM * heightM);
      setImc(parseFloat(imcCalc.toFixed(1)));
    } else {
      setImc(null);
    }
  }, [formData.peso_inicial, formData.altura]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleMultiSelect = (category: string, value: string) => {
    setFormData(prev => {
      const current = (prev as any)[category] as string[];
      if (value === 'Nenhum') {
        return { ...prev, [category]: ['Nenhum'] };
      }
      const filtered = current.filter(item => item !== 'Nenhum');
      if (filtered.includes(value)) {
        return { ...prev, [category]: filtered.filter(item => item !== value) };
      }
      return { ...prev, [category]: [...filtered, value] };
    });
  };

  const formatTimeInput = (value: string) => {
    // Basic format logic: 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (clean.length === 1) return `0${clean}:00`;
    if (clean.length === 2) return `${clean}:00`;
    if (clean.length === 3) return `0${clean[0]}:${clean.slice(1)}`;
    if (clean.length === 4) return `${clean.slice(0, 2)}:${clean.slice(2)}`;
    return value;
  };

  const handleTimeBlur = (field: string) => {
    const formatted = formatTimeInput((formData as any)[field]);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      setError('O nome completo é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('pacientes')
        .insert([{
          ...formData,
          nutricionista_id: user?.id,
          refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia) : null,
          peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
          altura: formData.altura ? parseFloat(formData.altura) : null,
          litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => navigate(`/pacientes/${data.id}`), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="list-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Novo Paciente</h1>
          <p style={{ color: 'var(--text-muted)' }}>Preencha os dados para iniciar o acompanhamento</p>
        </div>
        <button className="btn" style={{ width: 'auto' }} onClick={() => navigate('/pacientes')}>
          <X size={20} />
          Cancelar
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="error-message" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--border)', color: 'var(--success-text)' }}>
          <CheckCircle size={20} />
          Paciente cadastrado com sucesso! Redirecionando...
        </div>
      )}

      <div className="card" style={{ padding: '0' }}>
        <div className="tabs-header" style={{ padding: '0 1.5rem' }}>
          <button 
            className={`tab-button ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Pessoal
          </button>
          <button 
            className={`tab-button ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            <Activity size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Clínico
          </button>
          <button 
            className={`tab-button ${activeTab === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitos')}
          >
            <Coffee size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Hábitos
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* TAB 1: PESSOAL */}
          {activeTab === 'pessoal' && (
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Nome Completo *</label>
                <input name="nome" value={formData.nome} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Data de Nascimento</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} />
                  {age !== null && <span className="badge">{age} anos</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Sexo</label>
                <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                  <option value="">Selecione</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="(00) 00000-0000" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>E-mail</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="email@exemplo.com" />
              </div>
            </div>
          )}

          {/* TAB 2: CLÍNICO */}
          {activeTab === 'clinico' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Peso Atual (kg)</label>
                <input type="number" name="peso_inicial" value={formData.peso_inicial} onChange={handleInputChange} step="0.1" />
              </div>
              <div className="form-group">
                <label>Altura (cm)</label>
                <input type="number" name="altura" value={formData.altura} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>IMC</label>
                <input value={imc || ''} readOnly className="calculated-field" placeholder="Calculado automaticamente" />
              </div>
              <div className="form-group">
                <label>Nível de Atividade</label>
                <select name="nivel_atividade" value={formData.nivel_atividade} onChange={handleInputChange}>
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
                        checked={formData.objetivos.includes(opt)}
                        onChange={() => handleMultiSelect('objetivos', opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                <input 
                  name="objetivo_texto" 
                  value={formData.objetivo_texto} 
                  onChange={handleInputChange} 
                  placeholder="Outros detalhes sobre o objetivo..."
                  style={{ marginTop: '1rem' }}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Patologias / Condições</label>
                <div className="checkbox-group">
                  {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(opt => (
                    <label key={opt} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        checked={formData.patologias.includes(opt)}
                        onChange={() => handleMultiSelect('patologias', opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Medicamentos Contínuos</label>
                <textarea name="medicamentos" value={formData.medicamentos} onChange={handleInputChange} rows={2} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Suplementos em Uso</label>
                <textarea name="suplementos" value={formData.suplementos} onChange={handleInputChange} rows={2} />
              </div>
            </div>
          )}

          {/* TAB 3: HÁBITOS */}
          {activeTab === 'habitos' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Refeições por dia</label>
                <input type="number" name="refeicoes_por_dia" value={formData.refeicoes_por_dia} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Litros de água por dia</label>
                <input type="number" name="litros_agua" value={formData.litros_agua} onChange={handleInputChange} step="0.1" />
              </div>
              <div className="form-group">
                <label>Horário que acorda</label>
                <input 
                  name="horario_acorda" 
                  value={formData.horario_acorda} 
                  onChange={handleInputChange} 
                  onBlur={() => handleTimeBlur('horario_acorda')}
                  placeholder="Ex: 6 ou 06:30"
                />
              </div>
              <div className="form-group">
                <label>Horário que dorme</label>
                <input 
                  name="horario_dorme" 
                  value={formData.horario_dorme} 
                  onChange={handleInputChange} 
                  onBlur={() => handleTimeBlur('horario_dorme')}
                  placeholder="Ex: 23 ou 22:30"
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="checkbox-item" style={{ fontSize: '1rem', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    name="atividade_fisica" 
                    checked={formData.atividade_fisica} 
                    onChange={handleInputChange} 
                  />
                  Pratica atividade física?
                </label>
                {formData.atividade_fisica && (
                  <textarea 
                    name="atividade_fisica_descricao" 
                    value={formData.atividade_fisica_descricao} 
                    onChange={handleInputChange} 
                    placeholder="Quais atividades e frequência semanal?"
                    style={{ marginTop: '1rem' }}
                    rows={2}
                  />
                )}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Observações Gerais</label>
                <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn" 
              onClick={() => {
                if (activeTab === 'clinico') setActiveTab('pessoal');
                if (activeTab === 'habitos') setActiveTab('clinico');
              }}
              disabled={activeTab === 'pessoal'}
            >
              Anterior
            </button>
            
            {activeTab !== 'habitos' ? (
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ width: 'auto' }}
                onClick={() => {
                  if (activeTab === 'pessoal') setActiveTab('clinico');
                  else setActiveTab('habitos');
                }}
              >
                Próximo
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: 'auto' }}
                disabled={loading}
              >
                <Save size={20} />
                {loading ? 'Salvando...' : 'Salvar Paciente'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
