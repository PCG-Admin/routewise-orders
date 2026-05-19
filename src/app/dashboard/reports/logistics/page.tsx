"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search } from 'lucide-react';

const API_URL = 'https://bulk-01.onrender.com';

interface TransporterStat {
  name: string;
  total: number;
  completed: number;
  score: number;
}

interface TruckRow {
  id: string;
  orderId: string;
  vehicleReg: string;
  driverName?: string;
  transporter?: string;
  status: string;
  fleetNo?: string;
  trailer1?: string;
  trailer2?: string;
  scheduledDate?: string;
  netWeight?: number;
}

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState('Transporters');
  const [transporterStats, setTransporterStats] = useState<TransporterStat[]>([]);
  const [truckStatus, setTruckStatus] = useState<Record<string, number>>({});
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/stats`).then(r => r.json()),
      fetch(`${API_URL}/api/trucks`).then(r => r.json()),
    ])
      .then(([stats, trucksData]) => {
        setTransporterStats(stats.transporterStats || []);
        setTruckStatus(stats.truckStatus || {});
        setTrucks(trucksData.trucks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalTrucks = Object.values(truckStatus).reduce((a, b) => a + b, 0);
  const statusData = Object.entries(truckStatus).map(([name, value]) => ({ name, value }));

  const filteredTrucks = trucks.filter(t =>
    !search ||
    (t.vehicleReg || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.driverName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.transporter || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':  return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      default:           return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {['Transporters', 'All Trucks', 'Status'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Trucks</p>
          <span className="text-3xl font-bold text-slate-900">{totalTrucks}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Scheduled</p>
          <span className="text-3xl font-bold text-amber-500">{truckStatus['scheduled'] || 0}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">In Transit</p>
          <span className="text-3xl font-bold text-blue-500">{truckStatus['in_transit'] || 0}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Completed</p>
          <span className="text-3xl font-bold text-emerald-500">{truckStatus['completed'] || 0}</span>
        </div>
      </div>

      {/* Status breakdown chart */}
      {activeTab === 'Status' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Truck Status Breakdown</h3>
          </div>
          <div className="p-4 h-[300px]">
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Trucks" fill="#1E3A8A" radius={[4, 4, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Transporter table */}
      {activeTab === 'Transporters' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Transporter Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Transporter</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Total Trucks</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Completed</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {transporterStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-slate-400">No transporter data yet</td>
                  </tr>
                ) : transporterStats.map((t, i) => (
                  <tr key={i} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{t.name}</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{t.total}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">{t.completed}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-28 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-900" style={{ width: `${t.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600">{t.score}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All trucks table */}
      {activeTab === 'All Trucks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              All Truck Allocations ({trucks.length})
            </h3>
          </div>

          <div className="p-4 flex items-center gap-4 border-b border-slate-50 bg-slate-50/50">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search plate, driver, transporter…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 font-semibold tracking-wider">Horse Reg</th>
                  <th className="px-4 py-4 font-semibold tracking-wider">Driver</th>
                  <th className="px-4 py-4 font-semibold tracking-wider">Transporter</th>
                  <th className="px-4 py-4 font-semibold tracking-wider">Trailer 1</th>
                  <th className="px-4 py-4 font-semibold tracking-wider">Trailer 2</th>
                  <th className="px-4 py-4 font-semibold tracking-wider">Status</th>
                  <th className="px-4 py-4 font-semibold tracking-wider">Net (t)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                      {search ? 'No trucks match your search' : 'No trucks found'}
                    </td>
                  </tr>
                ) : filteredTrucks.map(t => (
                  <tr key={t.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.vehicleReg || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.driverName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.transporter || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.trailer1 || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.trailer2 || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(t.status)}`}>
                        {t.status?.replace('_', ' ') || 'scheduled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.netWeight ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
