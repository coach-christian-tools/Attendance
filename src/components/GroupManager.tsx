import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { GROUPS, type Athlete, type GroupType } from '../types';
import { getAthletes, addAthlete, updateAthlete, deleteAthlete } from '../services/db';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function GroupManager() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [group, setGroup] = useState<GroupType>('Splash');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const loadAthletes = async () => {
    setLoading(true);
    try {
      const data = await getAthletes();
      setAthletes(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAthletes();
    const handleRefresh = () => loadAthletes();
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setGroup('Splash');
    setDob('');
    setGender('');
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    try {
      if (editingId) {
        await updateAthlete(editingId, { firstName, lastName, group, dob, gender });
      } else {
        await addAthlete({ firstName, lastName, group, dob, gender });
      }
      resetForm();
      loadAthletes();
    } catch (err) {
      console.error(err);
      alert('Error saving athlete');
    }
  };

  const handleEdit = (athlete: Athlete) => {
    setEditingId(athlete.id!);
    setFirstName(athlete.firstName);
    setLastName(athlete.lastName);
    setGroup(athlete.group);
    
    let formattedDob = '';
    if (athlete.dob) {
      const parsed = new Date(athlete.dob);
      if (!isNaN(parsed.getTime())) {
        formattedDob = format(parsed, 'yyyy-MM-dd');
      }
    }
    setDob(formattedDob);
    setGender(athlete.gender || '');
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this athlete?')) {
      await deleteAthlete(id);
      loadAthletes();
    }
  };

  if (loading) return <div className="text-center p-4">Loading athletes...</div>;

  return (
    <div>

      <button className="fab" onClick={() => setShowAddModal(true)} title="Add Athlete">
        <Plus size={24} />
      </button>

      {showAddModal && (
        <div className="card mb-4" style={{ border: '1px solid var(--unmarked-color)', boxShadow: 'var(--shadow-md)', padding: '1.5rem' }}>
          <div className="flex-between mb-4">
            <h3>{editingId ? 'Edit Athlete' : 'New Athlete'}</h3>
            <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
          </div>
          <form onSubmit={handleSave}>
            <div className="input-group">
              <label className="input-label">First Name</label>
              <input required className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Last Name</label>
              <input required className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Group</label>
              <select className="input-field" value={group} onChange={e => setGroup(e.target.value as GroupType)}>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Birthday (optional)</label>
              <input type="date" className="input-field" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Gender (optional)</label>
              <select className="input-field" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Select...</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              {editingId && (
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--absent-color)', color: 'white' }} onClick={() => {
                  handleDelete(editingId);
                  resetForm();
                }}>
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div style={{ padding: '0.5rem' }}>
        {GROUPS.map(groupName => {
          const groupAthletes = athletes.filter(a => a.group === groupName).sort((a, b) => {
            if (a.dob && b.dob) {
              return new Date(a.dob).getTime() - new Date(b.dob).getTime();
            }
            if (a.dob) return -1;
            if (b.dob) return 1;
            return a.firstName.localeCompare(b.firstName);
          });
          
          if (groupAthletes.length === 0) return null;
          
          const isExpanded = !!expandedGroups[groupName];

          return (
            <div key={groupName} className="mb-4">
              <div 
                className="card flex-between" 
                style={{ cursor: 'pointer', userSelect: 'none', alignItems: 'flex-start', padding: '1rem' }}
                onClick={() => toggleGroup(groupName)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h3 style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{groupName}</h3>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {groupAthletes.map(a => (
                      <div 
                        key={a.id} 
                        style={{ width: 12, height: 12, backgroundColor: 'var(--accent-color)', borderRadius: 3, opacity: 0.7 }} 
                        title={`${a.firstName} ${a.lastName}`} 
                      />
                    ))}
                  </div>
                </div>
                <div style={{ padding: '0.25rem' }}>
                  {isExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                </div>
              </div>
              {isExpanded && (
                <div className="athlete-grid" style={{ marginTop: '0.75rem' }}>
                  {groupAthletes.map(athlete => {
                    let ageStr = '';
                    if (athlete.dob) {
                      const parsedDate = new Date(athlete.dob);
                      if (!isNaN(parsedDate.getTime())) {
                        const diffMs = Date.now() - parsedDate.getTime();
                        const ageDt = new Date(diffMs); 
                        ageStr = `${Math.abs(ageDt.getUTCFullYear() - 1970)}${athlete.gender ? athlete.gender : ''}`;
                      }
                    }
                    return (
                      <div 
                        key={athlete.id} 
                        className="athlete-card"
                        onClick={() => handleEdit(athlete)}
                      >
                        <div className="athlete-name">
                          {athlete.firstName} {athlete.lastName ? athlete.lastName.charAt(0) + '.' : ''}
                          {ageStr && <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', opacity: 0.8 }}>({ageStr})</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
