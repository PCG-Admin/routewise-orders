"use client";

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Mock Data ---
const volumeByMineData = [
  { name: 'Mogalakwena Mine', value: 1686.42, color: '#1E3A8A' },
  { name: 'Badanion Mine', value: 960.30, color: '#7E22CE' },
  { name: 'Modikwa Mine', value: 1080.80, color: '#A855F7' },
  { name: 'Sishen Mine', value: 771.60, color: '#3B82F6' },
  { name: 'Mponeng Gold Mine', value: 691.70, color: '#0EA5E9' },
  { name: 'Kolomela Mine', value: 540.40, color: '#0284C7' },
  { name: 'Leeuwpan Mine', value: 424.60, color: '#475569' },
  { name: 'Khutala Colliery', value: 270.20, color: '#64748B' },
  { name: 'Goedgevonden Mine', value: 1001.40, color: '#334155' },
  { name: 'South Deep Gold Mine', value: 193.00, color: '#22C55E' },
].sort((a, b) => b.value - a.value);

const avgOrderWeightData = [
  { name: 'Mogalakwena Mine', value: 562.14 },
  { name: 'Modikwa Mine', value: 540.40 },
  { name: 'Goedgevonden Mine', value: 501.70 },
  { name: 'Badanion Mine', value: 480.15 },
  { name: 'Thabazimbi Mine', value: 441.80 },
  { name: 'Sishen Mine', value: 385.80 },
  { name: 'Two Rivers Mine', value: 347.40 },
  { name: 'Mponeng Gold Mine', value: 345.85 },
  { name: 'Marikana Mine', value: 289.50 },
  { name: 'Kolomela Mine', value: 540.40 },
].sort((a, b) => b.value - a.value);

const mineLeagueTable = [
  { mine: 'Mogalakwena Mine', active: 2, total: 3, trucks: 4, tonnes: '1 686.42', avg: '562.14', product: 'Chrome' },
  { mine: 'Modikwa Mine', active: 2, total: 2, trucks: 2, tonnes: '1 080.80', avg: '540.40', product: 'Chrome' },
  { mine: 'Grootegeluk Mine', active: 2, total: 2, trucks: 5, tonnes: '1 001.40', avg: '501.70', product: 'Thermal Coal' },
  { mine: 'Barberton Mines', active: 1, total: 2, trucks: 1, tonnes: '960.30', avg: '480.15', product: 'Manganese Ore' },
  { mine: 'Thabazimbi Mine', active: 1, total: 2, trucks: 1, tonnes: '883.60', avg: '441.80', product: 'Iron Ore' },
  { mine: 'Sishen Mine', active: 2, total: 2, trucks: 4, tonnes: '771.60', avg: '385.80', product: 'Iron Ore' },
  { mine: 'Two Rivers Mine', active: 2, total: 2, trucks: 3, tonnes: '694.80', avg: '347.40', product: 'Chrome' },
  { mine: 'Mponeng Gold Mine', active: 1, total: 2, trucks: 1, tonnes: '691.70', avg: '345.85', product: 'Manganese Ore' },
  { mine: 'Marikana Mine', active: 2, total: 2, trucks: 2, tonnes: '579.00', avg: '289.50', product: 'Chrome' },
  { mine: 'Kolomela Mine', active: 1, total: 1, trucks: 1, tonnes: '540.40', avg: '540.40', product: 'Iron Ore' },
  { mine: 'Impala Rustenburg', active: 2, total: 2, trucks: 3, tonnes: '501.80', avg: '250.90', product: 'Chrome' },
  { mine: 'Leeuwpan Mine', active: 2, total: 2, trucks: 1, tonnes: '424.60', avg: '212.30', product: 'Thermal Coal' },
  { mine: 'Kloof Mine', active: 1, total: 1, trucks: 1, tonnes: '308.80', avg: '308.80', product: 'Manganese Ore' },
  { mine: 'Khutala Colliery', active: 1, total: 2, trucks: 2, tonnes: '270.20', avg: '135.10', product: 'Thermal Coal' },
  { mine: 'New Vaal Colliery', active: 2, total: 2, trucks: 2, tonnes: '193.00', avg: '96.50', product: 'Thermal Coal' },
];

export default function OrderReportsPage() {
  const [activeTab, setActiveTab] = useState('By Mine');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Order Reports</h1>
        <p className="text-slate-500 mt-1">Detailed analysis of orders by mine, client, and product</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <nav className="flex" aria-label="Tabs">
          {['By Mine', 'By Client', 'Truck Allocation', 'Product by Client'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-4 px-4 text-center font-medium text-sm transition-colors border-b-2
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Volume by Mine */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Volume By Mine</h3>
          </div>
          <div className="p-4 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeByMineData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {volumeByMineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Order Weight by Mine */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Avg Order Weight By Mine</h3>
          </div>
          <div className="p-4 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgOrderWeightData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* League Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Mine League Table</h3>
        </div>

        <div className="p-4 flex items-center gap-4 border-b border-slate-50 bg-slate-50/50">
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <div className="flex-1"></div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search mines..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider flex items-center gap-1 cursor-pointer hover:text-blue-600">
                  Mine
                  <span className="text-[10px] text-slate-300">↑↓</span>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Active
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Total
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Trucks
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Total Tonnes
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Avg T/Order
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                    Product
                    <span className="text-[10px] text-slate-300">↑↓</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {mineLeagueTable.map((row, i) => (
                <tr key={i} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {row.mine}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${row.active > 1 ? 'text-amber-500' : 'text-amber-600'}`}>{row.active}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {row.total}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {row.trucks}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {row.tonnes}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {row.avg}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 text-slate-600 bg-slate-50">
                      {row.product}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <div>16 rows</div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 flex items-center gap-1 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="font-medium text-slate-700">1 / 2</span>
            <button className="text-slate-600 hover:text-slate-900 flex items-center gap-1">
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
