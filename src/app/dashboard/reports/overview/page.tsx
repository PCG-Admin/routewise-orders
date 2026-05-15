"use client";

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { AlertTriangle, Info, Truck } from 'lucide-react';

// --- Mock Data ---
const weeklyVolumeData = [
  { name: 'W1', Actual: 1366, Planned: 1300 },
  { name: 'W2', Actual: 1100, Planned: 1200 },
  { name: 'W3', Actual: 1250, Planned: 1300 },
  { name: 'W4', Actual: 1300, Planned: 1400 },
  { name: 'W5', Actual: 1450, Planned: 1350 },
  { name: 'W6', Actual: 1200, Planned: 1250 },
  { name: 'W7', Actual: 1380, Planned: 1300 },
  { name: 'W8', Actual: 1150, Planned: 1200 },
  { name: 'W9', Actual: 1300, Planned: 1250 },
  { name: 'W10', Actual: 1200, Planned: 1200 },
  { name: 'W11', Actual: 1250, Planned: 1250 },
  { name: 'W12', Actual: 1150, Planned: 1100 },
];

const productMixData = [
  { name: 'Chrome', value: 45, color: '#1E3A8A' },
  { name: 'Iron Ore', value: 25, color: '#0EA5E9' },
  { name: 'Thermal Coal', value: 15, color: '#64748B' },
  { name: 'Manganese Ore', value: 10, color: '#A855F7' },
  { name: 'Vanadium', value: 5, color: '#22C55E' },
];

const stockpileData = [
  { name: 'W B-+', value: 18000 },
  { name: 'IV A+', value: 18500 },
  { name: 'IV E-', value: 11000 },
  { name: 'IV P-', value: 8000 },
  { name: 'IV N-D-', value: 12000 },
  { name: 'IV R-', value: 7000 },
  { name: 'YO-I-', value: 4000 },
  { name: 'IV F-', value: 9000 },
];

const topAlerts = [
  { id: 1, type: 'warning', title: 'Weight Variance: Truck KZX 913 MP (-5.0%)', desc: 'Mine: 38200kg, BC: 37262kg, Variance: 1968kg (-5.0%)' },
  { id: 2, type: 'critical', title: 'CRITICAL: Truck LDD 982 MP at staging 24h+', desc: 'Truck LDD 982 MP has been at Lions staging for 24.0 hours, Order: GRTK002' },
  { id: 3, type: 'warning', title: 'Weight Variance: Truck LDD 982 MP (-3.8%)', desc: 'Mine: 38800kg, BC: 37332kg, Variance: 1468kg (-3.8%)' },
  { id: 4, type: 'warning', title: 'WARNING: Truck KZY 170 MP at staging 12h+', desc: 'Truck KZY 170 MP has been at Lions staging for 13.0 hours, Order: LLPS006' },
  { id: 5, type: 'warning', title: 'Truck KXR 286 MP at staging 6h+', desc: 'Truck KXR 286 MP has been at Lions staging for 7.5 hours, Order: SISH001' },
];

const transporterLeague = [
  { id: 1, name: 'Panons Trading', score: 95 },
  { id: 2, name: 'Carbon White', score: 94 },
  { id: 3, name: 'LCS Logistics', score: 92 },
  { id: 4, name: 'ZJG', score: 92 },
  { id: 5, name: 'Amadwala T/Port', score: 92 },
];

const orderCompletions = [
  { id: 'GRTK002', completed: 10, total: 24 },
  { id: 'SISH001', completed: 6, total: 28 },
  { id: 'KOLA004', completed: 14, total: 20 },
  { id: 'MGKW005', completed: 6, total: 18 },
  { id: 'LLPS006', completed: 4, total: 12 },
];

export default function OverviewPage() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Overview</h1>
        <p className="text-slate-500 mt-1">Comprehensive view of operations, orders, and analytics</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['Dashboard', 'Live Orders', 'Analytics'].map((tab) => (
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-yellow-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Orders</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">29</span>
          </div>
          <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
            <span className="mr-1">↑</span> 12.5%
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trucks Deployed</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">37</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            5 loading / 17 transit
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Volume This Week</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">11 092,22</span>
            <span className="text-xl font-bold text-slate-900">T</span>
          </div>
          <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
             <span className="mr-1">↑</span> 8.2%
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-rose-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Alerts</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">59</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            2 critical / 57 warning
          </p>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-emerald-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stockpile Utilisation</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">54.7%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Volume Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Weekly Volume (Actual vs Planned)</h3>
          </div>
          <div className="p-4 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyVolumeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Planned" fill="#CBD5E1" radius={[2, 2, 0, 0]} barSize={20} />
                <Bar dataKey="Actual" fill="#1E3A8A" radius={[2, 2, 0, 0]} barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Mix Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Product Mix</h3>
          </div>
          <div className="p-4 flex-1 min-h-[300px] flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={productMixData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {productMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
              {productMixData.map((entry, index) => (
                <div key={index} className="flex items-center text-[10px] text-slate-600">
                  <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Truck Pipeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
           <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Truck Pipeline</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between text-center gap-2">
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                     <span className="text-xl font-bold text-amber-500">5</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 mt-2">Mine</span>
               </div>
               <div className="text-slate-300">→</div>
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                     <span className="text-xl font-bold text-blue-500">12</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 mt-2">In Transit</span>
               </div>
               <div className="text-slate-300">→</div>
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shadow-sm">
                     <span className="text-xl font-bold text-purple-500">10</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 mt-2">Staging</span>
               </div>
               <div className="text-slate-300">→</div>
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
                     <span className="text-xl font-bold text-blue-600">6</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 mt-2">Offload</span>
               </div>
               <div className="text-slate-300">→</div>
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                     <span className="text-xl font-bold text-emerald-500">4</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 mt-2">At BC</span>
               </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-14 h-14 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shadow-sm">
                     <span className="text-2xl font-bold text-orange-500">17</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 mt-2">Empty Transit</span>
               </div>
            </div>
          </div>
        </div>

        {/* Top Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Top Alerts</h3>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All</button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
             {topAlerts.map(alert => (
               <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                     <div className={`mt-0.5 w-1.5 h-full self-stretch rounded-full ${alert.type === 'critical' ? 'bg-rose-500' : 'bg-orange-400'}`}></div>
                     <div>
                        <h4 className="text-sm font-semibold text-slate-800">{alert.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{alert.desc}</p>
                     </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    alert.type === 'critical' 
                      ? 'border-rose-200 text-rose-600 bg-rose-50' 
                      : 'border-orange-200 text-orange-600 bg-orange-50'
                  }`}>
                    {alert.type}
                  </span>
               </div>
             ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stockpile Capacity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Stockpile Capacity</h3>
          </div>
          <div className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockpileData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10, fontWeight: 600}} width={60} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#1E3A8A" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transporter League */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Transporter League</h3>
          </div>
          <div className="p-4 space-y-4">
            {transporterLeague.map((t, index) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 w-4">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{t.name}</span>
                    <span className="text-xs font-bold text-emerald-600">{t.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${index === 0 ? 'bg-rose-500' : 'bg-orange-500'}`} 
                      style={{ width: `${t.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Completions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Order Completions</h3>
          </div>
          <div className="p-4 space-y-4">
             {orderCompletions.map(order => (
                <div key={order.id} className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-blue-600 w-16">{order.id}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-900" 
                        style={{ width: `${(order.completed / order.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">{order.completed}/{order.total}</span>
                  </div>
                </div>
             ))}
          </div>
        </div>

      </div>

    </div>
  );
}
