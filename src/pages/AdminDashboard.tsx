import { useState } from 'react';
import { Calendar, Users, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AttendanceView from '../components/AttendanceView';
import GroupManager from '../components/GroupManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'groups'>('attendance');
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <main className="main-content" style={{ paddingTop: '0.5rem' }}>
        {activeTab === 'attendance' ? <AttendanceView /> : <GroupManager />}
      </main>

      <nav className="bottom-nav">
        <button 
          className="nav-item"
          onClick={() => navigate('/')}
        >
          <HomeIcon size={24} />
          <span>Home</span>
        </button>
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
      </nav>
    </div>
  );
}
