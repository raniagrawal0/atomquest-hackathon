'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = ({ name, percent }: any) => {
  const pct = typeof percent === 'number' ? percent : 0;
  return `${name} ${(pct * 100).toFixed(0)}%`;
};

export default function AnalyticsPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (!data) return <p>Failed to load analytics.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="grid-2">
        {/* Thrust Area Distribution */}
        <div className="glass-panel" style={{ minHeight: '300px' }}>
          <h4>Goal Distribution by Thrust Area</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.thrustAreaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={renderPieLabel}
              >
                {data.thrustAreaData.map((entry: any, index: number) => (
                  <Cell key={`cell-thrust-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#1e1e2d', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* UoM Distribution */}
        <div className="glass-panel" style={{ minHeight: '300px' }}>
          <h4>Goal Distribution by Unit of Measurement</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.uomData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#82ca9d"
                dataKey="value"
                label={renderPieLabel}
              >
                {data.uomData.map((entry: any, index: number) => (
                  <Cell key={`cell-uom-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#1e1e2d', border: '1px solid #333' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        {/* QoQ Achievement Trends */}
        <div className="glass-panel" style={{ minHeight: '300px' }}>
          <h4>Quarter-on-Quarter Achievement Trends</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.qoqData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="period" stroke="#888" />
              <YAxis stroke="#888" />
              <RechartsTooltip contentStyle={{ background: '#1e1e2d', border: '1px solid #333' }} />
              <Legend />
              <Bar dataKey="Logged" fill="#8884d8" />
              <Bar dataKey="Completed" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Manager Effectiveness */}
        <div className="glass-panel" style={{ minHeight: '300px' }}>
          <h4>Manager Effectiveness (Check-ins Completed)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.managerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#888" />
              <YAxis dataKey="name" type="category" stroke="#888" width={100} />
              <RechartsTooltip contentStyle={{ background: '#1e1e2d', border: '1px solid #333' }} />
              <Legend />
              <Bar dataKey="checkIns" fill="#ffc658" name="Check-ins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}
