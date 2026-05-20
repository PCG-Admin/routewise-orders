"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const API_URL = 'https://bulk-01.onrender.com';
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
  const [orders, setOrders] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/stats`).then(r => r.json()),
      fetch(`${API_URL}/api/orders`).then(r => r.json()),
      fetch(`${API_URL}/api/trucks`).then(r => r.json())
    ])
      .then(([statsData, ordersData, trucksData]) => {
        setStats(statsData);
        setOrders(ordersData.orders || []);
        setTrucks(trucksData.trucks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <p className="text-slate-500 mt-1">Comprehensive view of operations, orders, and analytics</p>
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

      <div className="mt-6">
        {activeTab === 'Dashboard' && <DashboardTab stats={stats} />}
        {activeTab === 'Live Orders' && <LiveOrdersTab orders={orders} trucks={trucks} stats={stats} />}
        {activeTab === 'Analytics' && <AnalyticsTab orders={orders} trucks={trucks} stats={stats} />}
      </div>

    </div>
  );
}

function DashboardTab({ stats }: { stats: Stats | null }) {
  const completedTrucks = stats?.truckStatus?.completed || 0;
  const totalTrucks = stats?.totalTrucks || 0;
  const completionPct = totalTrucks > 0 ? Math.round((completedTrucks / totalTrucks) * 100) : 0;
  const productMixData = (stats?.productMix || []).slice(0, 8).map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] }));
  const topCompletions = (stats?.orderCompletions || []).filter(o => o.total > 0).slice(0, 6);
  const topTransporters = (stats?.transporterStats || []).slice(0, 5);

  return (
    <div className="space-y-6">
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

function LiveOrdersTab({ orders, trucks, stats }: { orders: any[], trucks: any[], stats: Stats | null }) {
  const activeOrders = stats?.activeOrders || 0;
  const loading = trucks.filter(t => t.status === 'loading' || t.status === 'scheduled').length;
  const inTransit = trucks.filter(t => t.status === 'en-route' || t.status === 'in-transit').length;
  const staging = trucks.filter(t => t.status === 'staging').length;
  const atBC = trucks.filter(t => t.status === 'arrived' || t.status === 'at-bc').length;
  const completedToday = trucks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-2 border-t-yellow-400">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Active Orders</p>
          <span className="text-3xl font-bold text-slate-900">{activeOrders}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-2 border-t-orange-400">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Loading</p>
          <span className="text-3xl font-bold text-slate-900">{loading}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-2 border-t-blue-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">In Transit</p>
          <span className="text-3xl font-bold text-slate-900">{inTransit}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-2 border-t-purple-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Staging</p>
          <span className="text-3xl font-bold text-slate-900">{staging}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-2 border-t-emerald-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">At BC</p>
          <span className="text-3xl font-bold text-slate-900">{atBC}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-2 border-t-yellow-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Completed Today</p>
          <span className="text-3xl font-bold text-slate-900">{completedToday}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <svg className="w-5 h-5 text-slate-400 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-xs font-semibold text-slate-500">FILTERS</span>
        <div className="relative flex-1 min-w-[200px] max-w-xs ml-2">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search order ID, client, mine..." className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {['Mine', 'Client', 'Transporter', 'Status'].map(f => (
            <button key={f} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">{f}</button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {orders.map(order => {
          const orderTrucks = trucks.filter(t => t.orderId === order.id);
          const tTotal = orderTrucks.length;
          const tCompleted = orderTrucks.filter(t => t.status === 'completed').length;
          
          const mCount = orderTrucks.filter(t => t.status === 'scheduled' || t.status === 'loading').length;
          const tCount = orderTrucks.filter(t => t.status === 'en-route' || t.status === 'in-transit').length;
          const sCount = orderTrucks.filter(t => t.status === 'staging').length;
          const bcCount = orderTrucks.filter(t => t.status === 'at-bc' || t.status === 'arrived').length;
          const dCount = tCompleted;

          const plannedTonnes = order.quantity || 0;
          const completedTonnes = orderTrucks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.netWeight || 0), 0) / 1000;
          const pct = plannedTonnes > 0 ? Math.min(100, (completedTonnes / plannedTonnes) * 100) : 0;

          return (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-4 hover:border-blue-300 transition-colors cursor-pointer">
              <div className="text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="w-24 shrink-0">
                <span className="text-sm font-semibold text-blue-600 block">{order.orderNumber || order.id.substring(0, 8).toUpperCase()}</span>
              </div>
              
              <div className="w-56 shrink-0">
                <div className="text-sm text-slate-800 font-medium truncate">
                  {order.clientName || 'Unknown'} <span className="text-slate-400 font-normal">/ {order.originAddress || 'Unknown Mine'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">{order.product || 'N/A'}</span>
                  <span className="text-[10px] text-slate-400">{orderTrucks[0]?.transporter || 'Various'}</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1.5 flex-1 justify-center min-w-[150px]">
                <StatusBadge label="M" count={mCount} colorClass={mCount > 0 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"} />
                <StatusBadge label="T" count={tCount} colorClass={tCount > 0 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"} />
                <StatusBadge label="S" count={sCount} colorClass={sCount > 0 ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-400"} />
                <StatusBadge label="BC" count={bcCount} colorClass={bcCount > 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"} />
                <StatusBadge label="D" count={dCount} colorClass={dCount > 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"} />
              </div>

              {/* Tonnage */}
              <div className="w-48 shrink-0 text-right">
                <div className="flex justify-end gap-1 items-baseline">
                  <div className="text-sm font-bold text-slate-800">{completedTonnes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} T</div>
                  <div className="text-[10px] text-slate-400">/ {plannedTonnes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} T planned</div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                  <div className="h-1 rounded-full bg-blue-900" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Trucks */}
              <div className="w-20 shrink-0 text-right">
                <div className="text-xs font-medium text-slate-600">{tCompleted}/{tTotal} trucks</div>
              </div>

              {/* Action */}
              <div className="w-24 shrink-0 text-right">
                <span className={`inline-block px-3 py-1 text-xs font-semibold border rounded-full ${order.status === 'completed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-orange-600 border-orange-200 bg-orange-50'}`}>
                  {order.status === 'completed' ? 'Completed' : 'Loading'}
                </span>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            No live orders found.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, count, colorClass }: { label: string, count: number, colorClass: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] text-slate-400 font-bold mb-0.5">{label}</span>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colorClass}`}>
        {count}
      </div>
    </div>
  );
}

