"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Plus,
  Minus,
  Edit,
  LogOut,
  CreditCard,
  Smartphone,
  Gift,
  Banknote,
  BarChart3,
  X,
  Percent,
  ArrowLeft,
  Delete,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// --- Types ---
interface AddOn {
  id: number
  name: string
  price: number
}

interface Product {
  id: number
  name: string
  price: number
  category: string
  image: string
  add_ons: AddOn[]
}

interface CartItem extends Product {
  quantity: number
  selected_add_ons: AddOn[]
  notes: string
}

interface Discount {
  type: "percentage" | "fixed"
  value: number
}

interface Transaction {
  id: number
  items: CartItem[]
  subtotal: number
  discount_amount: number
  total: number
  payment_method: string
  created_at: string
}

// --- Mock Data ---
const MOCK_PIN = "1234"

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Nasi Gudeg",
    price: 25000,
    category: "Makanan",
    image: "/nasi-gudeg.png",
    add_ons: [
      { id: 1, name: "Tambah Ayam", price: 10000 },
      { id: 2, name: "Tambah Telur", price: 5000 },
      { id: 3, name: "Extra Krecek", price: 3000 },
    ],
  },
  {
    id: 2,
    name: "Sate Ayam",
    price: 30000,
    category: "Makanan",
    image: "/grilled-chicken-satay.png",
    add_ons: [
      { id: 4, name: "Tambah Lontong", price: 5000 },
      { id: 5, name: "Extra Bumbu Kacang", price: 3000 },
    ],
  },
  {
    id: 3,
    name: "Bakso Spesial",
    price: 20000,
    category: "Makanan",
    image: "/bakso-indonesian-meatball-soup.png",
    add_ons: [
      { id: 6, name: "Tambah Bakso", price: 5000 },
      { id: 7, name: "Extra Mie", price: 3000 },
      { id: 8, name: "Tambah Tahu", price: 2000 },
    ],
  },
  {
    id: 4,
    name: "Nasi Goreng",
    price: 22000,
    category: "Makanan",
    image: "/placeholder.svg",
    add_ons: [
      { id: 9, name: "Tambah Telur", price: 5000 },
      { id: 10, name: "Tambah Ayam", price: 8000 },
    ],
  },
  {
    id: 5,
    name: "Es Teh Manis",
    price: 5000,
    category: "Minuman",
    image: "/es-teh-manis-glass.png",
    add_ons: [
      { id: 11, name: "Less Sugar", price: 0 },
      { id: 12, name: "Extra Boba", price: 5000 },
    ],
  },
  {
    id: 6,
    name: "Kopi Tubruk",
    price: 8000,
    category: "Minuman",
    image: "/kopi-tubruk.png",
    add_ons: [
      { id: 13, name: "Tambah Gula", price: 0 },
      { id: 14, name: "Extra Shot", price: 5000 },
    ],
  },
  {
    id: 7,
    name: "Jus Alpukat",
    price: 15000,
    category: "Minuman",
    image: "/placeholder.svg",
    add_ons: [
      { id: 15, name: "Extra Susu", price: 3000 },
      { id: 16, name: "Tambah Madu", price: 2000 },
    ],
  },
  {
    id: 8,
    name: "Air Mineral",
    price: 5000,
    category: "Minuman",
    image: "/placeholder.svg",
    add_ons: [],
  },
]

const mockTransactions: Transaction[] = [
  {
    id: 1,
    items: [
      { ...mockProducts[0], quantity: 2, selected_add_ons: [{ id: 1, name: "Tambah Ayam", price: 10000 }], notes: "" },
      { ...mockProducts[4], quantity: 2, selected_add_ons: [], notes: "" },
    ],
    subtotal: 80000,
    discount_amount: 5000,
    total: 75000,
    payment_method: "cash",
    created_at: "2026-03-09",
  },
  {
    id: 2,
    items: [
      { ...mockProducts[1], quantity: 1, selected_add_ons: [], notes: "tidak pedas" },
      { ...mockProducts[5], quantity: 1, selected_add_ons: [], notes: "" },
    ],
    subtotal: 38000,
    discount_amount: 0,
    total: 38000,
    payment_method: "debit-bca",
    created_at: "2026-03-09",
  },
  {
    id: 3,
    items: [
      { ...mockProducts[2], quantity: 3, selected_add_ons: [{ id: 6, name: "Tambah Bakso", price: 5000 }], notes: "" },
      { ...mockProducts[6], quantity: 2, selected_add_ons: [], notes: "" },
    ],
    subtotal: 105000,
    discount_amount: 10500,
    total: 94500,
    payment_method: "qris-gopay",
    created_at: "2026-03-09",
  },
]

