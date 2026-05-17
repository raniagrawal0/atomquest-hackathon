'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function NewGoalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uom, setUom] = useState('NUMERIC');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.employeeId = employeeId as string;

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      router.push('/dashboard?role=EMPLOYEE');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '600px' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Create New Goal</h2>
        <Link href="/dashboard?role=EMPLOYEE" className="btn btn-secondary">Cancel</Link>
      </div>

      <div className="glass-panel">
        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '12px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="title">Goal Title</label>
            <input type="text" id="title" name="title" required placeholder="e.g. Increase Q3 Sales" />
          </div>

          <div className="input-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} placeholder="Details about this goal..."></textarea>
          </div>

          <div className="input-group">
            <label htmlFor="thrustArea">Thrust Area</label>
            <input type="text" id="thrustArea" name="thrustArea" required placeholder="e.g. Revenue Growth" />
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="input-group">
              <label htmlFor="uom">Unit of Measurement (UoM)</label>
              <select id="uom" name="uom" required value={uom} onChange={(e) => setUom(e.target.value)}>
                <option value="NUMERIC">Numeric</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="TIMELINE">Timeline (Date)</option>
                <option value="ZERO_BASED">Zero-based</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="target">Target</label>
              {uom === 'TIMELINE' ? (
                <input type="date" id="target" name="target" required />
              ) : uom === 'PERCENTAGE' ? (
                <input type="number" id="target" name="target" required min="0" max="100" placeholder="e.g. 95" />
              ) : (
                <input type="text" id="target" name="target" required placeholder="e.g. 500000" />
              )}
            </div>
          </div>

          {(uom === 'NUMERIC' || uom === 'PERCENTAGE') && (
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="trackingType">Tracking Rule (How is progress scored?)</label>
              <select id="trackingType" name="trackingType" required>
                <option value="MIN">Higher is Better (e.g. Sales Revenue)</option>
                <option value="MAX">Lower is Better (e.g. Error Rate, Turnaround Time)</option>
              </select>
            </div>
          )}

          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="weightage">Weightage (%)</label>
            <input type="number" id="weightage" name="weightage" required min="10" max="100" placeholder="Min 10%" />
            <small style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Minimum weightage per individual goal is 10%.</small>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating...' : 'Submit Goal'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function NewGoalPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <NewGoalForm />
    </Suspense>
  );
}
