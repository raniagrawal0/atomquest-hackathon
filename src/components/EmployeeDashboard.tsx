'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateProgressScore } from '@/lib/progress';

export default function EmployeeDashboard({ user }: { user: any }) {
  const router = useRouter();
  const totalWeightage = user.goals.reduce((acc: number, goal: any) => acc + goal.weightage, 0);
  
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [editingRejectedId, setEditingRejectedId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ target: string; weightage: number }>({ target: '', weightage: 10 });
  const [loading, setLoading] = useState(false);

  const handleAchievementUpdate = async (e: React.FormEvent<HTMLFormElement>, goalId: string) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.goalId = goalId;

    try {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setUpdatingGoalId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (goalId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'DRAFT', 
          locked: false,
          ...(editingRejectedId === goalId && { target: editValues.target, weightage: editValues.weightage })
        }),
      });
      setEditingRejectedId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Schedule Enforcer Logic
  const currentMonth = new Date().getMonth(); // 0-11
  const isQ1Open = currentMonth >= 6 || currentMonth < 3;
  const isQ2Open = currentMonth >= 9 || currentMonth < 3;
  const isQ3Open = currentMonth >= 0; 
  const isQ4Open = currentMonth >= 3;

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className="flex-between">
          <h3>Your Goals</h3>
          {user.goals.length < 8 && totalWeightage < 100 && (
            <Link href={`/goals/new?employeeId=${user.id}`} className="btn btn-primary">
              + Create Goal
            </Link>
          )}
        </div>
        <p style={{ marginTop: '0.5rem' }}>Total Weightage: <strong>{totalWeightage}%</strong> / 100%</p>
        
        {totalWeightage < 100 && (
          <p className="badge badge-warning" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
            Warning: Total weightage must equal exactly 100% before submission.
          </p>
        )}
      </div>

      <div className="grid-2">
        {user.goals.map((goal: any) => (
          <div key={goal.id} className="glass-panel">
            <div className="flex-between">
              <h4>{goal.title}</h4>
              <span className={`badge ${goal.status === 'APPROVED' ? 'badge-success' : goal.status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'}`}>
                {goal.status}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{goal.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div><strong>Thrust Area:</strong> {goal.thrustArea}</div>
              <div><strong>Weightage:</strong> {goal.weightage}%</div>
              <div><strong>Target ({goal.uom}):</strong> {goal.target}</div>
            </div>

            {/* Rejected Goal — Edit & Resubmit */}
            {goal.status === 'REJECTED' && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,100,100,0.3)' }}>
                <p style={{ fontSize: '0.85rem', color: '#ff6b6b', marginBottom: '1rem' }}>
                  ⚠ This goal was returned for rework by your manager. Edit and resubmit.
                </p>
                {editingRejectedId === goal.id ? (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Target</label>
                      <input 
                        type="text" 
                        value={editValues.target}
                        onChange={(e) => setEditValues({...editValues, target: e.target.value})}
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Weightage (%)</label>
                      <input 
                        type="number" min="10" max="100"
                        value={editValues.weightage}
                        onChange={(e) => setEditValues({...editValues, weightage: parseInt(e.target.value)})}
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => handleResubmit(goal.id)} disabled={loading}>
                        {loading ? 'Submitting...' : 'Resubmit for Approval'}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setEditingRejectedId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" style={{ padding: '8px', flex: 1 }} onClick={() => {
                      setEditingRejectedId(goal.id);
                      setEditValues({ target: goal.target, weightage: goal.weightage });
                    }}>
                      Edit & Resubmit
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => handleResubmit(goal.id)} disabled={loading}>
                      Resubmit As-Is
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Achievement Section */}
            {goal.status === 'APPROVED' && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <strong>Progress Updates</strong>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    onClick={() => setUpdatingGoalId(updatingGoalId === goal.id ? null : goal.id)}
                  >
                    Log Achievement
                  </button>
                </div>

                {updatingGoalId === goal.id && (
                  <form onSubmit={(e) => handleAchievementUpdate(e, goal.id)} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Period (Schedule Locked)</label>
                      <select name="period" required style={{ padding: '8px' }}>
                        <option value="Q1" disabled={!isQ1Open}>Q1 Check-in {isQ1Open ? '' : '(Opens Jul)'}</option>
                        <option value="Q2" disabled={!isQ2Open}>Q2 Check-in {isQ2Open ? '' : '(Opens Oct)'}</option>
                        <option value="Q3" disabled={!isQ3Open}>Q3 Check-in {isQ3Open ? '' : '(Opens Jan)'}</option>
                        <option value="Q4" disabled={!isQ4Open}>Q4 / Annual {isQ4Open ? '' : '(Opens Apr)'}</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Actual Achievement ({goal.uom})</label>
                      <input type="text" name="actual" required placeholder="e.g. 15000" style={{ padding: '8px' }} />
                    </div>
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Status</label>
                      <select name="status" required style={{ padding: '8px' }}>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="ON_TRACK">On Track</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px' }} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Update'}
                    </button>
                  </form>
                )}

                {goal.achievements && goal.achievements.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    {goal.achievements.map((ach: any) => {
                      const score = calculateProgressScore(goal.uom, goal.trackingType, goal.target, ach.actual);
                      return (
                        <div key={ach.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span><strong>{ach.period}:</strong> {ach.actual}</span>
                            <span className={`badge ${ach.status === 'COMPLETED' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>{ach.status}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${score}%`, height: '100%', background: score === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', minWidth: '30px' }}>{score}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {user.goals.length === 0 && (
          <p>No goals created yet.</p>
        )}
      </div>
    </div>
  );
}
