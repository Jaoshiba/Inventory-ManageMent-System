"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  X, 
  AlertTriangle, 
  Minus, 
  Filter, 
  Download,
  AlertCircle,
  RefreshCw
} from "lucide-react";

// ==========================================
// Interfaces (อ้างอิงตรงตาม Schema หลังบ้านของคุณ)
// ==========================================
interface Product {
  id: number;
  sku: number;         // หลังบ้านคุณใช้ชนิดข้อมูล int
  name: string;
  cost: number;
  price: number;
  stockRemain: number;
  categoryId: number;
}

interface CreateProductRequest {
  name: string;
  sku: number;
  cost: number;
  price: number;
  stockRemain: number;
  categoryId: number;
}

export default function InventoryDashboard() {
  const baseUrl = "http://localhost:3000";
  // --- States ข้อมูลสินค้า ---
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [threshold, setThreshold] = useState<number>(5); // เกณฑ์สต็อกต่ำ (Query Param: amount)
  
  // --- States สถานะ UI ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- States สำหรับการปรับสต็อก (Quick Stock Adjust) ---
  const [adjustAmount, setAdjustAmount] = useState<number>(25); 
  const [adjustmentType, setAdjustmentType] = useState<"Received" | "Returned" | "Damaged" | "Correction">("Received");
  const [adjustNote, setAdjustNote] = useState<string>("Restock incoming shipment #RS-9941. Verified count with carrier.");
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // --- States สำหรับ Modal เพิ่มสินค้าใหม่ ---
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState<CreateProductRequest>({
    name: "",
    sku: 0,
    cost: 0,
    price: 0,
    stockRemain: 0,
    categoryId: 1
  });

  // ==========================================
  // 1. [GET] /products/low-stock (เช็กสินค้าสต็อกใกล้หมด)
  // ==========================================
  const fetchLowStockProducts = async (amountVal: number) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/products/low-stock?amount=${amountVal}`);
      
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลคลังสินค้าจากเซิร์ฟเวอร์ได้");
      }
      
      const data = await response.json();
      
      console.log("=== API Response (low-stock) ===", data);
      
      if (Array.isArray(data)) {

        setProducts(data);
        if (data.length > 0) setSelectedProduct(data[0]);
      } else if (data && typeof data === "object" && Array.isArray((data as any).data)) {

        setProducts((data as any).data);
        if ((data as any).data.length > 0) setSelectedProduct((data as any).data[0]);
      } else if (data && typeof data === "object" && Array.isArray((data as any).products)) {

        setProducts((data as any).products);
        if ((data as any).products.length > 0) setSelectedProduct((data as any).products[0]);
      } else {

        console.error("API did not return an array format:", data);
        setProducts([]);
        setSelectedProduct(null);
      }
      
    } catch (error: any) {
      setErrorMessage(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลสต็อกสินค้า");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockProducts(threshold);
  }, [threshold]);


  // ==========================================
  // 2. [POST] /products (เพิ่มสินค้าใหม่)
  // ==========================================
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.sku <= 0 || !newProduct.name) {
      alert("กรุณากรอกข้อมูลสินค้าและรหัส SKU ให้ถูกต้อง");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      const data = await response.json();

      if (response.status === 201) {
        alert("บันทึกและเพิ่มสินค้าชิ้นใหม่เข้าระบบสำเร็จ!");
        setIsAddModalOpen(false);
        // เคลียร์ฟอร์ม
        setNewProduct({ name: "", sku: 0, cost: 0, price: 0, stockRemain: 0, categoryId: 1 });
        // โหลดข้อมูลสต็อกต่ำล่าสุดเพื่อปรับปรุงตาราง
        fetchLowStockProducts(5);
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถลงทะเบียนสินค้าได้"}`);
      }
    } catch (error) {
      console.error("Create product failed:", error);
      alert("ระบบเชื่อมต่อหลังบ้านขัดข้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsCreating(false);
    }
  };

  // ==========================================
  // 3. [PATCH] /stock/adjust (ปรับยอดสต็อก)
  // ==========================================
  const handleAdjustStock = async () => {
    if (!selectedProduct) {
      alert("กรุณาเลือกสินค้าที่ต้องการปรับปรุงสต็อก");
      return;
    }

    setIsAdjusting(true);
    const finalNote = `[${adjustmentType}] ${adjustNote}`.trim();
    
    const payload = {
      sku: selectedProduct.sku,
      amount: adjustAmount,
      note: finalNote || undefined
    };

    try {
      const response = await fetch(`/api/stock/adjust`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 200) {
        alert(`ปรับยอดสต็อกสินค้า SKU ${selectedProduct.sku} เรียบร้อยแล้ว!`);
        // ดึงข้อมูลจากฐานข้อมูลจริงใหม่ เพื่อให้ตัวเลขสต็อกในตารางและแผงด้านขวาสอดคล้องกับคลังจริง
        fetchLowStockProducts(5);
      } else {
        alert(`ปรับปรุงสต็อกล้มเหลว: ${data.error || "กรุณาตรวจสอบข้อมูลอีกครั้ง"}`);
      }
    } catch (error) {
      console.error("Adjust stock error:", error);
      alert("ระบบเชื่อมต่อหลังบ้านขัดข้อง กรุณาลองปรับปรุงใหม่อีกครั้ง");
    } finally {
      setIsAdjusting(false);
    }
  };

  // ==========================================
  // ฟังก์ชันสลัก Badge สำหรับแสดงผลตามค่า Min Level (เทียบกับใน Figma)
  // ==========================================
  const getStatusBadge = (stock: number) => {
    // กำหนดเกณฑ์จำลองเพื่อเปรียบเทียบใน UI
    if (stock === 0) {
      return <span className="bg-red-50 text-red-600 border border-red-200 text-xs px-2.5 py-1 rounded-full font-bold">Out of Stock</span>;
    }
    if (stock <= 5) {
      return <span className="bg-red-50 text-red-500 border border-red-100 text-xs px-2.5 py-1 rounded-full font-bold">Critical</span>;
    }
    if (stock <= 15) {
      return <span className="bg-amber-50 text-amber-600 border border-amber-100 text-xs px-2.5 py-1 rounded-full font-bold">Low Stock</span>;
    }
    return <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs px-2.5 py-1 rounded-full font-bold">Reorder</span>;
  };

  // ฟังก์ชันแปลง Category ID จากฐานข้อมูลเป็นชื่อแสดงผล
  const getCategoryName = (catId: number) => {
    switch (catId) {
      case 1: return "Electronics";
      case 2: return "Office Equipment";
      case 3: return "Furniture";
      case 4: return "Accessories";
      default: return "Office Supplies";
    }
  };

  // ระบบค้นหาแบบเรียลไทม์บน Client-side
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.sku.toString().includes(searchQuery) || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* -------------------------------------------------------------
          LEFT SIDEBAR (แถบเมนูด้านซ้าย)
          ------------------------------------------------------------- */}
      <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col justify-between p-6 shrink-0 border-r border-slate-800">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Boxes size={20} />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">StockFlow</span>
          </div>

          {/* เมนูนำทาง */}
          <nav className="space-y-1">
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800/50 hover:text-white transition">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800/50 hover:text-white transition">
              <Package size={18} />
              <span>Products</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg bg-slate-800 text-white transition">
              <Boxes size={18} />
              <span>Inventory</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800/50 hover:text-white transition">
              <ShoppingCart size={18} />
              <span>Orders</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800/50 hover:text-white transition">
              <Truck size={18} />
              <span>Suppliers</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800/50 hover:text-white transition">
              <BarChart3 size={18} />
              <span>Reports</span>
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800/50 hover:text-white transition">
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* ข้อมูลโปรไฟล์ผู้ใช้งาน */}
        <div className="flex items-center gap-3 border-t border-slate-800 pt-6">
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
            <span className="font-bold text-sm text-white">MV</span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-white">Marcus Vance</h4>
            <p className="text-xs text-slate-500">Operations Director</p>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          CENTER CONTENT AREA (ตารางและแดชบอร์ดตรงกลาง)
          ------------------------------------------------------------- */}
      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        
        {/* หัวข้อคลังสินค้า */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventory Overview</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time snapshot of stock levels and fulfillment anomalies.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm"
          >
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>

        {/* การ์ดสถิติ (KPI Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products Listed</span>
              <h3 className="text-3xl font-extrabold text-slate-900">{products.length} Items</h3>
              <p className="text-xs text-slate-500">
                <span className="text-emerald-500 font-bold">+4.3%</span> vs last month
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-slate-500 border">
              <Package size={20} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
              <h3 className="text-3xl font-extrabold text-slate-900">
                {products.filter(p => p.stockRemain <= 15).length}
              </h3>
              <p className="text-xs text-slate-500">Require immediate restock action</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-amber-500 border border-amber-100">
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Out of Stock</span>
              <h3 className="text-3xl font-extrabold text-red-600">
                {products.filter(p => p.stockRemain === 0).length}
              </h3>
              <p className="text-xs text-slate-500">Critical fulfillment shortages</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-red-500 border border-red-100">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>

        {/* ตารางข้อมูลหลัก */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Low Stock Products</h2>
              <p className="text-sm text-slate-500 mt-0.5">Items tracking below minimum safety thresholds.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* ตัวเลือกเปลี่ยนปริมาณดึงสินค้า */}
              <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500">แสดงสต็อกต่ำกว่า:</span>
                <input 
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-12 text-center text-xs font-bold bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min={1}
                />
              </div>
              <button 
                onClick={() => fetchLowStockProducts(5)}
                className="p-2 border rounded-lg hover:bg-slate-50 text-slate-500"
                title="รีเฟรชตาราง"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* แสดงสถานะ Error หากเชื่อมหลังบ้านไม่ได้ */}
          {errorMessage && (
            <div className="m-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle size={18} />
              <span>{errorMessage} (ระบบกำลังแสดงผลแบบ Fallback สแตนด์บายไว้ให้ครับ)</span>
            </div>
          )}

          {/* ตารางข้อมูล */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold tracking-wider">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Current Stock</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">กำลังเชื่อมโยงข้อมูลกับหลังบ้าน...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      ไม่พบข้อมูลสินค้าที่สต็อกต่ำกว่า {threshold} ชิ้นในระบบฐานข้อมูล
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => {
                        setSelectedProduct(p);
                        setAdjustAmount(25);
                      }}
                      className={`hover:bg-slate-50/50 transition cursor-pointer ${
                        selectedProduct?.id === p.id ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 max-w-xs truncate">{p.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">{p.sku}</td>
                      <td className="px-6 py-4 text-slate-600">{getCategoryName(p.categoryId)}</td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={p.stockRemain <= 5 ? "text-red-600" : "text-slate-800"}>
                          {p.stockRemain}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(p.stockRemain)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          RIGHT SIDEBAR (แผงควบคุมปรับปรุงสต็อกด่วน - Endpoint 3)
          ------------------------------------------------------------- */}
      <aside className="w-96 bg-white border-l border-slate-200 p-8 flex flex-col shrink-0 overflow-y-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quick Stock Adjust</h2>
          <p className="text-sm text-slate-500 mt-1">Directly update physical counts for local reconciliation.</p>
        </div>

        {/* กล่องค้นหาเพื่อนำมาปรับสต็อก */}
        <div className="space-y-2 relative">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Search Product or SKU</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            )}
          </div>

          {/* รายการผลลัพธ์ดรอปดาวน์ */}
          {searchQuery && filteredProducts.length > 0 && (
            <div className="absolute z-20 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto divide-y">
              {filteredProducts.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setSearchQuery("");
                  }}
                  className="p-3 hover:bg-slate-50 cursor-pointer text-sm"
                >
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-400">SKU: {p.sku} | ปัจจุบัน: {p.stockRemain} ชิ้น</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* แผงข้อมูลชิ้นที่เลือก */}
        {selectedProduct ? (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/50 space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-400 mt-1">
                SKU: <span className="font-semibold font-mono">{selectedProduct.sku}</span> • Category: {getCategoryName(selectedProduct.categoryId)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</span>
                <p className="text-xl font-extrabold text-red-500 mt-1">{selectedProduct.stockRemain} units</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Minimum</span>
                <p className="text-xl font-extrabold text-slate-700 mt-1">15 units</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed p-6 rounded-xl text-center text-slate-400 text-sm">
            คลิกเลือกสินค้าบนตาราง หรือใช้ช่องค้นหาด้านบน เพื่อทำการปรับสต็อก
          </div>
        )}

        {/* ควบคุมการปรับสต็อก */}
        {selectedProduct && (
          <>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity Adjustment</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAdjustAmount(prev => prev - 1)}
                  className="p-2 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
                >
                  <Minus size={18} />
                </button>
                <div className="flex-1 border-2 border-blue-600 rounded-lg py-2 text-center text-lg font-bold text-blue-600">
                  {adjustAmount >= 0 ? `+${adjustAmount}` : adjustAmount}
                </div>
                <button 
                  onClick={() => setAdjustAmount(prev => prev + 1)}
                  className="p-2 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* ปุ่มเพิ่มลดแบบด่วน */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    onClick={() => setAdjustAmount(num)}
                    className="py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            {/* ประเภทธุรกรรมคลังสินค้า */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["Received", "Returned", "Damaged", "Correction"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAdjustmentType(type)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      adjustmentType === type
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Notes / Reference</label>
              <textarea
                rows={3}
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="อธิบายเหตุผล เช่น เติมสินค้าเข้าคลัง หรือพบความเสียหาย..."
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ส่งบันทึกข้อมูล */}
            <div className="flex items-center gap-3 pt-4">
              <button 
                onClick={() => {
                  setAdjustAmount(25);
                  setAdjustNote("");
                }}
                className="flex-1 py-3 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
                disabled={isAdjusting}
              >
                Cancel
              </button>
              <button 
                onClick={handleAdjustStock}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 transition text-white font-bold rounded-lg text-sm shadow-sm flex items-center justify-center gap-2"
                disabled={isAdjusting}
              >
                {isAdjusting ? "Saving..." : "Save Adjustment"}
              </button>
            </div>
          </>
        )}
      </aside>

      {/* -------------------------------------------------------------
          MODAL: ADD NEW PRODUCT (หน้าต่างเพิ่มสินค้าใหม่ - Endpoint 1)
          ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border">
            <div className="bg-[#0B132B] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">➕ Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SKU *</label>
                <input
                  type="number"
                  required
                  placeholder="เช่น 100201"
                  value={newProduct.sku || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Logitech MX Master 3S"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cost (ต้นทุน) *</label>
                  <input
                    type="number"
                    required
                    placeholder="2500"
                    value={newProduct.cost || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (ราคาขาย) *</label>
                  <input
                    type="number"
                    required
                    placeholder="4300"
                    value={newProduct.price || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Stock (สต็อกเริ่มต้น)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProduct.stockRemain || ""}
                    onChange={(e) => setNewProduct({ ...newProduct, stockRemain: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category ID *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border rounded-lg text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 transition text-white font-bold rounded-lg text-sm shadow-sm flex items-center justify-center gap-2"
                  disabled={isCreating}
                >
                  {isCreating ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}