const paymentMethods = {
  debit: [
    { id: "debit-bca", name: "Debit BCA", image: "/generic-three-letter-logo.png" },
    { id: "debit-mandiri", name: "Debit Mandiri", image: "/mandiri-logo.png" },
    { id: "debit-bri", name: "Debit BRI", image: "/bri-logo.png" },
    { id: "debit-bni", name: "Debit BNI", image: "/generic-business-networking-logo.png" },
  ],
  qris: [
    { id: "qris-gopay", name: "GoPay", image: "/gopay-logo.png" },
    { id: "qris-ovo", name: "OVO", image: "/ovo-logo.png" },
    { id: "qris-dana", name: "DANA", image: "/dana-logo.png" },
    { id: "qris-shopeepay", name: "ShopeePay", image: "/shopeepay-logo.png" },
  ],
  creditCard: [
    { id: "cc-visa", name: "Visa", image: "/visa-logo-generic.png" },
    { id: "cc-mastercard", name: "Mastercard", image: "/mastercard-logo.png" },
    { id: "cc-amex", name: "American Express", image: "/american-express-logo.png" },
  ],
  voucher: [
    { id: "voucher-grabfood", name: "GrabFood Voucher", image: "/grabfood-voucher.png" },
    { id: "voucher-gofood", name: "GoFood Voucher", image: "/gofood-voucher.png" },
  ],
}

