'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { calculateProgressScore } from '@/lib/progress';

export default function ManagerDashboard({ user }: { user: any }) {
  const router = useRouter();
  const employees = user.employees || [];
  const [loading, setLoading] = useState<string | null>(null);
  const [checkingInGoalId, setCheckingInGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ target: string; weightage: number }>({ target: '', weightage: 10 });

  const handleAction = async (goalId: string, status: string, locked: boolean, target?: string, weightage?: number) => {
    setLoading(goalId);
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, locked, ...(target && { target }), ...(weightage && { weightage }) }),
      });
      setEditingGoalId(null);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleCheckIn = async (e: React.FormEvent<HTMLFormElement>, employeeId: string) => {
    e.preventDefault();
    setLoading('checkin');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.employeeId = employeeId;
    data.managerId = user.id;

    try {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setCheckingInGoalId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const [showPushForm, setShowPushForm] = useState(false);
  const [pushResult, setPushResult] = useState<any>(null);
  const [pushing, setPushing] = useState(false);

  const handlePushDeptGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPushing(true);
    setPushResult(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.managerId = user.id;

    try {
      const res = await fetch('/api/manager/shared-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setPushResult(result);
      setShowPushForm(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex-between">
          <div>
            <h3>Team Overview</h3>
            <p>You have {employees.length} direct reports.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowPushForm(!showPushForm)}>
            {showPushForm ? 'Cancel' : '📋 Push Dept. KPI'}
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

      {/* Shared Goal Push Form */}
      {showPushForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h4>Push Departmental KPI to Your Team</h4>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>This will auto-create an APPROVED & LOCKED goal for all your direct reports.</p>
          <form onSubmit={handlePushDeptGoal}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label>Goal Title</label>
                <input type="text" name="title" required placeholder="e.g. Q3 Team Target" />
              </div>
              <div className="input-group">
                <label>Thrust Area</label>
                <input type="text" name="thrustArea" required placeholder="e.g. Revenue" />
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
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pushing}>
              {pushing ? 'Pushing...' : 'Push to Team'}
            </button>
          </form>
        </div>
      )}

      <div className="grid-2">
        {employees.map((emp: any) => (
          <div key={emp.id} className="glass-panel">
            <h4>{emp.name} ({emp.email})</h4>
            <div style={{ marginTop: '1rem' }}>
              <strong>Goals:</strong> {emp.goals?.length || 0}
              {emp.goals?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {emp.goals.map((goal: any) => (
                    <div key={goal.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <div className="flex-between">
                        <strong>{goal.title} ({goal.weightage}%)</strong>
                        <span className={`badge ${goal.status === 'APPROVED' ? 'badge-success' : goal.status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'}`}>{goal.status}</span>
                      </div>
                      {editingGoalId === goal.id ? (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <div className="input-group" style={{ marginBottom: '0' }}>
                            <label>Target</label>
                            <input 
                              type="text" 
                              value={editValues.target} 
                              onChange={(e) => setEditValues({...editValues, target: e.target.value})}
                              style={{ padding: '4px 8px' }}
                            />
                          </div>
                          <div className="input-group" style={{ marginBottom: '0' }}>
                            <label>Weightage (%)</label>
                            <input 
                              type="number" 
                              min="10" max="100"
                              value={editValues.weightage} 
                              onChange={(e) => setEditValues({...editValues, weightage: parseInt(e.target.value)})}
                              style={{ padding: '4px 8px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => handleAction(goal.id, 'APPROVED', true, editValues.target, editValues.weightage)}
                              disabled={loading === goal.id}
                            >
                              Approve & Lock with Edits
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => setEditingGoalId(null)}
                            >
                              Cancel Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                          Target: {goal.target} {goal.uom}
                        </p>
                      )}
                      
                      {goal.status === 'DRAFT' && editingGoalId !== goal.id && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleAction(goal.id, 'APPROVED', true)}
                            disabled={loading === goal.id}
                          >
                            Approve & Lock
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => {
                              setEditingGoalId(goal.id);
                              setEditValues({ target: goal.target, weightage: goal.weightage });
                            }}
                          >
                            Edit Target / Weightage
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleAction(goal.id, 'REJECTED', false)}
                            disabled={loading === goal.id}
                          >
                            Return for Rework
                          </button>
                        </div>
                      )}

                      {goal.status === 'REJECTED' && (
                        <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '8px', fontStyle: 'italic' }}>
                          ⚠ Returned for rework. Waiting for employee to re-submit.
                        </p>
                      )}

                      {/* Display Achievements if any */}
                      {goal.achievements && goal.achievements.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                          <strong style={{ fontSize: '0.8rem' }}>Quarterly Updates:</strong>
                          {goal.achievements.map((ach: any) => {
                            const score = calculateProgressScore(goal.uom, goal.trackingType, goal.target, ach.actual);
                            return (
                              <div key={ach.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', marginTop: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span>{ach.period}: {ach.actual} / {goal.target}</span>
                                  <span className={`badge ${ach.status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.6rem' }}>{ach.status}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${score}%`, height: '100%', background: score === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
                                  </div>
                                  <span style={{ fontSize: '0.7rem', minWidth: '30px' }}>{score}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Manager Check-in Button */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex-between">
                      <strong>Check-in History</strong>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => setCheckingInGoalId(checkingInGoalId === emp.id ? null : emp.id)}
                      >
                        {checkingInGoalId === emp.id ? 'Cancel' : '+ Add Check-in'}
                      </button>
                    </div>

                    {emp.checkIns && emp.checkIns.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        {emp.checkIns.map((checkin: any) => (
                          <div key={checkin.id} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '4px' }}>{checkin.period}</div>
                            <div style={{ fontSize: '0.9rem' }}>{checkin.comment}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {checkingInGoalId === emp.id && (
                      <form onSubmit={(e) => handleCheckIn(e, emp.id)} style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                        <div className="input-group" style={{ marginBottom: '10px' }}>
                          <label>Period</label>
                          <select name="period" required style={{ padding: '8px' }}>
                            <option value="Q1">Q1 Check-in</option>
                            <option value="Q2">Q2 Check-in</option>
                            <option value="Q3">Q3 Check-in</option>
                            <option value="Q4">Q4 / Annual</option>
                          </select>
                        </div>
                        <div className="input-group" style={{ marginBottom: '10px' }}>
                          <label>Manager Comment</label>
                          <textarea name="comment" rows={3} required placeholder="Discuss planned vs actual progress..." style={{ padding: '8px' }}></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px' }} disabled={loading === 'checkin'}>
                          Save Check-in
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {employees.length === 0 && (
          <p>No team members found.</p>
        )}
      </div>
    </div>
  );
}
