"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const COLORS = ['#1E3A8A', '#7E22CE', '#A855F7', '#3B82F6', '#0EA5E9', '#0284C7', '#475569', '#64748B', '#334155', '#22C55E'];

interface ClientStat {
  name: string;
  orders: number;
  trucks: number;
  tonnes: number;
  product: string;
}

const PAGE_SIZE = 10;

export default function OrderReportsPage() {
  const [activeTab, setActiveTab] = useState('By Client');
  const [clientStats, setClientStats] = useState<ClientStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then(r => r.json())
      .then(data => setClientStats(data.clientStats || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = clientStats.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.product || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const volumeData = clientStats.slice(0, 10).map((c, i) => ({ name: c.name, value: c.tonnes, color: COLORS[i % COLORS.length] }));
  const trucksData = clientStats.slice(0, 10).map(c => ({ name: c.name, value: c.trucks }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Order Reports</h1>
        <p className="text-slate-500 mt-1">Analysis of orders by client and product — live from database</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <nav className="flex">
          {['By Client', 'By Product', 'Truck Allocation'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-4 text-center font-medium text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Volume by Client (Tonnes)</h3>
          </div>
          <div className="p-4 h-[400px]">
            {volumeData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Tonnes" radius={[0, 4, 4, 0]} barSize={16}>
                    {volumeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Trucks per Client</h3>
          </div>
          <div className="p-4 h-[400px]">
            {trucksData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trucksData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Trucks" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* League Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Client League Table</h3>
        </div>

        <div className="p-4 flex items-center gap-4 border-b border-slate-50 bg-slate-50/50">
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search clients or products..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Client / Mine</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Orders</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Trucks</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Total Tonnes</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Avg T / Order</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Product</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    {loading ? 'Loading...' : 'No data found'}
                  </td>
                </tr>
              ) : paginated.map((row, i) => (
                <tr key={i} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{row.name}</td>
                  <td className="px-6 py-4 font-bold text-amber-600">{row.orders}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{row.trucks}</td>
                  <td className="px-6 py-4 text-slate-700">{row.tonnes.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {row.orders > 0 ? (row.tonnes / row.orders).toFixed(2) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 text-slate-600 bg-slate-50">
                      {row.product || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <div>{filtered.length} clients</div>
          <div className="flex items-center gap-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="font-medium text-slate-700">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 disabled:opacity-40">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
