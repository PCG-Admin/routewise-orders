"use client";

import { useState, useEffect } from "react";
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

// API Service
const API_URL = 'https://bulk-01-1-docker.onrender.com';

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  product: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  originAddress: string;
  destinationAddress: string;
  requestedPickupDate: string;
  requestedDeliveryDate: string;
  createdAt: string;
  notes?: string;
}

interface Truck {
  id: string;
  plate: string;
  vehicleReg?: string;
  status: string;
  driver: string;
  driverName?: string;
  phone: string;
  driverPhone?: string;
  transporter: string;
  scheduledDate: string;
  ticketNo: string;
  netWeight: number;
  grossWeight?: number;
  tareWeight?: number;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [productFilter, setProductFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isManageTrucksModalOpen, setIsManageTrucksModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [truckAllocations, setTruckAllocations] = useState<Truck[]>([]);
  const [searchTruck, setSearchTruck] = useState("");
  const [isAddTruckModalOpen, setIsAddTruckModalOpen] = useState(false);
  const [newTruck, setNewTruck] = useState({
    plate: "",
    driver: "",
    phone: "",
    transporter: "",
    scheduledDate: "",
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    completed: 0,
    cancelled: 0,
  });

  // Manual order form state
  const [manualOrder, setManualOrder] = useState({
    orderNumber: "",
    product: "",
    clientName: "",
    quantity: "",
    unit: "kg",
    originAddress: "",
    destinationAddress: "",
    status: "pending",
    priority: "normal",
    requestedPickupDate: "",
    requestedDeliveryDate: "",
    notes: "",
  });

  // Fetch orders on load
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("Fetching orders from:", `${API_URL}/api/orders`);
      const response = await fetch(`${API_URL}/api/orders`);
      const data = await response.json();

      console.log("=== DEBUG ===");
      console.log("Response status:", response.status);
      console.log("Data received:", data);
      console.log("Orders array:", data.orders);
      console.log("Number of orders:", data.orders?.length);

      if (data.orders) {
        setOrders(data.orders);
        calculateStats(data.orders);
      } else {
        console.log("No orders found in response");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  };

  const calculateStats = (ordersList: Order[]) => {
    setStats({
      total: ordersList.length,
      pending: ordersList.filter(o => o.status === 'pending').length,
      inTransit: ordersList.filter(o => o.status === 'in_transit').length,
      completed: ordersList.filter(o => o.status === 'completed').length,
      cancelled: ordersList.filter(o => o.status === 'cancelled').length,
    });
  };

  // Fetch truck allocations from backend
  const fetchTruckAllocations = async (orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/trucks`);
      const data = await response.json();
      setTruckAllocations(data.trucks || []);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      setTruckAllocations([]);
    }
  };

  // Open Details Modal
  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
    fetchTruckAllocations(order.id);
  };

  // Open Manage Trucks Modal
  const openManageTrucksModal = (order: Order) => {
    setSelectedOrder(order);
    setIsManageTrucksModalOpen(true);
    fetchTruckAllocations(order.id);
  };

  // Open Edit Modal
  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  // Update order
  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedOrder),
      });

      if (response.ok) {
        alert("Order updated successfully!");
        setIsEditModalOpen(false);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert("Order deleted successfully!");
          fetchOrders();
        }
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order");
      }
    }
  };

  // Update truck status
  const handleUpdateTruckStatus = async (truckId: string, status: string) => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/trucks/${truckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchTruckAllocations(selectedOrder.id);
        alert("Truck status updated!");
      }
    } catch (error) {
      console.error("Error updating truck:", error);
    }
  };

  // Delete truck
  const handleDeleteTruck = async (truckId: string) => {
    if (!selectedOrder) return;

    if (confirm("Are you sure you want to remove this truck?")) {
      try {
        const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/trucks/${truckId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchTruckAllocations(selectedOrder.id);
          alert("Truck removed successfully!");
        }
      } catch (error) {
        console.error("Error deleting truck:", error);
      }
    }
  };

  // Add truck
  const handleAddTruck = async () => {
    if (!selectedOrder) return;

    if (!newTruck.plate) {
      alert("Please enter vehicle registration");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/trucks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: newTruck.plate,
          driver: newTruck.driver,
          phone: newTruck.phone,
          transporter: newTruck.transporter,
          scheduledDate: newTruck.scheduledDate || new Date().toISOString().split('T')[0],
          status: "scheduled",
        }),
      });

      if (response.ok) {
        alert("Truck added successfully!");
        setIsAddTruckModalOpen(false);
        setNewTruck({ plate: "", driver: "", phone: "", transporter: "", scheduledDate: "" });
        fetchTruckAllocations(selectedOrder.id);
      }
    } catch (error) {
      console.error("Error adding truck:", error);
    }
  };

  const handleCreateOrder = async () => {
    if (!manualOrder.product) {
      alert("Please enter a product");
      return;
    }
    if (!manualOrder.quantity || parseFloat(manualOrder.quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      const orderData = {
        orderNumber: manualOrder.orderNumber || `ORD-${Date.now()}`,
        product: manualOrder.product,
        clientName: manualOrder.clientName || "Unknown Client",
        quantity: parseFloat(manualOrder.quantity),
        unit: manualOrder.unit,
        originAddress: manualOrder.originAddress || "Not specified",
        destinationAddress: manualOrder.destinationAddress || "Not specified",
        status: manualOrder.status,
        priority: manualOrder.priority,
        requestedPickupDate: manualOrder.requestedPickupDate || null,
        requestedDeliveryDate: manualOrder.requestedDeliveryDate || null,
        notes: manualOrder.notes,
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.message || data.order) {
        alert("Order created successfully!");
        setIsManualModalOpen(false);
        fetchOrders();
        setManualOrder({
          orderNumber: "",
          product: "",
          clientName: "",
          quantity: "",
          unit: "kg",
          originAddress: "",
          destinationAddress: "",
          status: "pending",
          priority: "normal",
          requestedPickupDate: "",
          requestedDeliveryDate: "",
          notes: "",
        });
      } else {
        alert("Error creating order: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Make sure the backend is running.");
    }
  };

  const handleExcelUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload/excel`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setUploadResult(data);
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      setUploadResult({ error: "Failed to upload file" });
    }
    setUploading(false);
  };

