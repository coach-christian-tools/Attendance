import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { GROUPS, type Athlete, type GroupType } from '../types';
import { getAthletes, addAthlete, updateAthlete, deleteAthlete } from '../services/db';
import { Edit2, Trash2, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';

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
      <div className="flex-between mb-4">
        <h2>Groups</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add
        </button>
      </div>

      {showAddModal && (
        <div className="card mb-4" style={{ border: '2px solid var(--accent-color)' }}>
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
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save</button>
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
              <h3 
                className="mb-2 text-secondary flex-between" 
                style={{ color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleGroup(groupName)}
              >
                <span>{groupName} ({groupAthletes.length})</span>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </h3>
              {isExpanded && (
                <div style={{ marginTop: '0.5rem' }}>
                  {groupAthletes.map(athlete => (
                    <div key={athlete.id} className="card flex-between" style={{ marginBottom: '0.5rem', padding: '0.75rem 1rem' }}>
                      <div>
                        <strong>{athlete.firstName} {athlete.lastName}</strong>
                      </div>
                      <div>
                        <button className="btn-icon" onClick={() => handleEdit(athlete)}><Edit2 size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(athlete.id!)}><Trash2 size={16} color="var(--absent-color)" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
