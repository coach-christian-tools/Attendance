import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { getAthletes, getAllAttendance } from '../services/db';
import { type AttendanceRecord, GROUPS } from '../types';
import { fetchEventsForRange, type GCalEvent } from '../gcal';
import { ChevronDown, ChevronRight, StickyNote, X } from 'lucide-react';

interface DayStats {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalUndeclared: number;
  totalAthletes: number;
  groupStats: Record<string, { present: number, absent: number, undeclared: number, total: number }>;
  groupHasRecords: Record<string, boolean>;
  groupNotes: Record<string, string>;
  dayHasNotes: boolean;
}

const StatusBar = ({ present, absent, total }: { present: number, absent: number, total: number }) => {
  if (total === 0) return <div style={{ height: '12px', width: '100%', borderRadius: '6px', backgroundColor: 'var(--unmarked-color)' }} />;
  
  const pPct = (present / total) * 100;
  const aPct = (absent / total) * 100;
  
  return (
    <div style={{ display: 'flex', height: '12px', width: '100%', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--unmarked-color)' }}>
      <div style={{ width: `${pPct}%`, backgroundColor: 'var(--present-color)', transition: 'width 0.3s ease' }} title={`${present} Present`} />
      <div style={{ width: `${aPct}%`, backgroundColor: 'var(--absent-color)', transition: 'width 0.3s ease' }} title={`${absent} Absent`} />
    </div>
  );
};

export default function StatsView() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DayStats[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [popupNote, setPopupNote] = useState<{ group: string, date: string, text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [athletes, attendance] = await Promise.all([
        getAthletes(),
        getAllAttendance()
      ]);

      const today = new Date();
      let minDate = subDays(today, 14); // Show at least last 14 days
      attendance.forEach(r => {
        const d = new Date(r.date);
        if (!isNaN(d.getTime()) && d < minDate) {
          minDate = d;
        }
      });

      // Cap the lookback to the app's launch date
      const appLaunchDate = new Date(2026, 3, 20); // April 20th, 2026
      if (minDate < appLaunchDate) {
        minDate = appLaunchDate;
      }

      const allEvents = await fetchEventsForRange(minDate, today);

      const eventsByDate: Record<string, GCalEvent[]> = {};
      allEvents.forEach(e => {
        const dateStr = e.start.dateTime ? format(new Date(e.start.dateTime), 'yyyy-MM-dd') : e.start.date;
        if (!dateStr) return;
        if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
        eventsByDate[dateStr].push(e);
      });

      // Group attendance by date
      const attendanceByDate: Record<string, AttendanceRecord[]> = {};
      attendance.forEach(record => {
        if (!attendanceByDate[record.date]) {
          attendanceByDate[record.date] = [];
        }
        attendanceByDate[record.date].push(record);
      });

      // Calculate stats per day based on days with GCal events
      const dates = Object.keys(eventsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      const dayStatsArray: DayStats[] = dates.map(date => {
        const recordsForDay = attendanceByDate[date] || [];
        const eventsForDay = eventsByDate[date] || [];
        
        const groupStats: Record<string, { present: number, absent: number, undeclared: number, total: number }> = {};
        const groupHasRecords: Record<string, boolean> = {};
        
        // Initialize group stats
        GROUPS.forEach(g => {
          groupStats[g] = { present: 0, absent: 0, undeclared: 0, total: 0 };
          groupHasRecords[g] = false;
        });

        const groupNotes: Record<string, string> = {};
        let dayHasNotes = false;

        const eventNotes: Record<string, string> = {};
        const eventOverrides: Record<string, string> = {};
        recordsForDay.forEach(r => {
          if (r.note) eventNotes[r.eventId] = r.note;
          if (r.groupOverride) eventOverrides[r.eventId] = r.groupOverride;
        });

        // Determine which groups had events based on GCal
        eventsForDay.forEach(e => {
          const note = eventNotes[e.id];
          if (note) dayHasNotes = true;
          
          const override = eventOverrides[e.id];
          if (override === 'None') return;

          let eventMatchedGroup = false;
          
          if (override && override !== 'All') {
            if (groupHasRecords[override] !== undefined) {
              groupHasRecords[override] = true;
              eventMatchedGroup = true;
              if (note) groupNotes[override] = note;
            }
          } else {
            GROUPS.forEach(g => {
              const searchStr = g === 'Rec Team' ? 'Rec' : g;
              if (e.summary.toLowerCase().includes(searchStr.toLowerCase())) {
                groupHasRecords[g] = true;
                eventMatchedGroup = true;
                if (note) groupNotes[g] = note;
              }
            });
          }

          if (!eventMatchedGroup) {
            if (override === 'All' || /all|full team/i.test(e.summary)) {
              // Full team event, all groups have an event
              GROUPS.forEach(g => { 
                groupHasRecords[g] = true; 
                if (note) groupNotes[g] = note;
              });
            } else {
              // Only include groups that have at least one marked athlete for this event
              const eventRecord = recordsForDay.find(r => r.eventId === e.id);
              if (eventRecord && eventRecord.records) {
                Object.entries(eventRecord.records).forEach(([athId, status]) => {
                  if (status === 'present' || status === 'absent') {
                    const athlete = athletes.find(a => a.id === athId);
                    if (athlete && athlete.group) {
                      groupHasRecords[athlete.group] = true;
                      if (note) groupNotes[athlete.group] = note;
                    }
                  }
                });
              }
            }
          }
        });

        // Count totals based on athletes
        athletes.forEach(athlete => {
          if (!athlete.id) return;
          const group = athlete.group;
          
          if (groupStats[group]) {
            groupStats[group].total += 1;
          }

          // Determine status for the day (present > absent > unmarked)
          let finalStatus = 'unmarked';

          for (const record of recordsForDay) {
            if (eventOverrides[record.eventId] === 'None') continue;
            const status = record.records[athlete.id];
            if (status === 'present') {
              finalStatus = 'present';
            } else if (status === 'absent' && finalStatus !== 'present') {
              finalStatus = 'absent';
            }
          }

          if (finalStatus === 'present') {
            if (groupStats[group]) groupStats[group].present++;
          } else if (finalStatus === 'absent') {
            if (groupStats[group]) groupStats[group].absent++;
          } else {
            if (groupStats[group]) groupStats[group].undeclared++;
          }
        });

        let dayTotalAthletes = 0;
        let dayTotalPresent = 0;
        let dayTotalAbsent = 0;
        let dayTotalUndeclared = 0;

        GROUPS.forEach(g => {
          if (groupHasRecords[g]) {
            const gStat = groupStats[g];
            dayTotalAthletes += gStat.total;
            dayTotalPresent += gStat.present;
            dayTotalAbsent += gStat.absent;
            dayTotalUndeclared += gStat.undeclared;
          }
        });

        return {
          date,
          totalPresent: dayTotalPresent,
          totalAbsent: dayTotalAbsent,
          totalUndeclared: dayTotalUndeclared,
          totalAthletes: dayTotalAthletes,
          groupStats,
          groupHasRecords,
          groupNotes,
          dayHasNotes
        };
      });

      setStats(dayStatsArray);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  if (loading) return <div className="text-center p-4">Loading stats...</div>;

  if (stats.length === 0) {
    return <div className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>No attendance records found.</div>;
  }

  return (
    <div style={{ padding: '0.5rem', paddingBottom: '5rem' }}>
      <h2 style={{ marginBottom: '1rem', paddingLeft: '0.5rem', color: 'var(--text-primary)' }}>Attendance Overview</h2>
      
      {stats.map(dayStat => {
        const isExpanded = !!expandedDates[dayStat.date];
        let displayDate = dayStat.date;
        try {
          // Add timezone correction if needed, or just parse YYYY-MM-DD
          const [year, month, day] = dayStat.date.split('-');
          displayDate = format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), 'EEEE, MMM do, yyyy');
        } catch (e) {
          // fallback to raw date
        }

        return (
          <div key={dayStat.date} className="card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
            <div 
              style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => toggleDate(dayStat.date)}
              className="flex-between"
            >
              <div style={{ flex: 1 }}>
                <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {displayDate}
                    {dayStat.dayHasNotes && <StickyNote size={16} color="var(--accent-color)" />}
                  </h3>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                    <StatusBar 
                      present={dayStat.totalPresent} 
                      absent={dayStat.totalAbsent} 
                      total={dayStat.totalAthletes} 
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--present-color)', fontWeight: 600 }}>{dayStat.totalPresent} Present</span>
                  <span style={{ color: 'var(--absent-color)', fontWeight: 600 }}>{dayStat.totalAbsent} Absent</span>
                  <span>{dayStat.totalUndeclared} Undeclared</span>
                </div>
              </div>
              <div style={{ paddingLeft: '1rem' }}>
                {isExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid var(--unmarked-color)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>By Group</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {GROUPS.map(group => {
                    const gStat = dayStat.groupStats[group];
                    if (!gStat || gStat.total === 0 || !dayStat.groupHasRecords[group]) return null;
                    
                    return (
                      <div 
                        key={group} 
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                        onClick={() => {
                          sessionStorage.setItem('attendanceNavDate', dayStat.date);
                          sessionStorage.setItem('attendanceNavGroup', group);
                          window.dispatchEvent(new CustomEvent('navigateAttendance'));
                        }}
                      >
                        <div className="flex-between" style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {group}
                            {dayStat.groupNotes[group] && (
                              <button 
                                className="btn-icon" 
                                style={{ padding: '0.1rem', color: 'var(--accent-color)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPopupNote({ group, date: displayDate, text: dayStat.groupNotes[group] });
                                }}
                              >
                                <StickyNote size={14} />
                              </button>
                            )}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {gStat.present} / {gStat.total} ({Math.round((gStat.present / gStat.total) * 100)}%)
                          </span>
                        </div>
                        <StatusBar 
                          present={gStat.present} 
                          absent={gStat.absent} 
                          total={gStat.total} 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {popupNote && (
        <div className="full-screen-popup" onClick={() => setPopupNote(null)}>
          <div className="popup-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <div className="card" style={{ padding: '1.5rem', maxWidth: '400px', margin: '0 auto', width: '100%', boxShadow: 'var(--shadow-md)' }} onClick={e => e.stopPropagation()}>
              <div className="flex-between mb-4">
                <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>Note: {popupNote.group}</h3>
                <button className="btn-icon" onClick={() => setPopupNote(null)}><X size={20} /></button>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{popupNote.date}</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                {popupNote.text}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