  const handlePDFUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload/pdf`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setUploadResult(data);
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      setUploadResult({ error: "Failed to process PDF" });
    }
    setUploading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTruckStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'checked_in': return 'bg-blue-100 text-blue-700';
      case 'arrived': return 'bg-blue-100 text-blue-700';
      case 'in_transit': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (searchTerm && !order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !order.product?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "All Statuses" && order.status !== statusFilter.toLowerCase().replace(' ', '_')) {
      return false;
    }
    if (productFilter && !order.product?.toLowerCase().includes(productFilter.toLowerCase())) {
      return false;
    }
    if (customerFilter && !order.clientName?.toLowerCase().includes(customerFilter.toLowerCase())) {
      return false;
    }
    if (startDate && order.requestedPickupDate && new Date(order.requestedPickupDate) < new Date(startDate)) {
      return false;
    }
    if (endDate && order.requestedPickupDate && new Date(order.requestedPickupDate) > new Date(endDate)) {
      return false;
    }
    return true;
  });

  // Filter trucks
  const filteredTrucks = truckAllocations.filter(truck =>
    searchTruck === "" ||
    (truck.plate || truck.vehicleReg || "").toLowerCase().includes(searchTruck.toLowerCase()) ||
    (truck.driver || truck.driverName || "").toLowerCase().includes(searchTruck.toLowerCase()) ||
    (truck.transporter || "").toLowerCase().includes(searchTruck.toLowerCase())
  );

  // Calculate truck progress for details modal
  const completedTrucks = truckAllocations.filter(t => t.status === 'completed').length;
  const totalTrucks = truckAllocations.length;
  const truckProgress = totalTrucks > 0 ? (completedTrucks / totalTrucks) * 100 : 0;

  const openManualModal = () => {
    setIsNewOrderModalOpen(false);
    setIsManualModalOpen(true);
  };

  const openUploadModal = () => {
    setIsNewOrderModalOpen(false);
    setIsUploadModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

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

      {/* Metrics Cards - Dynamic from database */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-6 sm:mb-8 relative z-10">
        <div className="bg-gradient-to-br from-white to-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <p className="text-slate-500 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Total Orders</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <p className="text-amber-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Pending</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <p className="text-indigo-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">In Transit</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.inTransit}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <p className="text-emerald-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Completed</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-rose-50/50 p-4 sm:p-5 rounded-2xl border border-rose-100/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <p className="text-rose-700/70 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">{stats.cancelled}</p>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] text-sm"
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
            <input
              type="text"
              placeholder="Filter product..."
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm"
            />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-sm"
            >
              <option value="">All Customers</option>
              {Array.from(new Set(orders.map(o => o.clientName).filter(Boolean))).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm border-t border-gray-50 pt-4 md:border-none md:pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-500 font-medium whitespace-nowrap hidden sm:inline">Pickup Date:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-36 pl-3 pr-8 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <span className="text-gray-400">to</span>
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-36 pl-3 pr-8 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Calendar className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <span className="text-gray-400 font-medium w-full sm:w-auto text-right">{filteredOrders.length} of {orders.length} orders</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 p-4 sm:p-6 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4 pl-1 sm:pl-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{order.orderNumber}</h3>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${getStatusColor(order.status)}`}>
                    {order.status?.replace('_', ' ') || 'pending'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 rounded-md text-xs font-bold flex items-center gap-1.5 border border-indigo-100/50 shadow-sm">
                    <Truck className="w-3 h-3 text-indigo-500" />
                    {truckAllocations.length} trucks
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <p className="text-slate-500 font-medium">
                    Priority: <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 ml-1">{order.priority || 'Normal'}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <button
                  onClick={() => openDetailsModal(order)}
                  className="flex-1 lg:flex-none justify-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 flex items-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Details</span>
                </button>
                <button
                  onClick={() => openManageTrucksModal(order)}
                  className="flex-1 lg:flex-none justify-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-100/50 shadow-sm rounded-xl text-sm font-bold hover:from-blue-100 hover:to-indigo-100 flex items-center gap-2 transition-all"
                >
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Manage Trucks</span>
                </button>
                <button className="flex-1 lg:flex-none justify-center px-4 py-2 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-xl text-sm font-semibold hover:bg-emerald-100 flex items-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Update</span>
                </button>
                <button
                  onClick={() => openEditModal(order)}
                  className="flex-none justify-center px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="flex-none justify-center px-3 py-2 border border-rose-200 text-rose-600 bg-rose-50 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-6 sm:mb-8 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
                <p className="text-sm sm:text-base font-bold text-slate-800">{order.product || 'N/A'}</p>
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm mt-2"></div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                <p className="text-sm sm:text-base font-bold text-slate-800">{order.clientName || 'N/A'}</p>
                <div className="h-1.5 w-full bg-gradient-to-r from-fuchsia-400 to-purple-500 rounded-full shadow-sm mt-2"></div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origin</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{order.originAddress || 'N/A'}</p>
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-sm mt-2"></div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</p>
                <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{order.destinationAddress || 'N/A'}</p>
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-sm mt-2"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-4 sm:mb-6">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Quantity</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{order.quantity || 0}{order.unit || 't'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Pickup Date</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{order.requestedPickupDate ? new Date(order.requestedPickupDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Delivery Date</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Created</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="pt-4 sm:pt-5 border-t border-gray-100 flex justify-between items-center mt-2">
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                {completedTrucks}/{totalTrucks} trucks departed
              </p>
              <p className="text-xs sm:text-sm font-bold text-indigo-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 shadow-sm px-3 py-1 rounded-full">
                {totalTrucks > 0 ? Math.round((completedTrucks / totalTrucks) * 100) : 0}%
              </p>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or create a new order</p>
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Order
            </button>
          </div>
        )}
      </div>

      {/* CREATE NEW ORDER MODAL */}
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

      {/* CREATE ORDER MANUALLY MODAL */}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 mb-6">
                  <div className="md:col-span-4 flex items-center gap-3 pb-3 mb-2 border-b border-gray-100/50">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-50 p-1.5 rounded-lg shadow-sm border border-blue-100/50">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Order Details & Logistics</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Order Number</label>
                    <input
                      type="text"
                      value={manualOrder.orderNumber}
                      onChange={(e) => setManualOrder({ ...manualOrder, orderNumber: e.target.value })}
                      placeholder="e.g. ORD-001"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={manualOrder.product}
                      onChange={(e) => setManualOrder({ ...manualOrder, product: e.target.value })}
                      placeholder="e.g. Coal, Iron Ore"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Customer / Client</label>
                    <input
                      type="text"
                      value={manualOrder.clientName}
                      onChange={(e) => setManualOrder({ ...manualOrder, clientName: e.target.value })}
                      placeholder="Client name"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={manualOrder.quantity}
                        onChange={(e) => setManualOrder({ ...manualOrder, quantity: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Unit</label>
                      <select
                        value={manualOrder.unit}
                        onChange={(e) => setManualOrder({ ...manualOrder, unit: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">kg</option>
                        <option value="tons">Tons</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                    <select
                      value={manualOrder.status}
                      onChange={(e) => setManualOrder({ ...manualOrder, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_transit">In Transit</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
                    <select
                      value={manualOrder.priority}
                      onChange={(e) => setManualOrder({ ...manualOrder, priority: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pickup Date</label>
                    <input
                      type="date"
                      value={manualOrder.requestedPickupDate}
                      onChange={(e) => setManualOrder({ ...manualOrder, requestedPickupDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Date</label>
                    <input
                      type="date"
                      value={manualOrder.requestedDeliveryDate}
                      onChange={(e) => setManualOrder({ ...manualOrder, requestedDeliveryDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4">
                  <div className="md:col-span-4 flex items-center gap-3 pb-3 mb-2 border-b border-gray-100/50">
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-50 p-1.5 rounded-lg shadow-sm border border-indigo-100/50">
                      <Truck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Routing & Instructions</h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Origin Address</label>
                    <input
                      type="text"
                      value={manualOrder.originAddress}
                      onChange={(e) => setManualOrder({ ...manualOrder, originAddress: e.target.value })}
                      placeholder="Mine site / pickup location"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Destination Address</label>
                    <input
                      type="text"
                      value={manualOrder.destinationAddress}
                      onChange={(e) => setManualOrder({ ...manualOrder, destinationAddress: e.target.value })}
                      placeholder="Port / delivery location"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes / Instructions</label>
                    <input
                      type="text"
                      value={manualOrder.notes}
                      onChange={(e) => setManualOrder({ ...manualOrder, notes: e.target.value })}
                      placeholder="Any special requirements or instructions for this order..."
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
              <button
                onClick={handleCreateOrder}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD EXCEL MODAL */}
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
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadResult(null);
                }}
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

                  <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-indigo-50/50 to-blue-50/50 flex flex-col items-center justify-center text-center hover:from-indigo-100/50 hover:to-blue-100/50 hover:border-indigo-400 transition-all cursor-pointer group shadow-sm">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 sm:p-4 rounded-2xl shadow-md mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-indigo-950 mb-1 group-hover:text-indigo-700 transition-colors">Click to upload or drag and drop</h3>
                    <p className="text-xs sm:text-sm text-indigo-600/80 mb-4 font-medium">Excel (.xlsx, .csv) or PDF (auto-extracted)</p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.name.endsWith('.pdf')) {
                            handlePDFUpload(file);
                          } else {
                            handleExcelUpload(file);
                          }
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="px-5 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 shadow-sm hover:shadow hover:bg-indigo-50 transition-all cursor-pointer"
                    >
                      Browse Files
                    </label>
                  </div>

                  <div className="flex items-start gap-2 mt-4 text-xs sm:text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                    <p>AI automatically extracts all data from PDF weighbridge reports and Excel files. Use the template below for best Excel results.</p>
                  </div>

                  <a
                    href={`${API_URL}/api/template/excel`}
                    download="truck_allocation_template.xlsx"
                    className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Excel Template
                  </a>
                </div>

                {uploadResult && (
                  <div className={`mt-4 p-4 rounded-xl border ${uploadResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    {uploadResult.success ? (
                      <div className="flex items-start gap-3">
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Import Successful</p>
                          <p className="text-sm text-emerald-700 mt-1">{uploadResult.message}</p>
                          {uploadResult.orderNumber && (
                            <p className="text-xs text-emerald-600 mt-1">Order: <span className="font-bold">{uploadResult.orderNumber}</span></p>
                          )}
                          {uploadResult.trucks_skipped > 0 && (
                            <p className="text-xs text-amber-600 mt-1">{uploadResult.trucks_skipped} rows skipped (missing vehicle registration)</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-rose-800">Import Failed</p>
                          <p className="text-xs text-rose-600 mt-1">{uploadResult.detail || uploadResult.error || 'Unknown error'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {uploading && (
                  <div className="mt-4 text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Processing...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-md border-t border-white/40 p-4 sm:p-5 flex justify-end gap-3 shrink-0 z-10">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadResult(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 border border-gray-300 rounded-xl text-sm text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL - Dynamic with real truck data */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedOrder.orderNumber}</h2>
                <p className="text-blue-100 text-sm">Created on {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-blue-800 font-semibold">{completedTrucks}/{totalTrucks} trucks departed</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${truckProgress}%` }}></div>
                </div>
              </div>

              <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                  <button className="px-1 py-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">Details</button>
                  <button className="px-1 py-2 text-sm font-semibold text-gray-500">Allocations ({totalTrucks})</button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">QUANTITY</p>
                  <p className="text-lg font-bold text-gray-900">{selectedOrder.quantity || 0}{selectedOrder.unit || 't'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">STATUS</p>
                  <p className="text-lg font-bold capitalize text-gray-900">{selectedOrder.status || 'pending'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">PRIORITY</p>
                  <p className="text-lg font-bold capitalize text-gray-900">{selectedOrder.priority || 'normal'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">PRODUCT</p>
                  <p className="text-lg font-bold text-gray-900">{selectedOrder.product || 'N/A'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Order Information</h3>
                  <div className="space-y-3">
                    <div><p className="text-xs text-gray-500">ORDER NUMBER</p><p className="text-sm font-semibold">{selectedOrder.orderNumber}</p></div>
                    <div><p className="text-xs text-gray-500">PRODUCT</p><p className="text-sm font-semibold">{selectedOrder.product || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-500">QUANTITY</p><p className="text-sm font-semibold">{selectedOrder.quantity || 0} {selectedOrder.unit || 't'}</p></div>
                    <div><p className="text-xs text-gray-500">STATUS</p><p className="text-sm font-semibold capitalize">{selectedOrder.status}</p></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Logistics</h3>
                  <div className="space-y-3">
                    <div><p className="text-xs text-gray-500">ORIGIN</p><p className="text-sm font-semibold">{selectedOrder.originAddress || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-500">DESTINATION</p><p className="text-sm font-semibold">{selectedOrder.destinationAddress || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-500">PRIORITY</p><p className="text-sm font-semibold capitalize">{selectedOrder.priority}</p></div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Timeline</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><p className="text-xs text-gray-500">CREATED</p><p className="text-sm font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</p></div>
                    <div><p className="text-xs text-gray-500">REQUESTED PICKUP DATE</p><p className="text-sm font-semibold">{selectedOrder.requestedPickupDate ? new Date(selectedOrder.requestedPickupDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-500">REQUESTED DELIVERY DATE</p><p className="text-sm font-semibold">{selectedOrder.requestedDeliveryDate ? new Date(selectedOrder.requestedDeliveryDate).toLocaleDateString() : 'N/A'}</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3 shrink-0 border-t">
              <button onClick={() => setIsDetailsModalOpen(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE TRUCKS MODAL - Dynamic with real truck data */}
      {isManageTrucksModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Manage Truck Allocations</h2>
                <p className="text-blue-100 text-sm">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setIsManageTrucksModalOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mb-6">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by plate, driver, transporter, ticket, phone..."
                  value={searchTruck}
                  onChange={(e) => setSearchTruck(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Plate</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">PHONE</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Transporter</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Scheduled</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">TICKET #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Net (t)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTrucks.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          No trucks allocated to this order yet. Click "Add Truck" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredTrucks.map((truck) => (
                        <tr key={truck.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{truck.plate || truck.vehicleReg || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getTruckStatusColor(truck.status)}`}>
                              {truck.status?.replace('_', ' ') || 'scheduled'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{truck.driver || truck.driverName || '—'}</td>
                          <td className="px-4 py-3">{truck.phone || truck.driverPhone || '—'}</td>
                          <td className="px-4 py-3">{truck.transporter || '—'}</td>
                          <td className="px-4 py-3">{truck.scheduledDate ? new Date(truck.scheduledDate).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">{truck.ticketNo || '—'}</td>
                          <td className="px-4 py-3">{truck.netWeight || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateTruckStatus(truck.id, 'completed')}
                                className="text-green-600 hover:text-green-800"
                                title="Mark Complete"
                              >
                                ✔️
                              </button>
                              <button
                                onClick={() => handleDeleteTruck(truck.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsAddTruckModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Truck
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3 shrink-0 border-t">
              <button onClick={() => setIsManageTrucksModalOpen(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100">Close</button>
              <button className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TRUCK MODAL */}
      {isAddTruckModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Add New Truck</h2>
              <button onClick={() => setIsAddTruckModalOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Registration *</label>
                <input
                  type="text"
                  value={newTruck.plate}
                  onChange={(e) => setNewTruck({ ...newTruck, plate: e.target.value })}
                  placeholder="e.g. ABC123"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={newTruck.driver}
                  onChange={(e) => setNewTruck({ ...newTruck, driver: e.target.value })}
                  placeholder="Driver name"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={newTruck.phone}
                  onChange={(e) => setNewTruck({ ...newTruck, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transporter</label>
                <input
                  type="text"
                  value={newTruck.transporter}
                  onChange={(e) => setNewTruck({ ...newTruck, transporter: e.target.value })}
                  placeholder="Transporter name"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={newTruck.scheduledDate}
                  onChange={(e) => setNewTruck({ ...newTruck, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-3 rounded-b-2xl border-t">
              <button onClick={() => setIsAddTruckModalOpen(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100">Cancel</button>
              <button onClick={handleAddTruck} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Add Truck</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Order</h2>
                <p className="text-blue-100 text-sm">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Order Number</label>
                  <input type="text" value={selectedOrder.orderNumber} onChange={(e) => setSelectedOrder({ ...selectedOrder, orderNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name</label>
                  <input type="text" value={selectedOrder.clientName || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, clientName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Product</label>
                  <input type="text" value={selectedOrder.product || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, product: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                    <input type="number" value={selectedOrder.quantity || 0} onChange={(e) => setSelectedOrder({ ...selectedOrder, quantity: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                    <select value={selectedOrder.unit || 'kg'} onChange={(e) => setSelectedOrder({ ...selectedOrder, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select value={selectedOrder.status} onChange={(e) => setSelectedOrder({ ...selectedOrder, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select value={selectedOrder.priority} onChange={(e) => setSelectedOrder({ ...selectedOrder, priority: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Origin Address</label>
                  <input type="text" value={selectedOrder.originAddress || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, originAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Destination Address</label>
                  <input type="text" value={selectedOrder.destinationAddress || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, destinationAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Pickup Date</label>
                  <input type="date" value={selectedOrder.requestedPickupDate?.split('T')[0] || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, requestedPickupDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Date</label>
                  <input type="date" value={selectedOrder.requestedDeliveryDate?.split('T')[0] || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, requestedDeliveryDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea value={selectedOrder.notes || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3 shrink-0 border-t">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100">Cancel</button>
              <button onClick={handleUpdateOrder} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}