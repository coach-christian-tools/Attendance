import { useState } from 'react';
import { Calendar, Users, RefreshCw } from 'lucide-react';
import AttendanceView from '../components/AttendanceView';
import GroupManager from '../components/GroupManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'groups'>('attendance');

  return (
    <div className="app-container">
      <main className="main-content" style={{ paddingTop: '0.5rem' }}>
        {activeTab === 'attendance' ? <AttendanceView /> : <GroupManager />}
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