// --- Main Component ---
export default function MaharasaPOS() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")

  // View
  const [currentView, setCurrentView] = useState<"pos" | "reports">("pos")

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("Semua")

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [notes, setNotes] = useState("")

  // Payment
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState("cash")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [cashAmount, setCashAmount] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Discount
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")

  // Transactions (mockup state)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)

  // --- PIN Login ---
  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      setPinError("")
      if (newPin.length === 4) {
        if (newPin === MOCK_PIN) {
          setIsAuthenticated(true)
          setPin("")
        } else {
          setPinError("PIN salah. Coba lagi.")
          setTimeout(() => {
            setPin("")
            setPinError("")
          }, 1000)
        }
      }
    }
  }

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1))
    setPinError("")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPin("")
    setPinError("")
    setCurrentView("pos")
    setCart([])
    setShowPaymentSection(false)
  }

  // --- Cart ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.selected_add_ons.length === 0 && item.notes === "",
      )
      if (existingIndex >= 0) {
        return prev.map((item, i) => (i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1, selected_add_ons: [], notes: "" }]
    })
  }

  const updateQuantity = (index: number, change: number) => {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i !== index) return item
          const newQty = item.quantity + change
          return newQty > 0 ? { ...item, quantity: newQty } : null
        })
        .filter((item): item is CartItem => item !== null),
    )
  }

  const editCartItem = (index: number) => {
    const item = cart[index]
    setSelectedProduct(item)
    setSelectedAddOns([...item.selected_add_ons])
    setNotes(item.notes)
    setEditingCartIndex(index)
    setIsEditDialogOpen(true)
  }

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns((prev) =>
      prev.find((a) => a.id === addOn.id) ? prev.filter((a) => a.id !== addOn.id) : [...prev, { ...addOn }],
    )
  }

  const handleUpdateCartItem = () => {
    if (editingCartIndex === null) return
    setCart((prev) =>
      prev.map((item, i) =>
        i === editingCartIndex ? { ...item, selected_add_ons: [...selectedAddOns], notes: notes.trim() } : item,
      ),
    )
    setIsEditDialogOpen(false)
    setEditingCartIndex(null)
    setSelectedProduct(null)
    setSelectedAddOns([])
    setNotes("")
  }

  // --- Totals ---
  const subtotal = cart.reduce((sum, item) => {
    const addOnsTotal = item.selected_add_ons.reduce((s, a) => s + a.price, 0)
    return sum + (item.price + addOnsTotal) * item.quantity
  }, 0)

  const discountAmount = (() => {
    if (!discount) return 0
    if (discount.type === "percentage") return Math.min((subtotal * discount.value) / 100, subtotal)
    return Math.min(discount.value, subtotal)
  })()

  const total = Math.max(0, subtotal - discountAmount)

  const applyDiscount = () => {
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) return alert("Masukkan nilai diskon yang valid!")
    if (discountType === "percentage" && value > 100) return alert("Persentase tidak boleh lebih dari 100%!")
    if (discountType === "fixed" && value > subtotal) return alert("Diskon tidak boleh melebihi subtotal!")
    setDiscount({ type: discountType, value })
    setDiscountValue("")
  }

  const removeDiscount = () => {
    setDiscount(null)
    setDiscountValue("")
  }

  // --- Payment ---
  const processPayment = () => {
    if (!paymentMethod) return alert("Pilih metode pembayaran!")
    if (paymentMethod === "cash") {
      const cash = parseFloat(cashAmount)
      if (isNaN(cash) || cash < total) return alert("Jumlah uang tunai tidak boleh kurang dari total!")
    }

    setIsProcessingPayment(true)
    setTimeout(() => {
      const newTransaction: Transaction = {
        id: transactions.length + 1,
        items: [...cart],
        subtotal,
        discount_amount: discountAmount,
        total,
        payment_method: paymentMethod,
        created_at: new Date().toISOString().split("T")[0],
      }
      setTransactions((prev) => [...prev, newTransaction])
      setCart([])
      setShowPaymentSection(false)
      setPaymentMethod("")
      setCashAmount("")
      setDiscount(null)
      setDiscountValue("")
      setSelectedPaymentCategory("cash")
      setIsProcessingPayment(false)
      alert("Pembayaran berhasil!")
    }, 800)
  }

  const getChange = () => {
    if (paymentMethod !== "cash") return 0
    return Math.max(0, (parseFloat(cashAmount) || 0) - total)
  }

  // --- Reports Analytics ---
  const getSalesAnalytics = () => {
    const categoryStats: Record<string, number> = {}
    const menuStats: Record<string, { quantity: number; revenue: number }> = {}
    const paymentStats: Record<string, { count: number; revenue: number }> = {}
    let totalDiscountGiven = 0
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)

    transactions.forEach((t) => {
      const pm = t.payment_method
      if (!paymentStats[pm]) paymentStats[pm] = { count: 0, revenue: 0 }
      paymentStats[pm].count++
      paymentStats[pm].revenue += t.total
      totalDiscountGiven += t.discount_amount

      t.items.forEach((item) => {
        const addOnsTotal = item.selected_add_ons.reduce((s, a) => s + a.price, 0)
        const itemRevenue = (item.price + addOnsTotal) * item.quantity
        if (!categoryStats[item.category]) categoryStats[item.category] = 0
        categoryStats[item.category] += itemRevenue
        if (!menuStats[item.name]) menuStats[item.name] = { quantity: 0, revenue: 0 }
        menuStats[item.name].quantity += item.quantity
        menuStats[item.name].revenue += itemRevenue
      })
    })

    return { categoryStats, menuStats, paymentStats, totalDiscountGiven, totalRevenue }
  }

  const categories = ["Semua", ...Array.from(new Set(mockProducts.map((p) => p.category)))]
  const filteredProducts =
    selectedCategory === "Semua" ? mockProducts : mockProducts.filter((p) => p.category === selectedCategory)

  // ===================== LOGIN SCREEN =====================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Maharasa POS</h1>
            <p className="text-slate-400 mt-1 text-sm">Masukkan PIN untuk melanjutkan</p>
          </div>

          {/* PIN Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
            {/* PIN Dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    i < pin.length
                      ? "bg-emerald-400 border-emerald-400 scale-110"
                      : "bg-transparent border-slate-400"
                  }`}
                />
              ))}
            </div>

            {/* Error */}
            {pinError && (
              <p className="text-red-400 text-sm text-center mb-4 animate-pulse">{pinError}</p>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinPress(digit)}
                  className="h-12 sm:h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-lg sm:text-xl font-semibold transition-all duration-150 border border-white/10 hover:border-white/30"
                >
                  {digit}
                </button>
              ))}
              <div /> {/* empty cell */}
              <button
                onClick={() => handlePinPress("0")}
                className="h-12 sm:h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-lg sm:text-xl font-semibold transition-all duration-150 border border-white/10 hover:border-white/30"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                className="h-12 sm:h-14 rounded-xl bg-white/10 hover:bg-red-500/30 active:bg-red-500/50 text-white transition-all duration-150 border border-white/10 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-xs text-center mt-4 sm:mt-5">Demo PIN: 1234</p>
          </div>
        </div>
      </div>
    )
  }

  // ===================== REPORTS SCREEN =====================
  if (currentView === "reports") {
    const { categoryStats, menuStats, paymentStats, totalDiscountGiven, totalRevenue } = getSalesAnalytics()

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("pos")}
              className="p-2 hover:bg-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Laporan Penjualan</h1>
              <p className="text-slate-500 text-sm">{transactions.length} total transaksi</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-emerald-700">Rp {totalRevenue.toLocaleString("id-ID")}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-700">{transactions.length}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Total Diskon</p>
                <p className="text-2xl font-bold text-orange-700">Rp {totalDiscountGiven.toLocaleString("id-ID")}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sales by Category */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-800 text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Penjualan per Kategori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryStats).map(([category, amount]) => (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-700 text-sm">{category}</span>
                        <span className="text-emerald-600 font-semibold text-sm">
                          Rp {amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: totalRevenue > 0 ? `${(amount / totalRevenue) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales by Payment Method */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-800 text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(paymentStats).map(([method, data]) => (
                    <div key={method} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-800 text-sm capitalize">{method.replace(/-/g, " ")}</p>
                        <p className="text-xs text-slate-500">{data.count} transaksi</p>
                      </div>
                      <p className="font-bold text-emerald-600 text-sm">Rp {data.revenue.toLocaleString("id-ID")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Sales Detail */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800 text-base">Detail Penjualan per Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Menu</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">Qty Terjual</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(menuStats)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .map(([name, data]) => (
                        <tr key={name} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-800">{name}</td>
                          <td className="text-right py-2 px-3 text-slate-600">{data.quantity}</td>
                          <td className="text-right py-2 px-3 font-medium text-emerald-600">
                            Rp {data.revenue.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ===================== POS SCREEN =====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Maharasa POS</h1>
            <p className="text-slate-500 text-sm">Sistem Point of Sale</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentView("reports")}
              className="gap-2 border-slate-300 hover:bg-slate-100"
            >
              <BarChart3 className="w-4 h-4" />
              Laporan
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap mb-3 lg:mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs lg:text-sm whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-slate-700 hover:bg-slate-800"
                      : "border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-100 mb-2">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h3 className="font-semibold text-xs leading-tight text-slate-800 line-clamp-2">
                          {product.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 flex-shrink-0">
                          {product.category === "Makanan" ? "Mkn" : "Mnum"}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-xs font-bold text-emerald-600">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(product)}
                          className="h-7 px-1.5 text-xs bg-slate-700 hover:bg-slate-800 w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Tambah
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="sticky top-4 shadow-sm border-slate-200 bg-white">
              <CardHeader className="pb-3 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-slate-800 text-base">
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Keranjang</span>
                  {cart.length > 0 && (
                    <Badge className="ml-auto bg-slate-700 text-white text-xs">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs sm:text-sm">Keranjang kosong</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-slate-800 truncate">{item.name}</p>
                              <p className="text-xs text-slate-500">Rp {item.price.toLocaleString("id-ID")}</p>
                              {item.selected_add_ons.length > 0 && (
                                <div className="mt-1">
                                  {item.selected_add_ons.map((a) => (
                                    <p key={a.id} className="text-xs text-slate-500">
                                      + {a.name} (Rp {a.price.toLocaleString("id-ID")})
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-xs text-slate-400 italic mt-1 truncate">"{item.notes}"</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => editCartItem(index)}
                                className="w-7 h-7 p-0 text-slate-500 hover:text-slate-800"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, -1)}
                                className="w-7 h-7 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, 1)}
                                className="w-7 h-7 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="mb-3" />
                    <div className="space-y-1 text-sm mb-4">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between text-red-500">
                          <span>Diskon</span>
                          <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base text-slate-800 pt-1 border-t border-slate-200">
                        <span>Total</span>
                        <span className="text-emerald-600">Rp {total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowPaymentSection(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Checkout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Cart Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 text-base sm:text-lg truncate">Edit: {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {selectedProduct?.add_ons && selectedProduct.add_ons.length > 0 && (
              <div>
                <h4 className="font-medium text-xs sm:text-sm text-slate-700 mb-2">Add-On Tersedia</h4>
                <div className="space-y-2">
                  {selectedProduct.add_ons.map((addOn) => (
                    <div key={addOn.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`addon-${addOn.id}`}
                        checked={selectedAddOns.some((a) => a.id === addOn.id)}
                        onCheckedChange={() => toggleAddOn(addOn)}
                      />
                      <label
                        htmlFor={`addon-${addOn.id}`}
                        className="flex-1 flex justify-between text-xs sm:text-sm cursor-pointer"
                      >
                        <span className="truncate">{addOn.name}</span>
                        <span className="text-emerald-600 font-medium flex-shrink-0 ml-1">
                          {addOn.price > 0 ? `+Rp ${addOn.price.toLocaleString("id-ID")}` : "Gratis"}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="font-medium text-sm text-slate-700 mb-2">Catatan</h4>
              <Textarea
                placeholder="Tambahkan catatan khusus (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Batal
              </Button>
              <Button onClick={handleUpdateCartItem} className="flex-1 bg-slate-700 hover:bg-slate-800">
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Section Overlay */}
      {showPaymentSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Pembayaran</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPaymentSection(false)
                    setPaymentMethod("")
                    setCashAmount("")
                    setSelectedPaymentCategory("cash")
                  }}
                  className="w-8 h-8 p-0 hover:bg-slate-100 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left: Order Summary + Discount */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-2 sm:mb-3 text-sm">Ringkasan Pesanan</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {cart.map((item, i) => (
                        <div key={i} className="flex justify-between text-slate-700">
                          <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                          <span className="flex-shrink-0">
                            Rp {((item.price + item.selected_add_ons.reduce((s, a) => s + a.price, 0)) * item.quantity).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-2 sm:my-3" />
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span className="flex-shrink-0">Rp {subtotal.toLocaleString("id-ID")}</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between text-red-500">
                          <span>Diskon</span>
                          <span className="flex-shrink-0">- Rp {discountAmount.toLocaleString("id-ID")}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm sm:text-base text-slate-800 pt-1 border-t border-slate-200">
                        <span>Total</span>
                        <span className="text-emerald-600 flex-shrink-0">Rp {total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-2 sm:mb-3">
                      <Percent className="w-4 h-4 flex-shrink-0" />
                      <span>Diskon (Opsional)</span>
                    </h4>
                    {!discount ? (
                      <div className="space-y-3">
                        <RadioGroup
                          value={discountType}
                          onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}
                          className="flex gap-3 sm:gap-4 flex-wrap"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="pct" />
                            <Label htmlFor="pct" className="text-xs sm:text-sm cursor-pointer">Persen (%)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fix" />
                            <Label htmlFor="fix" className="text-xs sm:text-sm cursor-pointer">Nominal (Rp)</Label>
                          </div>
                        </RadioGroup>
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <Input
                            type="number"
                            placeholder={discountType === "percentage" ? "Contoh: 10" : "Contoh: 5000"}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="flex-1 border-slate-300 text-sm"
                          />
                          <Button
                            onClick={applyDiscount}
                            size="sm"
                            disabled={!discountValue}
                            className="bg-slate-700 hover:bg-slate-800 text-xs sm:text-sm sm:w-auto"
                          >
                            Terapkan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">
                          Diskon{" "}
                          {discount.type === "percentage"
                            ? `${discount.value}%`
                            : `Rp ${discount.value.toLocaleString("id-ID")}`}{" "}
                          diterapkan
                        </span>
                        <Button onClick={removeDiscount} variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Payment Method */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-slate-800 text-sm">Pilih Metode Pembayaran</h3>

                  {/* Tabs */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {["cash", "debit", "qris", "creditCard", "voucher"].map((cat) => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={selectedPaymentCategory === cat ? "default" : "outline"}
                        onClick={() => { setSelectedPaymentCategory(cat); setPaymentMethod("") }}
                        className={`text-xs px-2 sm:px-3 h-8 sm:h-9 ${
                          selectedPaymentCategory === cat
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {cat === "creditCard" ? "CC" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Payment Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {selectedPaymentCategory === "cash" && (
                      <div
                        className={`p-2 sm:p-3 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-colors col-span-1 ${
                          paymentMethod === "cash" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <div className="flex flex-col items-center gap-1.5 sm:gap-3">
                          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-emerald-100 rounded flex items-center justify-center">
                            <Banknote className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-slate-800 text-xs sm:text-sm">Cash</p>
                            <p className="text-xs text-slate-500">Tunai</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPaymentCategory !== "cash" &&
                      (paymentMethods[selectedPaymentCategory as keyof typeof paymentMethods] || []).map((method) => (
                        <div
                          key={method.id}
                          className={`p-2 sm:p-3 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-colors ${
                            paymentMethod === method.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <img
                              src={method.image || "/placeholder.svg"}
                              alt={method.name}
                              className="w-8 sm:w-10 h-8 sm:h-10 object-contain rounded"
                            />
                            <p className="font-medium text-slate-800 text-xs sm:text-sm text-center line-clamp-2">{method.name}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Cash Input with Calculator */}
                  {paymentMethod === "cash" && (
                    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 space-y-3 sm:space-y-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3 block">Jumlah Uang Tunai</Label>
                        <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-slate-300 text-right">
                          <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">
                            Rp {cashAmount ? Number(cashAmount).toLocaleString("id-ID") : "0"}
                          </p>
                        </div>
                      </div>

                      {/* Quick denomination buttons */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {[20000, 50000, 100000, 200000].map((amount) => (
                          <Button
                            key={amount}
                            onClick={() => setCashAmount(String(amount))}
                            variant={Number(cashAmount) === amount ? "default" : "outline"}
                            className={`h-9 sm:h-10 text-xs sm:text-sm font-medium px-1 sm:px-2 ${
                              Number(cashAmount) === amount
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {(amount / 1000).toFixed(0)}K
                          </Button>
                        ))}
                      </div>

                      {/* Number pad calculator */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {[1, 2, 3, "C", 4, 5, 6, "00", 7, 8, 9, "x", "."]
                          .concat(cashAmount ? ["Hapus"] : [])
                          .concat(["OK"])
                          .map((key, idx) => {
                            const isFunction = ["C", "00", "x", "Hapus", "OK"].includes(String(key))
                            return (
                              <Button
                                key={idx}
                                onClick={() => {
                                  if (key === "C") {
                                    setCashAmount("")
                                  } else if (key === "Hapus") {
                                    setCashAmount(cashAmount.slice(0, -1))
                                  } else if (key === "x") {
                                    // Multiply by 1000
                                    const num = parseInt(cashAmount) || 0
                                    setCashAmount(String(num * 1000))
                                  } else if (key === "OK" || key === ".") {
                                    // OK is just a visual button, . for decimals
                                    if (key === ".") {
                                      setCashAmount(cashAmount + ".")
                                    }
                                  } else {
                                    setCashAmount(cashAmount + key)
                                  }
                                }}
                                className={`h-10 sm:h-14 font-semibold text-sm sm:text-lg ${
                                  isFunction
                                    ? key === "OK"
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : key === "Hapus"
                                      ? "bg-red-500 hover:bg-red-600 text-white"
                                      : "bg-slate-300 hover:bg-slate-400 text-slate-900 text-xs sm:text-sm"
                                    : "bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-900 text-sm sm:text-lg"
                                }`}
                              >
                                {key}
                              </Button>
                            )
                          })}
                      </div>

                      {/* Change info */}
                      <div className="space-y-2">
                        {cashAmount && Number(cashAmount) >= total && (
                          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                            <p className="text-xs sm:text-sm text-emerald-700">
                              Kembalian: <span className="font-bold text-sm sm:text-lg">Rp {getChange().toLocaleString("id-ID")}</span>
                            </p>
                          </div>
                        )}
                        {cashAmount && Number(cashAmount) < total && Number(cashAmount) > 0 && (
                          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <p className="text-xs sm:text-sm text-red-700">
                              Kurang: <span className="font-bold text-sm sm:text-lg">Rp {(total - Number(cashAmount)).toLocaleString("id-ID")}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-3 sm:my-5" />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setShowPaymentSection(false)
                    setPaymentMethod("")
                    setCashAmount("")
                    setSelectedPaymentCategory("cash")
                  }}
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  Batal
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={
                    !paymentMethod ||
                    (paymentMethod === "cash" && (!cashAmount || Number(cashAmount) < total)) ||
                    isProcessingPayment
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 sm:px-8 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Memproses...</span>
                      <span className="sm:hidden">...</span>
                    </div>
                  ) : (
                    <span className="truncate">Bayar Rp {total.toLocaleString("id-ID")}</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
