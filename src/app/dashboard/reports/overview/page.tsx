"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Search, ChevronRight, ChevronDown, Download, SlidersHorizontal } from 'lucide-react';

const API_URL = 'https://bulk-01.onrender.com';
const COLORS = ['#1E3A8A', '#0EA5E9', '#64748B', '#A855F7', '#22C55E', '#F59E0B', '#EF4444', '#10B981'];

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  product: string;
  quantity: number;
  unit: string;
  status: string;
  originAddress: string;
  destinationAddress: string;
  requestedPickupDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Truck {
  id: string;
  orderId: string;
  vehicleReg: string;
  driverName?: string;
  transporter?: string;
  status: string;
  scheduledDate?: string;
  ticketNo?: string;
  netWeight?: number;
  grossWeight?: number;
  tareWeight?: number;
  fleetNo?: string;
  trailer1?: string;
  trailer2?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending:    { label: 'Pending',    bg: 'bg-slate-100',   text: 'text-slate-600'   },
  loading:    { label: 'Loading',    bg: 'bg-amber-100',   text: 'text-amber-700'   },
  in_transit: { label: 'In Transit', bg: 'bg-blue-100',    text: 'text-blue-700'    },
  staging:    { label: 'Staging',    bg: 'bg-purple-100',  text: 'text-purple-700'  },
  at_bc:      { label: 'At BC',      bg: 'bg-slate-200',   text: 'text-slate-700'   },
  completed:  { label: 'Completed',  bg: 'bg-emerald-100', text: 'text-emerald-700' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-100',     text: 'text-red-600'     },
};

const TRUCK_STAGES = [
  { key: 'M',  label: 'M',  statuses: ['scheduled', 'loading', 'at_mine'], color: '#F59E0B' },
  { key: 'T',  label: 'T',  statuses: ['in_transit'],                       color: '#3B82F6' },
  { key: 'S',  label: 'S',  statuses: ['staging'],                          color: '#8B5CF6' },
  { key: 'BC', label: 'BC', statuses: ['at_bc'],                            color: '#6B7280' },
  { key: 'D',  label: 'D',  statuses: ['completed', 'delivered'],           color: '#10B981' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTonnes(kg: number): string {
  const t = kg / 1000;
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(2)}Mt`;
  if (t >= 1_000)     return `${(t / 1_000).toFixed(1)}kt`;
  return `${t.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}t`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-ZA');
}

function getTruckStages(orderTrucks: Truck[]) {
  return TRUCK_STAGES.map(stage => ({
    ...stage,
    count: orderTrucks.filter(t => stage.statuses.includes(t.status)).length,
  }));
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [trucks,  setTrucks]  = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  // live-orders state
  const [search,        setSearch]        = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // analytics state
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/stats`).then(r => r.json()),
      fetch(`${API_URL}/api/orders`).then(r => r.json()),
      fetch(`${API_URL}/api/trucks`).then(r => r.json()),
    ])
      .then(([s, o, t]) => {
        setStats(s);
        setOrders(o.orders || []);
        setTrucks(t.trucks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Dashboard derived ──
  const completedTrucks  = stats?.truckStatus?.completed || 0;
  const totalTrucks      = stats?.totalTrucks || 0;
  const completionPct    = totalTrucks > 0 ? Math.round((completedTrucks / totalTrucks) * 100) : 0;
  const productMixData   = (stats?.productMix || []).slice(0, 8).map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] }));
  const topCompletions   = (stats?.orderCompletions || []).filter(o => o.total > 0).slice(0, 6);
  const topTransporters  = (stats?.transporterStats || []).slice(0, 5);

  // ── Live Orders derived ──
  const trucksByOrder = useMemo(() => {
    const map: Record<string, Truck[]> = {};
    trucks.forEach(t => {
      if (!map[t.orderId]) map[t.orderId] = [];
      map[t.orderId].push(t);
    });
    return map;
  }, [trucks]);

  const today = new Date().toISOString().slice(0, 10);

  const statusCounts = useMemo(() => ({
    active:         orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
    loading:        orders.filter(o => o.status === 'loading').length,
    in_transit:     orders.filter(o => o.status === 'in_transit').length,
    staging:        orders.filter(o => o.status === 'staging').length,
    at_bc:          orders.filter(o => o.status === 'at_bc').length,
    completedToday: orders.filter(o => o.status === 'completed' && o.updatedAt?.slice(0, 10) === today).length,
  }), [orders, today]);

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o =>
      !q ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.clientName?.toLowerCase().includes(q) ||
      o.product?.toLowerCase().includes(q) ||
      o.originAddress?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  // ── Analytics derived ──
  const analytics = useMemo(() => {
    const days   = parseInt(dateRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    const rangedOrders = orders.filter(o => new Date(o.createdAt) >= cutoff);
    const rangedTrucks = trucks.filter(t =>
      t.scheduledDate ? new Date(t.scheduledDate) >= cutoff : true
    );

    const totalKg        = rangedTrucks.reduce((s, t) => s + (t.netWeight || 0), 0);
    const trucksWithWt   = rangedTrucks.filter(t => (t.netWeight || 0) > 0);
    const avgLoadKg      = trucksWithWt.length > 0 ? totalKg / trucksWithWt.length : 0;

    // daily throughput grouped by scheduledDate
    const dailyMap: Record<string, number> = {};
    rangedTrucks.forEach(t => {
      if (t.scheduledDate && (t.netWeight || 0) > 0) {
        const d = t.scheduledDate.slice(0, 10);
        dailyMap[d] = (dailyMap[d] || 0) + (t.netWeight! / 1000);
      }
    });
    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tonnes]) => ({ date: date.slice(5).replace('-', '/'), tonnes: Math.round(tonnes) }));

    const avgTrucksDay = dailyData.length > 0 ? Math.round(rangedTrucks.length / dailyData.length) : 0;

    // material distribution: join trucks → order product → sum netWeight
    const orderProductMap: Record<string, string> = {};
    rangedOrders.forEach(o => { orderProductMap[o.id] = o.product || 'Unknown'; });

    const productTonnesMap: Record<string, number> = {};
    rangedTrucks.forEach(t => {
      const prod = orderProductMap[t.orderId] || 'Unknown';
      productTonnesMap[prod] = (productTonnesMap[prod] || 0) + ((t.netWeight || 0) / 1000);
    });
    const totalProductTonnes = Object.values(productTonnesMap).reduce((s, v) => s + v, 0);
    const materialData = Object.entries(productTonnesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, tonnes], i) => ({
        name,
        tonnes: Math.round(tonnes),
        pct:    totalProductTonnes > 0 ? (tonnes / totalProductTonnes) * 100 : 0,
        color:  COLORS[i % COLORS.length],
      }));

    // transporter tonnage
    const transMap: Record<string, { tonnes: number; trucks: number }> = {};
    rangedTrucks.forEach(t => {
      if (t.transporter) {
        if (!transMap[t.transporter]) transMap[t.transporter] = { tonnes: 0, trucks: 0 };
        transMap[t.transporter].tonnes += (t.netWeight || 0) / 1000;
        transMap[t.transporter].trucks += 1;
      }
    });
    const topTransByTonnage = Object.entries(transMap)
      .sort(([, a], [, b]) => b.tonnes - a.tonnes)
      .slice(0, 5)
      .map(([name, v], i) => ({ name, tonnes: Math.round(v.tonnes), trucks: v.trucks, rank: i + 1 }));

    const activeCustomers = new Set(rangedOrders.map(o => o.clientName).filter(Boolean)).size;

    return { totalKg, avgLoadKg, dailyData, avgTrucksDay, materialData, topTransByTonnage, activeCustomers, truckCount: rangedTrucks.length };
  }, [orders, trucks, dateRange]);

  // ─────────────────────────────────────────────────────────────────────────

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
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DASHBOARD TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Dashboard' && (
        <>
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
                      <Bar dataKey="total"     name="Total"     fill="#CBD5E1" radius={[2, 2, 0, 0]} barSize={20} />
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
                          {productMixData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          LIVE ORDERS TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Live Orders' && (
        <>
          {/* Status summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Active Orders',   value: statusCounts.active,         top: 'border-t-yellow-400'  },
              { label: 'Loading',         value: statusCounts.loading,        top: 'border-t-amber-500'   },
              { label: 'In Transit',      value: statusCounts.in_transit,     top: 'border-t-blue-500'    },
              { label: 'Staging',         value: statusCounts.staging,        top: 'border-t-purple-500'  },
              { label: 'At BC',           value: statusCounts.at_bc,          top: 'border-t-slate-400'   },
              { label: 'Completed Today', value: statusCounts.completedToday, top: 'border-t-emerald-500' },
            ].map(card => (
              <div key={card.label} className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-4 ${card.top}`}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-tight mb-2">{card.label}</p>
                <span className="text-2xl font-bold text-slate-900">{card.value}</span>
              </div>
            ))}
          </div>

          {/* Search / filter bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer select-none">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              FILTERS
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search order ID, client, mine..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">{filteredOrders.length} orders</span>
          </div>

          {/* Orders list */}
          <div className="space-y-2">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                {search ? 'No orders match your search.' : 'No orders found.'}
              </div>
            ) : filteredOrders.map(order => {
              const orderTrucks    = trucksByOrder[order.id] || [];
              const stages         = getTruckStages(orderTrucks);
              const completedCount = orderTrucks.filter(t => ['completed', 'delivered'].includes(t.status)).length;
              const actualTonnes   = orderTrucks.reduce((s, t) => s + (t.netWeight || 0), 0) / 1000;
              const plannedTonnes  = order.quantity || 0;
              const progressPct    = plannedTonnes > 0 ? Math.min(100, (actualTonnes / plannedTonnes) * 100) : 0;
              const badge          = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
              const isExpanded     = expandedOrder === order.id;
              const uniqueTransporters = [...new Set(orderTrucks.map(t => t.transporter).filter(Boolean))] as string[];

              return (
                <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <button className="text-slate-400 shrink-0 w-4">
                      {isExpanded
                        ? <ChevronDown  className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {/* Order number + product tag */}
                    <div className="w-32 shrink-0">
                      <span className="text-sm font-bold text-blue-600 block">{order.orderNumber}</span>
                      {order.product && (
                        <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {order.product}
                        </span>
                      )}
                    </div>

                    {/* Client / mine + transporter tags */}
                    <div className="w-48 shrink-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{order.clientName || '—'}</p>
                      {order.originAddress && (
                        <p className="text-[10px] text-slate-400 truncate">{order.originAddress}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {uniqueTransporters.slice(0, 2).map(tr => (
                          <span key={tr} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            {tr}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Truck stage indicators (M T S BC D) */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {stages.map(stage => (
                        <div key={stage.key} className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] font-bold text-slate-400 leading-none">{stage.label}</span>
                          {stage.count > 0 ? (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none"
                              style={{ backgroundColor: stage.color }}>
                              {stage.count}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tonnage + progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">
                          {actualTonnes.toLocaleString('en-ZA', { maximumFractionDigits: 2 })} T
                        </span>
                        {plannedTonnes > 0 && (
                          <span className="text-slate-400">
                            / {plannedTonnes.toLocaleString('en-ZA')} T planned
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-900 transition-all"
                          style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    {/* Truck count */}
                    <div className="text-xs text-slate-500 w-20 text-right shrink-0">
                      {completedCount}/{orderTrucks.length} trucks
                    </div>

                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Expanded truck detail rows */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50">
                      {orderTrucks.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-400">
                          No trucks allocated to this order yet.
                        </div>
                      ) : (
                        <>
                          <div className="px-4 py-2 grid grid-cols-7 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <span>Vehicle Reg</span>
                            <span>Fleet No</span>
                            <span>Driver</span>
                            <span>Transporter</span>
                            <span>Ticket No</span>
                            <span>Net Weight</span>
                            <span>Status</span>
                          </div>
                          {orderTrucks.map(truck => {
                            const tb = ORDER_STATUS_MAP[truck.status] || ORDER_STATUS_MAP.pending;
                            return (
                              <div key={truck.id}
                                className="px-4 py-2.5 grid grid-cols-7 gap-2 text-xs text-slate-700 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                <span className="font-bold text-slate-900">{truck.vehicleReg}</span>
                                <span className="text-slate-500">{truck.fleetNo || '—'}</span>
                                <span className="truncate">{truck.driverName || '—'}</span>
                                <span className="truncate">{truck.transporter || '—'}</span>
                                <span>{truck.ticketNo || '—'}</span>
                                <span className="font-medium">
                                  {truck.netWeight ? `${(truck.netWeight / 1000).toFixed(2)} T` : '—'}
                                </span>
                                <span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tb.bg} ${tb.text}`}>
                                    {tb.label}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ANALYTICS TAB
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Analytics' && (
        <>
          {/* Header: title + date filters + export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Operational Analytics</h2>
              <p className="text-sm text-slate-500">Performance metrics from mine to port</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {(['7', '30', '90'] as const).map(d => (
                  <button key={d} onClick={() => setDateRange(d)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      dateRange === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    Last {d} days
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Primary KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Tonnage',
                value: analytics.totalKg > 0 ? fmtTonnes(analytics.totalKg) : '0t',
                sub:   `${fmtNum(analytics.truckCount)} trucks dispatched`,
                top:   'border-t-blue-500',
              },
              {
                label: 'Total Trucks',
                value: fmtNum(analytics.truckCount),
                sub:   `${fmtNum(completedTrucks)} completed`,
                top:   'border-t-emerald-500',
              },
              {
                label: 'Avg Turnaround',
                value: 'N/A',
                sub:   'Arrival to departure',
                top:   'border-t-purple-500',
              },
              {
                label: 'Avg Load / Truck',
                value: analytics.avgLoadKg > 0 ? fmtTonnes(analytics.avgLoadKg) : 'N/A',
                sub:   `${analytics.materialData.length} material types`,
                top:   'border-t-amber-400',
              },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-t-4 ${kpi.top}`}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Secondary KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-blue-600 text-lg font-bold">%</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On-Time Performance</p>
                <p className="text-2xl font-bold text-blue-600">{completionPct}%</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <span className="text-emerald-600 text-lg">↑</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Trucks / Day</p>
                <p className="text-2xl font-bold text-emerald-600">{fmtNum(analytics.avgTrucksDay)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <span className="text-purple-600 text-lg">◎</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</p>
                <p className="text-2xl font-bold text-purple-600">{fmtNum(analytics.activeCustomers)}</p>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Throughput bar chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Daily Throughput (Current Period)</h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium">Tonnes by dispatch date</span>
              </div>
              <div className="p-4 flex-1 min-h-[280px]">
                {analytics.dailyData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No throughput data for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} interval="preserveStartEnd" />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10 }} dx={-8}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(v: number) => [`${v.toLocaleString('en-ZA')} t`, 'Tonnes']}
                      />
                      <Bar dataKey="tonnes" name="Tonnes" fill="#1E3A8A" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Material Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Material Distribution</h3>
              </div>
              <div className="p-5 flex-1 space-y-5">
                {analytics.materialData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm py-12">
                    No material data for this period
                  </div>
                ) : analytics.materialData.map(m => (
                  <div key={m.name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-xs font-semibold text-slate-700 truncate pr-2">{m.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">{m.pct.toFixed(1)}%</span>
                        <span className="text-xs font-bold text-slate-800">
                          {m.tonnes.toLocaleString('en-ZA')}t
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(m.pct, 0.5)}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Transporters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Top Transporters</h3>
            </div>
            {analytics.topTransByTonnage.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">No transporter data for this period</div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {analytics.topTransByTonnage.map((t, i) => {
                  const rankBg   = ['bg-amber-400', 'bg-slate-400', 'bg-amber-700', 'bg-slate-300', 'bg-slate-200'][i] || 'bg-slate-200';
                  const valueClr = ['text-amber-500', 'text-slate-500', 'text-amber-700', 'text-slate-400', 'text-slate-400'][i] || 'text-slate-400';
                  const maxTonnes = analytics.topTransByTonnage[0]?.tonnes || 1;
                  return (
                    <div key={t.name} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full ${rankBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {t.rank}
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate">{t.name}</p>
                      </div>
                      <p className={`text-xl font-bold ${valueClr}`}>{t.tonnes.toLocaleString('en-ZA')}t</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{fmtNum(t.trucks)} trucks</p>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                        <div className="h-1.5 rounded-full bg-blue-900"
                          style={{ width: `${Math.min(100, (t.tonnes / maxTonnes) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