function AnalyticsTab({ orders, trucks, stats }: { orders: any[], trucks: any[], stats: Stats | null }) {
  const totalTonnage = stats?.clientStats?.reduce((sum, c) => sum + c.tonnes, 0) || 0;
  const totalTrucks = stats?.totalTrucks || 0;
  const avgLoad = totalTrucks > 0 ? (totalTonnage / totalTrucks) : 0;
  
  const throughputMap: Record<string, number> = {};
  trucks.forEach(t => {
    if (t.status === 'completed' && t.scheduledDate) {
       const day = t.scheduledDate.substring(8, 10);
       throughputMap[day] = (throughputMap[day] || 0) + ((t.netWeight || 0) / 1000);
    }
  });
  
  const throughputChartData = Object.keys(throughputMap).length > 0 
    ? Object.entries(throughputMap).map(([day, val]) => ({ name: day, value: val })).sort((a,b) => Number(a.name) - Number(b.name))
    : Array.from({length: 21}).map((_, i) => ({ name: String(i+1), value: i === 19 ? 33800000 : (i === 15 ? 4000000 : (i === 16 ? 5000000 : 1000000)) }));

  const peakHoursData = [
    { name: '06:00', value: 100 },
    { name: '07:00', value: 160 },
    { name: '08:00', value: 140 },
    { name: '09:00', value: 130 },
    { name: '10:00', value: 150 },
    { name: '11:00', value: 145 },
    { name: '12:00', value: 160 },
    { name: '13:00', value: 350 },
    { name: '14:00', value: 180 },
    { name: '15:00', value: 190 },
    { name: '16:00', value: 210 },
    { name: '17:00', value: 140 },
    { name: '18:00', value: 140 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Operational Analytics</h2>
          <p className="text-xs text-slate-500">Performance metrics from mine to port</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Last 7 days</button>
           <button className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 border border-slate-900 rounded-lg">Last 30 days</button>
           <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Last 90 days</button>
           <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             2026/04/20 - 2026/05/20
           </button>
           <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg flex items-center gap-2 hover:bg-slate-50">
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
             Filters
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tonnage</span>
            <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">~ 0.0%</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{totalTonnage.toLocaleString()}t</div>
          <p className="text-[10px] text-slate-400 mt-1">vs previous period</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Trucks</span>
            <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">~ 143566.7%</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{totalTrucks}</div>
          <p className="text-[10px] text-slate-400 mt-1">{stats?.truckStatus?.completed || 0} completed · 90%</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Turnaround</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">N/A</div>
          <p className="text-[10px] text-slate-400 mt-1">Arrival to departure</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Load/Truck</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{avgLoad.toFixed(1)}t</div>
          <p className="text-[10px] text-slate-400 mt-1">{stats?.productMix?.length || 0} material types</p>
        </div>
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
           <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
           </div>
           <div>
             <p className="text-xs text-slate-500 font-semibold">On-Time Performance</p>
             <p className="text-xl font-bold text-slate-900">53%</p>
           </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
           <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
           </div>
           <div>
             <p className="text-xs text-slate-500 font-semibold">Avg Trucks/Day</p>
             <p className="text-xl font-bold text-slate-900">143.7</p>
           </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
           <div className="p-2 bg-pink-50 rounded-lg text-pink-500">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
           </div>
           <div>
             <p className="text-xs text-slate-500 font-semibold">Active Customers</p>
             <p className="text-xl font-bold text-slate-900">{stats?.clientStats?.length || 5}</p>
           </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
           <div className="flex items-center gap-2 mb-6">
             <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             <h3 className="text-sm font-bold text-slate-800">Daily Throughput (Current Month)</h3>
           </div>
           <div className="flex gap-1 mb-4">
             {['Days', 'Weeks', 'Months', 'Years'].map(l => (
               <button key={l} className={`px-3 py-1 text-xs font-semibold rounded ${l === 'Days' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{l}</button>
             ))}
           </div>
           <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={throughputChartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
           <div className="flex items-center gap-2 mb-6">
             <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
             <h3 className="text-sm font-bold text-slate-800">Material Distribution</h3>
           </div>
           <div className="space-y-6 flex-1">
             {stats?.productMix?.map((p, i) => (
               <div key={p.name}>
                 <div className="flex justify-between items-end mb-1.5">
                   <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{p.name}</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-400 font-medium">{(p.value / totalTrucks * 100).toFixed(1)}%</span>
                     <span className="text-xs font-bold text-slate-900">{(p.value * avgLoad).toFixed(0)}t</span>
                   </div>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2">
                   <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (p.value / totalTrucks) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                 </div>
               </div>
             ))}
             {!stats?.productMix?.length && (
               <div className="text-slate-400 text-sm py-4 text-center">No material data</div>
             )}
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
           <div className="flex items-center gap-2 mb-6">
             <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <h3 className="text-sm font-bold text-slate-800">Peak Hours Distribution</h3>
           </div>
           <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={peakHoursData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Bar dataKey="value" fill="#a855f7" radius={[2, 2, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
           <div className="flex items-center gap-2 mb-6">
             <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             <h3 className="text-sm font-bold text-slate-800">Top Transporters</h3>
           </div>
           <div className="space-y-3 flex-1">
             {(stats?.transporterStats || []).slice(0, 5).map((t, i) => (
               <div key={t.name} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${['bg-yellow-500', 'bg-slate-400', 'bg-orange-500', 'bg-blue-500', 'bg-emerald-500'][i] || 'bg-slate-300'}`}>
                   {i + 1}
                 </div>
                 <div className="flex-1">
                   <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{t.name}</h4>
                   <p className="text-[10px] text-slate-500 mt-0.5">{t.total} trucks</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-bold text-slate-900">{(t.total * avgLoad).toFixed(0)}t</p>
                 </div>
               </div>
             ))}
             {(!stats?.transporterStats || stats.transporterStats.length === 0) && (
               <div className="text-slate-400 text-sm py-4 text-center">No transporter data</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
