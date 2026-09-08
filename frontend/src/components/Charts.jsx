import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Charts({ reports, stats, hoursData }) {
  // Prepare status distribution data
  const statusData = [
    { name: 'Draft', value: stats?.draft || 0 },
    { name: 'Submitted', value: stats?.submitted || 0 },
    { name: 'Needs Correction', value: stats?.needs_correction || 0 },
    { name: 'Approved', value: stats?.approved || 0 },
  ].filter(d => d.value > 0);

  // Prepare hours by task type
  const hoursChartData = hoursData ? Object.entries(hoursData).map(([name, value]) => ({
    name,
    hours: value
  })) : [];

  return (
    <div className="row g-4">
      {/* Status Distribution - Pie Chart */}
      {statusData.length > 0 && (
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h6 className="mb-0">📊 Report Status Distribution</h6>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Hours by Task Type - Bar Chart */}
      {hoursChartData.length > 0 && (
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h6 className="mb-0">⏱️ Hours by Task Type</h6>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Charts;