import { useState, useEffect } from 'react';
import { format, addDays, differenceInYears } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchEventsForDate, type GCalEvent } from '../gcal';
import { getAthletes, getAttendance, saveAttendance } from '../services/db';
import { GROUPS, type Athlete, type AttendanceStatus, type GroupType } from '../types';

export default function AttendanceView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [allAttendance, setAllAttendance] = useState<Record<string, Record<string, AttendanceStatus>>>({});

  const [filterGroup, setFilterGroup] = useState<GroupType | 'All'>('All');

  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);
      const fetchedEvents = await fetchEventsForDate(selectedDate);

      const counts: Record<string, number> = {};
      fetchedEvents.forEach(e => {
        const name = e.summary.trim();
        counts[name] = (counts[name] || 0) + 1;
      });

      const seen: Record<string, number> = {};
      const processedEvents = fetchedEvents.map(e => {
        const name = e.summary.trim();
        let displaySummary = name;
        if (counts[name] > 1) {
          seen[name] = (seen[name] || 0) + 1;
          const suffix = seen[name] === 1 ? ' AM' : ' PM';
          displaySummary = `${name}${suffix}`;
        }
        return { ...e, displaySummary };
      });

      setEvents(processedEvents);
      if (processedEvents.length > 0) {
        setSelectedEventId(processedEvents[0].id);
      } else {
        setSelectedEventId(null);
      }
      setLoadingEvents(false);
    };
    loadEvents();
  }, [selectedDate]);

  useEffect(() => {
    const loadData = async () => {
      const aths = await getAthletes();
      setAthletes(aths);
    };
    loadData();
  }, []);

  useEffect(() => {
    let active = true;
    const loadAttendance = async () => {
      if (events.length === 0) {
        if (active) setAllAttendance({});
        return;
      }
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const results = await Promise.all(
        events.map(e => getAttendance(e.id, dateStr).then(data => ({ id: e.id, data })))
      );

      if (!active) return;

      const newAllAttendance: Record<string, Record<string, AttendanceStatus>> = {};
      results.forEach(r => {
        newAllAttendance[r.id] = r.data;
      });
      setAllAttendance(newAllAttendance);
    };
    loadAttendance();
    return () => { active = false; };
  }, [events, selectedDate]);

  const attendance = selectedEventId ? (allAttendance[selectedEventId] || {}) : {};

  const handleDateChange = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  const handleAttendanceTap = async (athleteId: string) => {
    if (!selectedEventId) return;
    const current = attendance[athleteId] || 'unmarked';
    let next: AttendanceStatus = 'present';
    if (current === 'present') next = 'absent';
    else if (current === 'absent') next = 'unmarked';

    const newAttendance = { ...attendance, [athleteId]: next };
    setAllAttendance(prev => ({
      ...prev,
      [selectedEventId]: newAttendance
    }));

    // Save to Firebase
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await saveAttendance(selectedEventId, dateStr, newAttendance);
  };

  const refreshAttendance = async () => {
    if (events.length === 0) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const results = await Promise.all(
      events.map(e => getAttendance(e.id, dateStr).then(data => ({ id: e.id, data })))
    );
    const newAllAttendance: Record<string, Record<string, AttendanceStatus>> = {};
    results.forEach(r => {
      newAllAttendance[r.id] = r.data;
    });
    setAllAttendance(newAllAttendance);
  };

  useEffect(() => {
    const handleRefresh = () => {
      refreshAttendance();
    };
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [events, selectedDate]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isFullTeam = selectedEvent ? !GROUPS.some(g => {
    const searchStr = g === 'Rec Team' ? 'Rec' : g;
    return selectedEvent.summary.toLowerCase().includes(searchStr.toLowerCase());
  }) : false;

  // Filter and sort athletes
  let displayAthletes = athletes;
  if (selectedEvent) {
    if (isFullTeam && filterGroup !== 'All') {
      displayAthletes = athletes.filter(a => a.group === filterGroup);
    } else if (!isFullTeam) {
      // Find matching group
      const matchedGroup = GROUPS.find(g => {
        const searchStr = g === 'Rec Team' ? 'Rec' : g;
        return selectedEvent.summary.toLowerCase().includes(searchStr.toLowerCase());
      });
      if (matchedGroup) {
        displayAthletes = athletes.filter(a => a.group === matchedGroup);
      }
    }
  }

  const sortedAthletes = [...displayAthletes].sort((a, b) => {
    if (a.dob && b.dob) {
      return new Date(a.dob).getTime() - new Date(b.dob).getTime();
    }
    if (a.dob) return -1;
    if (b.dob) return 1;
    return a.firstName.localeCompare(b.firstName);
  });

  const presentCount = sortedAthletes.filter(a => (attendance[a.id!] || 'unmarked') === 'present').length;
  const absentCount = sortedAthletes.filter(a => (attendance[a.id!] || 'unmarked') === 'absent').length;
  const unmarkedCount = sortedAthletes.filter(a => (attendance[a.id!] || 'unmarked') === 'unmarked').length;

  return (
    <div>
      {/* Floating Stats at the top */}
      {selectedEventId && sortedAthletes.length > 0 && (
        <div className="floating-stats">
          <div className="stat-item">
            <div className="stat-dot present" title="Present"></div>
            <span>{presentCount}</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot absent" title="Absent"></div>
            <span>{absentCount}</span>
          </div>
          <div className="stat-item">
            <div className="stat-dot unmarked" title="Undeclared"></div>
            <span>{unmarkedCount}</span>
          </div>
        </div>
      )}

      {/* Attendance Grid */}
      {selectedEventId && (
        <div style={{ paddingTop: '60px', paddingBottom: '140px' }}>

          <div className="athlete-grid">
            {sortedAthletes.map(athlete => {
              const status = attendance[athlete.id!] || 'unmarked';
              let ageStr = '';
              if (athlete.dob) {
                const parsedDate = new Date(athlete.dob);
                if (!isNaN(parsedDate.getTime())) {
                  ageStr = `${differenceInYears(new Date(), parsedDate)}${athlete.gender ? athlete.gender : ''}`;
                }
              }
              return (
                <div
                  key={athlete.id}
                  className={`athlete-card ${status}`}
                  onClick={() => handleAttendanceTap(athlete.id!)}
                >
                  <div className="athlete-name">
                    {athlete.firstName} {athlete.lastName ? athlete.lastName.charAt(0) + '.' : ''}
                    {ageStr && <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', opacity: 0.8 }}>({ageStr})</span>}
                  </div>
                  {isFullTeam && <div className="athlete-group">{athlete.group}</div>}
                </div>
              );
            })}
          </div>
          {sortedAthletes.length === 0 && (
            <div className="text-center text-secondary p-4">
              No athletes found for this group.
            </div>
          )}

        </div>
      )}

      <div className="bottom-controls">
        {selectedEventId && isFullTeam && (
          <div className="mb-2">
            <select
              className="input-field"
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value as GroupType | 'All')}
            >
              <option value="All">All Groups (Full Team Event)</option>
              {GROUPS.map(g => {
                const size = athletes.filter(a => a.group === g).length;
                return <option key={g} value={g}>{g} ({size})</option>;
              })}
            </select>
          </div>
        )}

        {/* Events Selector */}
        {loadingEvents ? (
          <div className="text-center p-2">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="card text-center text-secondary mb-2">No events found.</div>
        ) : (
          <div className="event-list" style={{ marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
            {events.map(event => (
              <button
                key={event.id}
                className={`card event-card ${selectedEventId === event.id ? 'active' : ''}`}
                onClick={() => setSelectedEventId(event.id)}
              >
                {event.displaySummary || event.summary}
              </button>
            ))}
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex-between card" style={{ marginBottom: '0.5rem' }}>
          <button className="btn-icon" onClick={() => handleDateChange(-1)}>
            <ChevronLeft size={24} />
          </button>
          <div className="text-center" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              {format(selectedDate, 'EEEE, MMM do')}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                {events.length} Event{events.length !== 1 && 's'}
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={() => handleDateChange(1)}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
