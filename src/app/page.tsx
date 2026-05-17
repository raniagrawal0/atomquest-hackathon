'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleLogin = (role: string) => {
    // In a real app, this would be an actual auth call.
    // For the hackathon MVP, we just route to the dashboard with the role.
    router.push(`/dashboard?role=${role}`);
  };

  return (
    <main className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '10px' }}>Welcome to AtomQuest</h1>
        <p style={{ marginBottom: '30px' }}>Please select a persona to log in.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handleLogin('EMPLOYEE')}
          >
            Log in as Employee
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleLogin('MANAGER')}
          >
            Log in as Manager
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleLogin('ADMIN')}
          >
            Log in as Admin / HR
          </button>
        </div>
      </div>
    </main>
  );
}
