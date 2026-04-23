import { useState, useEffect } from 'react';
import { GROUPS, type Athlete, type GroupType } from '../types';
import { getAthletes, addAthlete, updateAthlete, deleteAthlete, triggerSync } from '../services/db';
import { Plus, X, ChevronDown, ChevronRight, RefreshCw, Table2, LayoutGrid, Search, Filter } from 'lucide-react';

export default function GroupManager() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State (Create Only)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [group, setGroup] = useState<GroupType>('Splash');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('All');

  // Popup State
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [swimCloudIdInput, setSwimCloudIdInput] = useState('');
  const [editGroup, setEditGroup] = useState<GroupType>('Splash');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

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
    setShowAddModal(false);
  };

  const handleSync = async () => {
    if (!confirm('WARNING: This shouldn\'t be done unless a change was made in TeamUnify. Are you sure you want to proceed?')) {
      return;
    }
    setIsSyncing(true);
    try {
      await triggerSync();
      alert('TeamUnify sync triggered successfully! The background job will take a few moments to finish.');
      setTimeout(loadAthletes, 5000);
    } catch (e: any) {
      console.error(e);
      const msg = e.message || 'Error triggering sync.';
      alert(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    try {
      await addAthlete({ firstName, lastName, group, dob, gender });
      resetForm();
      loadAthletes();
    } catch (err) {
      console.error(err);
      alert('Error saving athlete');
    }
  };

  const openAthleteDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSwimCloudIdInput(athlete.swimCloudId || '');
    setEditGroup(athlete.group);
  };

  const handleSaveDetails = async () => {
    if (!selectedAthlete?.id) return;
    setIsSavingDetails(true);
    try {
      await updateAthlete(selectedAthlete.id, { swimCloudId: swimCloudIdInput, group: editGroup });
      setSelectedAthlete({ ...selectedAthlete, swimCloudId: swimCloudIdInput, group: editGroup });
      loadAthletes();
    } catch (err) {
      console.error(err);
      alert('Error saving details');
    }
    setIsSavingDetails(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this athlete?')) {
      await deleteAthlete(id);
      setSelectedAthlete(null);
      loadAthletes();
    }
  };

  if (loading) return <div className="text-center p-4">Loading athletes...</div>;

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === 'All' || a.group === filterGroup;
    return matchesSearch && matchesGroup;
  }).sort((a, b) => a.firstName.localeCompare(b.firstName));

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Create Modal */}
      {showAddModal && (
        <div className="card mb-4" style={{ border: '1px solid var(--unmarked-color)', boxShadow: 'var(--shadow-md)', padding: '1.5rem' }}>
          <div className="flex-between mb-4">
            <h3>New Athlete</h3>
            <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
          </div>
          <form onSubmit={handleSaveNew}>
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
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Athlete</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '0.5rem' }}>
        {viewMode === 'grid' ? (
          // Grid View
          GROUPS.map(groupName => {
            const groupAthletes = athletes.filter(a => a.group === groupName).sort((a, b) => {
              if (a.dob && b.dob) return new Date(a.dob).getTime() - new Date(b.dob).getTime();
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
                        <div key={athlete.id} className="athlete-card" onClick={() => openAthleteDetails(athlete)}>
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
          })
        ) : (
          // Table View
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="input-group" style={{ margin: 0, flex: 2 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    className="input-field" 
                    placeholder="Search name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <div style={{ position: 'relative' }}>
                  <Filter size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <select 
                    className="input-field" 
                    value={filterGroup} 
                    onChange={(e) => setFilterGroup(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  >
                    <option value="All">All Groups</option>
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="table-container">
              <table className="athlete-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Group</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAthletes.map(athlete => {
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
                    <tr key={athlete.id} onClick={() => openAthleteDetails(athlete)}>
                      <td style={{ fontWeight: 500 }}>
                        {athlete.firstName} {athlete.lastName ? athlete.lastName.charAt(0) + '.' : ''}
                        {ageStr && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({ageStr})</span>}
                      </td>
                      <td>
                        <span style={{ padding: '0.25rem 0.5rem', background: 'var(--unmarked-color)', borderRadius: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {athlete.group}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                  {filteredAthletes.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center" style={{ color: 'var(--text-secondary)', padding: '2rem' }}>No athletes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Athlete Details Popup */}
      {selectedAthlete && (
        <div className="full-screen-popup">
          <div className="popup-header">
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Athlete Details</h2>
            <button className="btn-icon" onClick={() => setSelectedAthlete(null)}><X size={24} /></button>
          </div>
          <div className="popup-content">
            <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>
              {selectedAthlete.firstName} {selectedAthlete.lastName}
            </h1>
            
            <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
              <div className="data-row">
                <div className="data-label">SwimCloud ID</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input 
                    className="input-field" 
                    value={swimCloudIdInput} 
                    onChange={e => setSwimCloudIdInput(e.target.value)} 
                    placeholder="Enter SwimCloud ID"
                  />
                </div>
              </div>

              <div className="data-row">
                <div className="data-label">Group</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <select 
                    className="input-field" 
                    value={editGroup} 
                    onChange={e => setEditGroup(e.target.value as GroupType)}
                  >
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveDetails}
                  disabled={isSavingDetails}
                  style={{ width: '100%' }}
                >
                  {isSavingDetails ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {Object.entries(selectedAthlete)
                .filter(([key]) => !['id', 'firstName', 'lastName', 'swimCloudId', 'group'].includes(key))
                .map(([key, value]) => {
                  let displayValue = value?.toString() || '-';
                  if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  }
                  return (
                    <div key={key} className="data-row">
                      <div className="data-label">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="data-value">{displayValue}</div>
                    </div>
                  );
                })}
            </div>

            <button 
              className="btn" 
              style={{ width: '100%', backgroundColor: 'var(--absent-color)', color: 'white', padding: '1rem' }} 
              onClick={() => selectedAthlete.id && handleDelete(selectedAthlete.id)}
            >
              Delete Athlete
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="bottom-controls" style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'var(--surface-color)', borderTop: '1px solid var(--unmarked-color)', zIndex: 90 }}>
        <button 
          className="btn" 
          onClick={() => setViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
          style={{ flex: 1, border: '1px solid var(--unmarked-color)', background: 'transparent', color: 'var(--text-primary)' }}
        >
          {viewMode === 'grid' ? <><Table2 size={18} /> Table View</> : <><LayoutGrid size={18} /> Grid View</>}
        </button>
        <button 
          className="btn" 
          onClick={handleSync} 
          disabled={isSyncing}
          style={{ flex: 1, border: '1px solid var(--unmarked-color)', background: 'transparent', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      <button className="fab" onClick={() => setShowAddModal(true)} title="Add Athlete" style={{ bottom: 'calc(9rem + env(safe-area-inset-bottom))' }}>
        <Plus size={24} />
      </button>

    </div>
  );
}
