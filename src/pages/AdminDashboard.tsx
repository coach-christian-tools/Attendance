import { useState, useEffect } from 'react';
import { Calendar, Users, RefreshCw } from 'lucide-react';
import AttendanceView from '../components/AttendanceView';
import GroupManager from '../components/GroupManager';
import StatsView from '../components/StatsView';
import { BarChart2 } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'groups' | 'stats'>('attendance');

  useEffect(() => {
    const handleNavigate = () => setActiveTab('attendance');
    window.addEventListener('navigateAttendance', handleNavigate);
    return () => window.removeEventListener('navigateAttendance', handleNavigate);
  }, []);

  return (
    <div className="app-container">
      <main className="main-content" style={{ paddingTop: '0.5rem' }}>
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'groups' && <GroupManager />}
        {activeTab === 'stats' && <StatsView />}
      </main>

      <nav className="bottom-nav">
        {/* Home button removed for admin view */}
        <button 
          className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Calendar size={24} />
          <span>Attendance</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Users size={24} />
          <span>Groups</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart2 size={24} />
          <span>Stats</span>
        </button>
        <button 
          className="nav-item"
          onClick={() => window.dispatchEvent(new CustomEvent('refreshData'))}
        >
          <RefreshCw size={24} />
          <span>Refresh</span>
        </button>
      </nav>
    </div>
  );
}
