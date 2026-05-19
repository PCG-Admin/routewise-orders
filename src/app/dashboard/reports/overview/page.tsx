"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const API_URL = 'http://localhost:8000';
const COLORS = ['#1E3A8A', '#0EA5E9', '#64748B', '#A855F7', '#22C55E', '#F59E0B', '#EF4444', '#10B981'];

interface Stats {
  totalOrders: number;
  activeOrders: number;
  totalTrucks: number;
  truckStatus: Record<string, number>;
  productMix: { name: string; value: number }[];
  orderCompletions: { id: string; orderNumber: string; clientName: string; completed: number; total: number }[];
  transporterStats: { name: string; total: number; completed: number; score: number }[];
  clientStats: { name: string; orders: number; trucks: number; tonnes: number; product: string }[];
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completedTrucks = stats?.truckStatus?.completed || 0;
  const totalTrucks = stats?.totalTrucks || 0;
  const completionPct = totalTrucks > 0 ? Math.round((completedTrucks / totalTrucks) * 100) : 0;
  const productMixData = (stats?.productMix || []).slice(0, 8).map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] }));
  const topCompletions = (stats?.orderCompletions || []).filter(o => o.total > 0).slice(0, 6);
  const topTransporters = (stats?.transporterStats || []).slice(0, 5);

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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Overview</h1>
        <p className="text-slate-500 mt-1">Live view of operations, orders, and analytics</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {['Dashboard', 'Live Orders', 'Analytics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-yellow-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Orders</p>
          <span className="text-3xl font-bold text-slate-900">{stats?.activeOrders ?? 0}</span>
          <p className="text-xs text-slate-500 mt-1">{stats?.totalOrders ?? 0} total</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trucks Deployed</p>
          <span className="text-3xl font-bold text-slate-900">{totalTrucks}</span>
          <p className="text-xs text-slate-500 mt-1">{completedTrucks} completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Products</p>
          <span className="text-3xl font-bold text-slate-900">{productMixData.length}</span>
          <p className="text-xs text-slate-500 mt-1">unique types</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-purple-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transporters</p>
          <span className="text-3xl font-bold text-slate-900">{stats?.transporterStats?.length ?? 0}</span>
          <p className="text-xs text-slate-500 mt-1">active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 border-t-emerald-400">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completion</p>
          <span className="text-3xl font-bold text-slate-900">{completionPct}%</span>
          <p className="text-xs text-slate-500 mt-1">trucks delivered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Completions Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Order Completions (Trucks Delivered)</h3>
          </div>
          <div className="p-4 flex-1 min-h-[300px]">
            {topCompletions.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">No orders with trucks yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompletions} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" name="Total" fill="#CBD5E1" radius={[2, 2, 0, 0]} barSize={20} />
                  <Bar dataKey="completed" name="Completed" fill="#1E3A8A" radius={[2, 2, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product Mix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Product Mix</h3>
          </div>
          <div className="p-4 flex-1 min-h-[300px] flex flex-col items-center justify-center">
            {productMixData.length === 0 ? (
              <div className="text-slate-400">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={productMixData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {productMixData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
                  {productMixData.map((entry, i) => (
                    <div key={i} className="flex items-center text-[10px] text-slate-600">
                      <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transporter League */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Transporter League</h3>
          </div>
          <div className="p-4 space-y-4">
            {topTransporters.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-8">No transporter data yet</div>
            ) : topTransporters.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{t.name}</span>
                    <span className="text-xs font-bold text-emerald-600">{t.total} trucks</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-900"
                      style={{ width: `${Math.min(100, (t.total / (topTransporters[0]?.total || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Completions List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Order Progress</h3>
          </div>
          <div className="p-4 space-y-4">
            {topCompletions.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-8">No orders with trucks yet</div>
            ) : topCompletions.map(order => (
              <div key={order.id} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <span className="text-xs font-semibold text-blue-600 block truncate">{order.id}</span>
                  {order.clientName && <p className="text-[10px] text-slate-400 truncate">{order.clientName}</p>}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-900"
                      style={{ width: `${order.total > 0 ? (order.completed / order.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">{order.completed}/{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
