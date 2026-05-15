"use client";

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart
} from 'recharts';
import { Download, Search, Filter } from 'lucide-react';

// --- Mock Data ---
const journeyStageData = [
  { name: 'Loading', Actual: 1.4, Target: 2.0 },
  { name: 'Mine→Lions', Actual: 7.0, Target: 9.0 },
  { name: 'Staging', Actual: 0.6, Target: 4.0 },
  { name: 'Lions→BC', Actual: 2.0, Target: 2.5 },
  { name: 'Offload', Actual: 1.3, Target: 1.5 },
];

const weeklyTrendData = [
  { name: 'W1', value: 13.5 },
  { name: 'W2', value: 18.0 },
  { name: 'W3', value: 12.5 },
  { name: 'W4', value: 12.0 },
  { name: 'W5', value: 12.2 },
  { name: 'W6', value: 12.4 },
  { name: 'W7', value: 16.0 },
  { name: 'W8', value: 14.5 },
  { name: 'W9', value: 18.0 },
  { name: 'W10', value: 17.5 },
  { name: 'W11', value: 16.2 },
  { name: 'W12', value: 16.8 },
];

const targetValue = 16.0;

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('Delivery Times');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      
      {/* Header Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['Delivery Times', 'Driver Analysis', 'Transporters'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Loading</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">1.4h</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Target: 2.0h</p>
          <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{width: '70%'}}></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Mine→Lions</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">7.0h</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Target: 9.0h</p>
           <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{width: '77%'}}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Staging</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">0.6h</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Target: 4.0h</p>
           <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{width: '15%'}}></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Lions→BC</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">2.0h</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Target: 2.5h</p>
           <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{width: '80%'}}></div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Offload</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">1.3h</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Target: 1.5h</p>
           <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{width: '86%'}}></div>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm shadow-blue-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10"></div>
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">14.1h</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Target: 16.0h</p>
           <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{width: '88%'}}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Journey Stage Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Journey Stage Breakdown (Actual vs Target)</h3>
          </div>
          <div className="p-4 flex-1 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={journeyStageData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dx={-10} label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94A3B8', fontSize: 12 } }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#F8FAFC'}}
                />
                <Bar dataKey="Actual" fill="#1E3A8A" radius={[2, 2, 0, 0]} barSize={30} />
                <Bar dataKey="Target" fill="#CBD5E1" radius={[2, 2, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
               <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-[#1E3A8A]"></div>
                  Actual Avg
               </div>
               <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-sm bg-[#CBD5E1]"></div>
                  Target
               </div>
            </div>
          </div>
        </div>

        {/* Weekly Avg Delivery Time Trend */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Weekly Avg Delivery Time Trend</h3>
          </div>
          <div className="p-4 flex-1 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dy={10} />
                <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#1E3A8A" strokeWidth={2} dot={{ r: 4, fill: '#1E3A8A', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                {/* Target Line */}
                <Line 
                   type="step" 
                   dataKey={() => targetValue} 
                   stroke="#EF4444" 
                   strokeDasharray="4 4" 
                   strokeWidth={1} 
                   dot={false} 
                   activeDot={false}
                   isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex justify-end pr-8 -mt-24">
                <span className="text-xs text-rose-500 font-medium bg-white px-1">Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outlier Trucks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Outlier Trucks (0 Exceeding 2x Target)</h3>
        </div>
        
        <div className="p-4 flex items-center gap-4 border-b border-slate-50 bg-slate-50/50">
           <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              <Download className="w-4 h-4" />
              Export
           </button>
           <div className="flex-1"></div>
        </div>

        <div className="overflow-x-auto flex-1 flex flex-col">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider flex items-center gap-1 cursor-pointer hover:text-blue-600">
                  Truck
                  <span className="text-[10px] text-slate-300">↑↓</span>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Order
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Status
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Loading
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Mine→Lions
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Staging
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Total
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* No data state */}
              <tr>
                 <td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No data found
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
