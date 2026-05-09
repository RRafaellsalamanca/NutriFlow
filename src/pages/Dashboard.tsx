import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabaseClient';

interface Patient {
  id: string;
  nome: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [totalPatients, setTotalPatients] = useState(0);
  const [weeklyConsultations, setWeeklyConsultations] = useState(0);
  const [patientsWithoutReturn, setPatientsWithoutReturn] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // 1. Total Patients
        const { count: patientsCount } = await supabase
          .from('pacientes')
          .select('*', { count: 'exact', head: true })
          .eq('nutricionista_id', user.id);
        
        setTotalPatients(patientsCount || 0);

        // 2. Weekly Consultations
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const { count: consultationsCount } = await supabase
          .from('consultas')
          .select('id, pacientes!inner(nutricionista_id)', { count: 'exact', head: true })
          .eq('pacientes.nutricionista_id', user.id)
          .gte('data_consulta', firstDayOfWeek.toISOString().split('T')[0]);

        setWeeklyConsultations(consultationsCount || 0);

        // 3. Patients Without Return
        // Logic: Last consultation > 30 days ago AND (no proximo_retorno OR proximo_retorno < today)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        // Fetch all patients for this nutritionist
        const { data: patients } = await supabase
          .from('pacientes')
          .select('id, nome')
          .eq('nutricionista_id', user.id);

        if (patients) {
          const alertPatients: Patient[] = [];
          
          for (const p of patients) {
            // Get latest consultation for this patient
            const { data: latestCons } = await supabase
              .from('consultas')
              .select('data_consulta, proximo_retorno')
              .eq('paciente_id', p.id)
              .order('data_consulta', { ascending: false })
              .limit(1)
              .single();

            if (latestCons) {
              const hasNoFutureReturn = !latestCons.proximo_retorno || latestCons.proximo_retorno < todayStr;
              const isOldConsultation = latestCons.data_consulta < thirtyDaysAgoStr;

              if (isOldConsultation && hasNoFutureReturn) {
                alertPatients.push(p);
              }
            } else {
              // Patient with no consultations yet - might want to exclude or include?
              // The prompt says "cuja última consulta foi há mais de 30 dias", implying at least one exists.
            }
          }
          setPatientsWithoutReturn(alertPatients);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="loading-container">Carregando dados...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Bem-vindo ao NutriFlow. Aqui está o resumo da sua clínica.</p>

      <div className="dashboard-grid">
        {/* Card 1: Total Patients */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="card-title">Total de Pacientes</p>
              <h2 className="card-value">{totalPatients}</h2>
            </div>
            <div className="icon-box-success">
              <Users size={24} />
            </div>
          </div>
          <p className="text-success" style={{ fontSize: '0.875rem', marginTop: '1rem', fontWeight: 500 }}>
            Pacientes ativos no sistema
          </p>
        </div>

        {/* Card 2: Consultations of the Week */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="card-title">Consultas da Semana</p>
              <h2 className="card-value">{weeklyConsultations}</h2>
            </div>
            <div className="icon-box-info">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-info" style={{ fontSize: '0.875rem', marginTop: '1rem', fontWeight: 500 }}>
            Realizadas nos últimos 7 dias
          </p>
        </div>

        {/* Card 3: Patients Without Return */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="card-title">Pacientes Sem Retorno</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 className="card-value">{patientsWithoutReturn.length}</h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>em alerta</span>
              </div>
            </div>
            <div className="icon-box-warning">
              <Clock size={24} />
            </div>
          </div>
          
          {patientsWithoutReturn.length > 0 ? (
            <ul className="card-list">
              {patientsWithoutReturn.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link to={`/pacientes/${p.id}`} className="card-list-item">
                    {p.nome}
                  </Link>
                </li>
              ))}
              {patientsWithoutReturn.length > 5 && (
                <li className="empty-state" style={{ fontSize: '0.75rem' }}>
                  e mais {patientsWithoutReturn.length - 5} pacientes...
                </li>
              )}
            </ul>
          ) : (
            <p className="empty-state">Nenhum paciente sem retorno no momento</p>
          )}
        </div>
      </div>
    </div>
  );
};
