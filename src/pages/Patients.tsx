import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/AuthContext';

interface Patient {
  id: string;
  nome: string;
  objetivos: string[] | null;
  latest_consultation?: string;
}

export const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPatients() {
      if (!user) return;

      const { data: patientsData, error } = await supabase
        .from('pacientes')
        .select(`
          id, 
          nome, 
          objetivos,
          consultas (data_consulta)
        `)
        .eq('nutricionista_id', user.id)
        .order('nome');

      if (error) {
        console.error('Error fetching patients:', error);
      } else {
        const formattedPatients = patientsData.map((p: any) => ({
          ...p,
          latest_consultation: p.consultas?.length > 0 
            ? p.consultas.sort((a: any, b: any) => b.data_consulta.localeCompare(a.data_consulta))[0].data_consulta 
            : 'Sem consulta'
        }));
        setPatients(formattedPatients);
      }
      setLoading(false);
    }

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-container">Carregando pacientes...</div>;
  }

  return (
    <div>
      <div className="list-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Pacientes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gerencie sua base de pacientes</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto' }}
          onClick={() => navigate('/pacientes/novo')}
        >
          <UserPlus size={20} />
          Novo Paciente
        </button>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <div className="search-bar">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredPatients.length > 0 ? (
        <table className="patient-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Objetivo</th>
              <th>Última Consulta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/pacientes/${p.id}`)}>
                <td style={{ fontWeight: 600 }}>{p.nome}</td>
                <td>
                  {p.objetivos && p.objetivos.length > 0 
                    ? <span className="badge">{p.objetivos[0]}</span> 
                    : <span className="empty-state">Não informado</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Calendar size={16} />
                    {p.latest_consultation === 'Sem consulta' 
                      ? 'Sem consulta' 
                      : new Date(p.latest_consultation + 'T00:00:00').toLocaleDateString('pt-BR')
                    }
                  </div>
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                  <ChevronRight size={20} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p className="empty-state" style={{ fontSize: '1.125rem' }}>
            {searchTerm ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}
          </p>
        </div>
      )}
    </div>
  );
};
