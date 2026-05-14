"use client";

import { useState } from "react";
import {
  Download,
  Plus,
  Package,
  Clock,
  Truck,
  CheckSquare,
  AlertCircle,
  Search,
  Calendar,
  Eye,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  FileEdit,
  FileSpreadsheet,
  Upload,
  Info
} from "lucide-react";

export default function DashboardPage() {
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const openManualModal = () => {
    setIsNewOrderModalOpen(false);
    setIsManualModalOpen(true);
  };

  const openUploadModal = () => {
    setIsNewOrderModalOpen(false);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight">Orders Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base font-medium">Manage active orders and allocations</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-medium shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-bold shadow-md hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-6 sm:mb-8 relative z-10">
        <div className="bg-gradient-to-br from-white to-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden col-span-2 lg:col-span-1 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Total Orders</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">93</p>
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-500/20 hidden sm:block">
            <Package className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-amber-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Pending</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">91</p>
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-gradient-to-br from-amber-400 to-amber-500 p-2.5 rounded-xl shadow-md shadow-amber-500/20 hidden sm:block">
            <Clock className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-indigo-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">In Transit</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">0</p>
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-500/20 hidden sm:block">
            <Truck className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-emerald-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Completed</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">2</p>
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-xl shadow-md shadow-emerald-500/20 hidden sm:block">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-rose-50/50 p-4 sm:p-5 rounded-2xl border border-rose-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-rose-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">0</p>
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-gradient-to-br from-rose-500 to-rose-600 p-2.5 rounded-xl shadow-md shadow-rose-500/20 hidden sm:block">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] text-sm">
              <option>All Statuses</option>
            </select>
            <input
              type="text"
              placeholder="Filter product..."
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm"
            />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm">
              <option>All Customers</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm border-t border-gray-50 pt-4 md:border-none md:pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-500 font-medium whitespace-nowrap hidden sm:inline">Pickup Date:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  placeholder="yyyy/mm/dd"
                  className="w-full sm:w-32 pl-3 pr-8 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <span className="text-gray-400">to</span>
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  placeholder="yyyy/mm/dd"
                  className="w-full sm:w-32 pl-3 pr-8 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
          <span className="text-gray-400 font-medium w-full sm:w-auto text-right">91 of 93 orders</span>
        </div>
      </div>

      {/* Order Item */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 p-4 sm:p-6 relative group overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4 pl-1 sm:pl-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Test02</h3>
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 rounded-md text-xs font-bold flex items-center gap-1.5 border border-indigo-100/50 shadow-sm">
                <Truck className="w-3 h-3 text-indigo-500" />
                1 truck
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <p className="text-slate-500 font-medium">
                Status: <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md ml-1">Pending</span>
              </p>
              <p className="text-slate-500 font-medium">
                Priority: <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 ml-1">Normal</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none justify-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 flex items-center gap-2 transition-all">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Details</span>
            </button>
            <button className="flex-1 lg:flex-none justify-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm rounded-xl text-sm font-bold hover:from-blue-100 hover:to-indigo-100 flex items-center gap-2 transition-all">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Manage Trucks</span>
            </button>
            <button className="flex-1 lg:flex-none justify-center px-4 py-2 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-xl text-sm font-semibold hover:bg-emerald-100 flex items-center gap-2 transition-all">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Update</span>
            </button>
            <button className="flex-none justify-center px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              <Edit2 className="w-4 h-4" />
            </button>
            <button className="flex-none justify-center px-3 py-2 border border-rose-200 text-rose-600 bg-rose-50 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-6 sm:mb-8 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 mb-2">Test02</p>
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm"></div>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 mb-2">N/A</p>
            <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 to-purple-500 rounded-full shadow-sm"></div>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origin</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 mb-2">N/A</p>
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-sm"></div>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 mb-2">N/A</p>
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-sm"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-4 sm:mb-6">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Quantity</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">0.001t</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Pickup Date</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">N/A</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Delivery Date</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">N/A</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Created</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">2026/05/11</p>
          </div>
        </div>

        <div className="pt-4 sm:pt-5 border-t border-gray-100 flex justify-between items-center mt-2">
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            0/1 trucks departed Bulk Connections
          </p>
          <p className="text-xs sm:text-sm font-bold text-indigo-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 shadow-sm px-3 py-1 rounded-full">0%</p>
        </div>
      </div>

      {/* --- Modals --- */}

      {/* 1. Create New Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setIsNewOrderModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Order</h2>

            <div className="space-y-4">
              <button
                onClick={openManualModal}
                className="w-full flex items-start gap-3 sm:gap-4 p-4 border border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="bg-blue-600 text-white p-2.5 rounded-lg shrink-0">
                  <FileEdit className="w-5 sm:w-6 h-5 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 text-base sm:text-lg">Manual Entry</h3>
                  <p className="text-blue-600/80 text-xs sm:text-sm mt-0.5">Fill in order and truck details manually</p>
                </div>
              </button>

              <button
                onClick={openUploadModal}
                className="w-full flex items-start gap-3 sm:gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="bg-[#334155] text-white p-2.5 rounded-lg shrink-0">
                  <FileSpreadsheet className="w-5 sm:w-6 h-5 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Upload Excel</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Import order data from an Excel or PDF file</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Create Order Manually Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-md border-b border-white/20 p-4 sm:p-5 flex justify-between items-center shrink-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl text-white shadow-inner border border-white/10">
                  <FileEdit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Create Order Manually</h2>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">Quickly set up a new order and routing</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-5 flex-1 overflow-y-auto">
              <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-white/50 shadow-sm">

                {/* Group 1: Order Details & Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 mb-6">
                  <div className="md:col-span-4 flex items-center gap-3 pb-3 mb-2 border-b border-gray-100/50">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-50 p-1.5 rounded-lg shadow-sm border border-blue-100/50">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Order Details & Logistics
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Order Number <span className="text-gray-400 font-normal ml-0.5">(Auto if blank)</span></label>
                    <input type="text" placeholder="e.g. ORD-001" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. Coal, Iron Ore" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Customer / Client</label>
                    <select className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors">
                      <option value="">— Select client —</option>
                      <option value="client1">Client A</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity</label>
                      <input type="number" placeholder="0" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unit</label>
                      <select className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors">
                        <option value="tons">Tons</option>
                        <option value="kg">Kg</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                    <select className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors">
                      <option>Pending</option>
                      <option>In Transit</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
                    <select className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pickup Date</label>
                    <input type="date" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Date</label>
                    <input type="date" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors" />
                  </div>
                </div>

                {/* Group 2: Locations & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">
                  <div className="md:col-span-4 flex items-center gap-3 pb-3 mb-2 border-b border-gray-100/50">
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-50 p-1.5 rounded-lg shadow-sm border border-indigo-100/50">
                      <Truck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Routing & Instructions
                    </h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Origin Address</label>
                    <input type="text" placeholder="Mine site / pickup location" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Destination Site</label>
                    <select className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-700 transition-colors">
                      <option>Lions Park</option>
                      <option>Bulk Connections</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Destination Address</label>
                    <input type="text" placeholder="Port / delivery location" className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors" />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes / Instructions</label>
                    <input type="text" placeholder="Any special requirements or instructions for this order..." className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors" />
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-md border-t border-white/40 p-4 sm:p-5 flex justify-end gap-3 shrink-0 z-10">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 border border-gray-300 rounded-xl text-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Upload Excel Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-white/20 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-md shrink-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl text-white shadow-inner border border-white/10">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Upload Order File</h2>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium mt-0.5">Import orders via Excel or PDF</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
              <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-white/50 shadow-sm">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Order File <span className="text-red-500">*</span>
                  </label>

                  {/* Exciting Drag and Drop Zone */}
                  <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-indigo-50/50 to-blue-50/50 flex flex-col items-center justify-center text-center hover:from-indigo-100/50 hover:to-blue-100/50 hover:border-indigo-400 transition-all cursor-pointer group shadow-sm">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 sm:p-4 rounded-2xl shadow-md mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-indigo-950 mb-1 group-hover:text-indigo-700 transition-colors">Click to upload or drag and drop</h3>
                    <p className="text-xs sm:text-sm text-indigo-600/80 mb-4 font-medium">Excel (.xlsx, .csv) or PDF (auto-extracted)</p>
                    <button className="px-5 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 shadow-sm hover:shadow hover:bg-indigo-50 transition-all">
                      Browse Files
                    </button>
                  </div>

                  <div className="flex items-start gap-2 mt-4 text-xs sm:text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                    <p>PDF files are automatically processed using our AI engine to extract order details, products, and routing information.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Destination Routing</label>
                  <select className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-colors text-gray-700">
                    <option>Route via Lions Park</option>
                    <option>Direct to Bulk Connections</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-md border-t border-white/40 p-4 sm:p-5 flex justify-end gap-3 shrink-0 z-10">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 border border-gray-300 rounded-xl text-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
