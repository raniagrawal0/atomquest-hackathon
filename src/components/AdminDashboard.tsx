'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsPanel from './AnalyticsPanel';

interface Summary {
  totalEmployees: number;
  totalGoals: number;
  approvedGoals: number;
  draftGoals: number;
  rejectedGoals: number;
  totalAchievements: number;
  completedAchievements: number;
  totalCheckIns: number;
}

interface EmployeeStat {
  id: string;
  name: string;
  email: string;
  totalGoals: number;
  approvedGoals: number;
  totalWeightage: number;
  achievements: number;
  completedAchievements: number;
  checkIns: number;
  goalsFilled: boolean;
}

export default function AdminDashboard({ user }: { user: any }) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [employees, setEmployees] = useState<EmployeeStat[]>([]);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSharedGoalForm, setShowSharedGoalForm] = useState(false);
  const [showGoalManagement, setShowGoalManagement] = useState(false);
  const [pushResult, setPushResult] = useState<any>(null);
  const [pushing, setPushing] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editValues, setEditValues] = useState({ target: '', weightage: 10, status: 'DRAFT', locked: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'audit' | 'analytics'>('overview');

  useEffect(() => {
    fetchOverview();
    fetchAllGoals();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      setSummary(data.summary);
      setEmployees(data.employees);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGoals = async () => {
    try {
      const res = await fetch('/api/admin/goals');
      const data = await res.json();
      setAllGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePushSharedGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPushing(true);
    setPushResult(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/admin/shared-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setPushResult(result);
      setShowSharedGoalForm(false);
      fetchOverview();
      fetchAllGoals();
    } catch (err) {
      console.error(err);
    } finally {
      setPushing(false);
    }
  };

  const handleAdminIntervention = async () => {
    if (!editingGoal) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: editingGoal.id,
          status: editValues.status,
          locked: editValues.locked,
          target: editValues.target,
          weightage: editValues.weightage,
        }),
      });
      setEditingGoal(null);
      fetchAllGoals();
      fetchOverview();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/admin/export', '_blank');
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Employees" value={summary?.totalEmployees || 0} color="var(--primary)" />
        <StatCard label="Total Goals" value={summary?.totalGoals || 0} color="var(--secondary)" />
        <StatCard label="Approved" value={summary?.approvedGoals || 0} color="var(--success)" />
        <StatCard label="Draft" value={summary?.draftGoals || 0} color="var(--warning)" />
        <StatCard label="Rejected" value={summary?.rejectedGoals || 0} color="var(--danger)" />
        <StatCard label="Achievements" value={summary?.totalAchievements || 0} color="#06b6d4" />
        <StatCard label="Completed" value={summary?.completedAchievements || 0} color="var(--success)" />
        <StatCard label="Check-ins" value={summary?.totalCheckIns || 0} color="var(--secondary)" />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem' }}>
        {(['overview', 'goals', 'analytics', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 20px', fontSize: '0.9rem', textTransform: 'capitalize' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'goals' ? '🎯 Goal Management' : tab === 'analytics' ? '📈 Analytics' : '📜 Audit Trail'}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <>
          {/* Action Buttons */}
          <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <h3>Admin Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setShowSharedGoalForm(!showSharedGoalForm)}>
                {showSharedGoalForm ? 'Cancel' : '📋 Push Shared Goal'}
              </button>
              <button className="btn btn-secondary" onClick={handleExportCSV}>
                📊 Download Achievement Report (CSV)
              </button>
            </div>
          </div>

          {/* Push Result */}
          {pushResult && (
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h4>Push Results</h4>
              <div style={{ marginTop: '1rem' }}>
                {pushResult.results?.map((r: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>{r.employee}</span>
                    <span className={`badge ${r.status === 'CREATED' ? 'badge-success' : 'badge-warning'}`}>
                      {r.status} {r.reason ? `— ${r.reason}` : ''}
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setPushResult(null)}>Dismiss</button>
            </div>
          )}

          {/* Shared Goal Form */}
          {showSharedGoalForm && (
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
              <h4>Push Shared Goal to All Employees</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>This will auto-create an APPROVED & LOCKED goal for every employee.</p>
              <form onSubmit={handlePushSharedGoal}>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="input-group">
                    <label>Goal Title</label>
                    <input type="text" name="title" required placeholder="e.g. Mandatory Safety Training" />
                  </div>
                  <div className="input-group">
                    <label>Thrust Area</label>
                    <input type="text" name="thrustArea" required placeholder="e.g. Compliance" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea name="description" rows={2} placeholder="Optional description..."></textarea>
                </div>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="input-group">
                    <label>UoM</label>
                    <select name="uom" required>
                      <option value="NUMERIC">Numeric</option>
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="TIMELINE">Timeline</option>
                      <option value="ZERO_BASED">Zero-based</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Target</label>
                    <input type="text" name="target" required placeholder="e.g. 100" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Weightage (%)</label>
                  <input type="number" name="weightage" required min="10" max="100" placeholder="10" />
                  <small style={{ color: 'var(--text-muted)' }}>This will be added to each employee&apos;s existing weightage.</small>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pushing}>
                  {pushing ? 'Pushing to all employees...' : 'Push Shared Goal'}
                </button>
              </form>
            </div>
          )}

          {/* Employee Completion Table */}
          <div className="glass-panel">
            <h3>Employee Goal Completion Overview</h3>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Goals</th>
                    <th style={thStyle}>Approved</th>
                    <th style={thStyle}>Weightage</th>
                    <th style={thStyle}>Achievements</th>
                    <th style={thStyle}>Completed</th>
                    <th style={thStyle}>Check-ins</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={tdStyle}>
                        <strong>{emp.name}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</span>
                      </td>
                      <td style={tdStyle}>{emp.totalGoals}</td>
                      <td style={tdStyle}>{emp.approvedGoals}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(emp.totalWeightage, 100)}%`,
                              height: '100%',
                              background: emp.totalWeightage === 100 ? 'var(--success)' : 'var(--warning)',
                              borderRadius: '3px',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', minWidth: '40px' }}>{emp.totalWeightage}%</span>
                        </div>
                      </td>
                      <td style={tdStyle}>{emp.achievements}</td>
                      <td style={tdStyle}>{emp.completedAchievements}</td>
                      <td style={tdStyle}>{emp.checkIns}</td>
                      <td style={tdStyle}>
                        <span className={`badge ${emp.goalsFilled ? 'badge-success' : 'badge-warning'}`}>
                          {emp.goalsFilled ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ ...tdStyle, textAlign: 'center' }}>No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== GOAL MANAGEMENT TAB ===== */}
      {activeTab === 'goals' && (
        <div className="glass-panel">
          <h3>All Goals — Admin Intervention</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            As Admin, you can unlock locked goals, change status, or edit targets/weightages for any employee.
          </p>

          {/* Editing Panel */}
          {editingGoal && (
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '20px', marginBottom: '2rem' }}>
              <h4>Editing: {editingGoal.title} ({editingGoal.employee?.name})</h4>
              <div className="grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="input-group">
                  <label>Status</label>
                  <select value={editValues.status} onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Locked?</label>
                  <select value={editValues.locked ? 'true' : 'false'} onChange={(e) => setEditValues({ ...editValues, locked: e.target.value === 'true' })}>
                    <option value="false">🔓 Unlocked</option>
                    <option value="true">🔒 Locked</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Target</label>
                  <input type="text" value={editValues.target} onChange={(e) => setEditValues({ ...editValues, target: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Weightage (%)</label>
                  <input type="number" min="10" max="100" value={editValues.weightage} onChange={(e) => setEditValues({ ...editValues, weightage: parseInt(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={handleAdminIntervention} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : '💾 Save Changes (Admin Override)'}
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingGoal(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Goal</th>
                  <th style={thStyle}>Thrust Area</th>
                  <th style={thStyle}>Target</th>
                  <th style={thStyle}>Weight</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Locked</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allGoals.map((goal: any) => (
                  <tr key={goal.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={tdStyle}>
                      <strong>{goal.employee?.name}</strong>
                    </td>
                    <td style={tdStyle}>{goal.title}</td>
                    <td style={tdStyle}>{goal.thrustArea}</td>
                    <td style={tdStyle}>{goal.target} {goal.uom}</td>
                    <td style={tdStyle}>{goal.weightage}%</td>
                    <td style={tdStyle}>
                      <span className={`badge ${goal.status === 'APPROVED' ? 'badge-success' : goal.status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'}`}>
                        {goal.status}
                      </span>
                    </td>
                    <td style={tdStyle}>{goal.locked ? '🔒' : '🔓'}</td>
                    <td style={tdStyle}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => {
                          setEditingGoal(goal);
                          setEditValues({
                            target: goal.target,
                            weightage: goal.weightage,
                            status: goal.status,
                            locked: goal.locked,
                          });
                        }}
                      >
                        ✏️ Intervene
                      </button>
                    </td>
                  </tr>
                ))}
                {allGoals.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...tdStyle, textAlign: 'center' }}>No goals found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== AUDIT TRAIL TAB ===== */}
      {activeTab === 'audit' && (
        <AuditTrailPanel />
      )}

      {/* ===== ANALYTICS TAB ===== */}
      {activeTab === 'analytics' && (
        <AnalyticsPanel />
      )}
    </div>
  );
}

function AuditTrailPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/audit')
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading audit trail...</p>;

  return (
    <div className="glass-panel">
      <h3>Audit Trail</h3>
      <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>All admin interventions and goal lock events are logged here.</p>
      {logs.length === 0 ? (
        <p>No audit entries yet. Interventions on locked goals will appear here.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Goal</th>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={tdStyle}>{log.goal?.title || '-'}</td>
                  <td style={tdStyle}>{log.goal?.employee?.name || '-'}</td>
                  <td style={tdStyle}><code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{log.changes}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '16px' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 8px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  verticalAlign: 'middle',
};
