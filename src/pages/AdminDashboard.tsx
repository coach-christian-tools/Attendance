import { useState } from 'react';
import { LogOut, Calendar, Users } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AttendanceView from '../components/AttendanceView';
import GroupManager from '../components/GroupManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'groups'>('attendance');

  const handleSignOut = () => signOut(auth);

  return (
    <div className="app-container">
      <header className="header">
        <h1>Velocity Admin</h1>
        <button className="btn-icon" onClick={handleSignOut} title="Sign Out">
          <LogOut size={20} />
        </button>
      </header>

      <main className="main-content">
        {activeTab === 'attendance' ? <AttendanceView /> : <GroupManager />}
      </main>

      <nav className="bottom-nav">
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
