import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ActivityLog, Kid } from '../types';

interface StatsChartProps {
  logs: ActivityLog[];
  kids: Kid[];
}

const StatsChart: React.FC<StatsChartProps> = ({ logs, kids }) => {
  // Process logs to get last 7 days data
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const days = getLast7Days();

  const data = days.map(day => {
    const dayLogs = logs.filter(l => l.date === day);
    const entry: any = { name: day.split('-').slice(1).join('/') }; // Format MM/DD
    
    kids.forEach(kid => {
      entry[kid.name] = dayLogs.filter(l => l.kidId === kid.id).length;
    });
    
    return entry;
  });

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Tiến độ 7 ngày qua</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
            <Tooltip 
              cursor={{fill: '#f9fafb'}}
              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
            />
            <Legend wrapperStyle={{paddingTop: '20px'}} />
            {kids.map((kid) => (
              <Bar 
                key={kid.id} 
                dataKey={kid.name} 
                fill={kid.themeColor === 'pink' ? '#ec4899' : '#3b82f6'} 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;
