"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ShoppingCart,
  Plus,
  Minus,
  Edit,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet,
  LogOut,
  BarChart3,
  ArrowLeft,
  Percent,
  X,
} from "lucide-react"

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface LoginRequest {
  pin: string
}

interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
  }
}

interface CheckoutRequest {
  items: CartItem[]
  subtotal: number
  discount?: Discount
  discountAmount: number
  total: number
  paymentMethod: string
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// API Service Functions
const apiService = {
  // Authentication
  login: async (pin: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin }),
    })
    return response.json()
  },

  logout: async (token: string): Promise<ApiResponse<null>> => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    return response.json()
  },

  // Products
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await fetch(`${API_BASE_URL}/products`)
    return response.json()
  },

  getAddOns: async (productId: number): Promise<ApiResponse<AddOn[]>> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/addons`)
    return response.json()
  },

  // Transactions
  createTransaction: async (data: CheckoutRequest, token: string): Promise<ApiResponse<Transaction>> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  getTransactions: async (token: string): Promise<ApiResponse<Transaction[]>> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  },

  // Reports
  getSalesReport: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/reports/sales`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  },

  // Payment Methods
  getPaymentMethods: async (): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/payment-methods`)
    return response.json()
  },
}

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
  addOns?: AddOn[]
}

interface CartItem extends Product {
  quantity: number
  selectedAddOns: AddOn[]
  notes: string
}

interface Discount {
  type: "percentage" | "fixed"
  value: number
}

interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  discount?: Discount
  discountAmount: number
  total: number
  paymentMethod: string
  timestamp: Date
}

const addOnsData: { [key: number]: AddOn[] } = {
  1: [
    // Nasi Gudeg
    { id: 1, name: "Telur Pindang", price: 3000 },
    { id: 2, name: "Ayam Kampung", price: 8000 },
    { id: 3, name: "Tahu Bacem", price: 2000 },
  ],
  2: [
    // Sate Ayam
    { id: 4, name: "Nasi Putih", price: 3000 },
    { id: 5, name: "Lontong", price: 2000 },
    { id: 6, name: "Sambal Extra", price: 1000 },
  ],
  5: [
    // Bakso
    { id: 7, name: "Mie Tambahan", price: 2000 },
    { id: 8, name: "Pangsit", price: 3000 },
    { id: 9, name: "Tahu Goreng", price: 2000 },
  ],
}

const paymentMethodsData = {
  debit: [
    { id: "debit-bca", name: "Debit BCA", icon: CreditCard, image: "/generic-three-letter-logo.png" },
    { id: "debit-mandiri", name: "Debit Mandiri", icon: CreditCard, image: "/mandiri-logo.png" },
    { id: "debit-bri", name: "Debit BRI", icon: CreditCard, image: "/bri-logo.png" },
    { id: "debit-bni", name: "Debit BNI", icon: CreditCard, image: "/generic-business-networking-logo.png" },
  ],
  qris: [
    { id: "qris-gopay", name: "GoPay", icon: Smartphone, image: "/gopay-logo.png" },
    { id: "qris-ovo", name: "OVO", icon: Smartphone, image: "/ovo-logo.png" },
    { id: "qris-dana", name: "DANA", icon: Smartphone, image: "/dana-logo.png" },
    { id: "qris-shopeepay", name: "ShopeePay", icon: Smartphone, image: "/shopeepay-logo.png" },
  ],
  credit: [
    { id: "credit-visa", name: "Visa", icon: Wallet, image: "/visa-logo-generic.png" },
    { id: "credit-mastercard", name: "Mastercard", icon: Wallet, image: "/mastercard-logo.png" },
    { id: "credit-amex", name: "American Express", icon: Wallet, image: "/american-express-logo.png" },
  ],
  voucher: [
    { id: "voucher-grab", name: "GrabFood Voucher", icon: Wallet, image: "/grabfood-voucher.png" },
    { id: "voucher-gojek", name: "GoFood Voucher", icon: Wallet, image: "/gofood-voucher.png" },
  ],
}

export default function MaharasaPOS() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [currentView, setCurrentView] = useState<"pos" | "reports">("pos")

  // Loading states for API calls
  const [isLoading, setIsLoading] = useState(false)
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [isTransactionLoading, setIsTransactionLoading] = useState(false)

  // Data from API
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any>({})

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [notes, setNotes] = useState<string>("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [cashAmount, setCashAmount] = useState<string>("")

  const [discount, setDiscount] = useState<Discount | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("")

  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<string>("cash")
  const [showPaymentSection, setShowPaymentSection] = useState(false)

  const categories = ["Semua", "Makanan", "Minuman"]

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts()
      loadPaymentMethods()
      loadTransactions()
    }
  }, [isAuthenticated])

  const loadProducts = async () => {
    setIsProductsLoading(true)
    try {
      const response = await apiService.getProducts()
      if (response.success) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setIsProductsLoading(false)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const response = await apiService.getPaymentMethods()
      if (response.success) {
        setPaymentMethods(response.data)
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await apiService.getTransactions(authToken)
      if (response.success) {
        setTransactions(response.data)
      }
    } catch (error) {
      console.error("Failed to load transactions:", error)
    }
  }

  const handlePinSubmit = async () => {
    setIsLoading(true)
    setPinError("")

    try {
      const response = await apiService.login(pin)
      if (response.success) {
        setIsAuthenticated(true)
        setAuthToken(response.data.token)
        setUser(response.data.user)
        setPin("")

        // Store token in localStorage for persistence
        localStorage.setItem("auth_token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
      } else {
        setPinError(response.message || "PIN salah! Silakan coba lagi.")
        setPin("")
      }
    } catch (error) {
      setPinError("Terjadi kesalahan. Silakan coba lagi.")
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (authToken) {
        await apiService.logout(authToken)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsAuthenticated(false)
      setAuthToken("")
      setUser(null)
      setCart([])
      setPin("")
      setPinError("")
      setCurrentView("pos")

      // Clear stored data
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      setAuthToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const cartItem: CartItem = {
        ...product,
        quantity: 1,
        selectedAddOns: [],
        notes: "",
      }

      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.selectedAddOns.length === 0 && item.notes === "",
      )

      if (existingIndex >= 0) {
        return prev.map((item, index) => (index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item))
      }

      return [...prev, cartItem]
    })
  }

  const editCartItem = (index: number) => {
    const item = cart[index]
    setSelectedProduct(item)
    setSelectedAddOns(item.selectedAddOns)
    setNotes(item.notes)
    setEditingCartIndex(index)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCartItem = () => {
    if (editingCartIndex !== null && selectedProduct) {
      setCart((prev) =>
        prev.map((item, index) => (index === editingCartIndex ? { ...item, selectedAddOns, notes } : item)),
      )
      setIsEditDialogOpen(false)
      setEditingCartIndex(null)
      setSelectedProduct(null)
      setSelectedAddOns([])
      setNotes("")
    }
  }

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((item) => item.id === addOn.id)
      if (exists) {
        return prev.filter((item) => item.id !== addOn.id)
      } else {
        return [...prev, addOn]
      }
    })
  }

  const updateQuantity = (index: number, change: number) => {
    setCart((prev) => {
      return prev
        .map((item, i) => {
          if (i === index) {
            const newQuantity = item.quantity + change
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang kosong!")
      return
    }
    setShowPaymentSection(true)
  }

  const subtotal = cart.reduce((sum, item) => {
    const addOnsTotal = item.selectedAddOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0)
    return sum + (item.price + addOnsTotal) * item.quantity
  }, 0)

  const calculateDiscountAmount = () => {
    if (!discount) return 0
    if (discount.type === "percentage") {
      return (subtotal * discount.value) / 100
    }
    return discount.value
  }

  const discountAmount = calculateDiscountAmount()
  const total = subtotal - discountAmount

  const applyDiscount = () => {
    const value = Number.parseFloat(discountValue)
    if (value > 0) {
      if (discountType === "percentage" && value > 100) {
        alert("Persentase diskon tidak boleh lebih dari 100%!")
        return
      }
      if (discountType === "fixed" && value > subtotal) {
        alert("Diskon tidak boleh lebih besar dari subtotal!")
        return
      }
      setDiscount({ type: discountType, value })
    }
  }

  const removeDiscount = () => {
    setDiscount(null)
    setDiscountValue("")
  }

  const processPayment = async () => {
    if (paymentMethod === "cash") {
      const cash = Number.parseFloat(cashAmount)
      if (cash < total) {
        alert("Jumlah pembayaran tidak boleh kurang dari total!")
        return
      }
    }

    setIsTransactionLoading(true)

    try {
      const checkoutData: CheckoutRequest = {
        items: cart,
        subtotal,
        discount: discount || undefined,
        discountAmount,
        total,
        paymentMethod,
      }

      const response = await apiService.createTransaction(checkoutData, authToken)

      if (response.success) {
        alert(`Pembayaran berhasil dengan metode ${paymentMethod}!`)
        setCart([])
        setShowPaymentSection(false)
        setPaymentMethod("")
        setCashAmount("")
        setDiscount(null)
        setDiscountValue("")

        // Reload transactions to get updated data
        loadTransactions()
      } else {
        alert(response.message || "Pembayaran gagal!")
      }
    } catch (error) {
      alert("Terjadi kesalahan saat memproses pembayaran!")
      console.error("Payment error:", error)
    } finally {
      setIsTransactionLoading(false)
    }
  }

  const getChange = () => {
    const cash = Number.parseFloat(cashAmount) || 0
    return cash > total ? cash - total : 0
  }

  const filteredProducts = products.filter(
    (product) => selectedCategory === "Semua" || product.category === selectedCategory,
  )

  const getSalesAnalytics = () => {
    const categoryStats = { Makanan: 0, Minuman: 0 }
    const menuStats: { [key: string]: { quantity: number; revenue: number } } = {}
    const paymentStats: { [key: string]: { count: number; revenue: number } } = {}
    let totalDiscountGiven = 0

    transactions.forEach((transaction) => {
      if (!paymentStats[transaction.paymentMethod]) {
        paymentStats[transaction.paymentMethod] = { count: 0, revenue: 0 }
      }
      paymentStats[transaction.paymentMethod].count++
      paymentStats[transaction.paymentMethod].revenue += transaction.total

      totalDiscountGiven += transaction.discountAmount

      transaction.items.forEach((item) => {
        const itemTotal =
          (item.price + item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity
        categoryStats[item.category as keyof typeof categoryStats] += itemTotal

        if (!menuStats[item.name]) {
          menuStats[item.name] = { quantity: 0, revenue: 0 }
        }
        menuStats[item.name].quantity += item.quantity
        menuStats[item.name].revenue += itemTotal
      })
    })

    return { categoryStats, menuStats, paymentStats, totalDiscountGiven }
  }

  const handleNumberPadClick = (number: string) => {
    setPin((prevPin) => prevPin + number)
  }

  const handleClear = () => {
    setPin("")
  }

  const handleBackspace = () => {
    setPin((prevPin) => prevPin.slice(0, -1))
  }

  const { categoryStats, menuStats, paymentStats, totalDiscountGiven } = getSalesAnalytics()
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
  const totalSubtotal = transactions.reduce((sum, t) => sum + t.subtotal, 0)

  if (currentView === "reports") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("pos")}
                  className="flex items-center gap-2 border-slate-300 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke POS
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Laporan Penjualan</h1>
                  <p className="text-slate-600">Analisis penjualan Maharasa POS</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-700">Total Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">Rp {totalRevenue.toLocaleString("id-ID")}</div>
                <p className="text-slate-600 mt-2">{transactions.length} transaksi</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-700">Total Diskon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">Rp {totalDiscountGiven.toLocaleString("id-ID")}</div>
                <p className="text-slate-600 mt-2">Diskon yang diberikan</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-700">Penjualan Kotor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-600">Rp {totalSubtotal.toLocaleString("id-ID")}</div>
                <p className="text-slate-600 mt-2">Sebelum diskon</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-700">Penjualan per Kategori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Makanan</span>
                  <span className="text-emerald-600 font-bold">Rp {categoryStats.Makanan.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Minuman</span>
                  <span className="text-emerald-600 font-bold">Rp {categoryStats.Minuman.toLocaleString("id-ID")}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-700">Penjualan per Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(paymentStats)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([method, stats]) => (
                      <div
                        key={method}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200"
                      >
                        <div>
                          <p className="font-medium text-sm capitalize text-slate-700">{method}</p>
                          <p className="text-xs text-slate-600">{stats.count} transaksi</p>
                        </div>
                        <span className="text-emerald-600 font-bold text-sm">
                          Rp {stats.revenue.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  {Object.keys(paymentStats).length === 0 && (
                    <p className="text-slate-500 text-center py-4">Belum ada data pembayaran</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-700">Penjualan per Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(menuStats)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)
                  .map(([menuName, stats]) => (
                    <div
                      key={menuName}
                      className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-sm text-slate-700">{menuName}</p>
                        <p className="text-xs text-slate-600">{stats.quantity} terjual</p>
                      </div>
                      <span className="text-emerald-600 font-bold text-sm">
                        Rp {stats.revenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                {Object.keys(menuStats).length === 0 && (
                  <p className="text-slate-500 text-center py-4">Belum ada data penjualan</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <span className="text-2xl font-bold text-white">M</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Maharasa POS</h1>
              <p className="text-slate-300 text-sm">Masukkan PIN untuk melanjutkan</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-center space-x-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        i < pin.length
                          ? "bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-400/50"
                          : "border-slate-400"
                      }`}
                    />
                  ))}
                </div>
                {pinError && <p className="text-red-400 text-sm text-center">{pinError}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="lg"
                    className="h-14 text-xl font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
                    onClick={() => handleNumberPadClick(num.toString())}
                    disabled={isLoading}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 text-xl font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  onClick={() => handleNumberPadClick("0")}
                  disabled={isLoading}
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  onClick={handleBackspace}
                  disabled={isLoading}
                >
                  ⌫
                </Button>
              </div>

              <Button
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50"
                onClick={handlePinSubmit}
                disabled={pin.length === 0 || isLoading}
              >
                {isLoading ? "Memverifikasi..." : "Masuk"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Maharasa POS</h1>
              <p className="text-slate-600">Sistem Point of Sale untuk Restoran</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentView("reports")}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100"
              >
                <BarChart3 className="w-4 h-4" />
                Laporan
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={`mb-2 ${
                      selectedCategory === category
                        ? "bg-slate-700 hover:bg-slate-800"
                        : "border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow shadow-md border-slate-200/50 bg-white/95 backdrop-blur-sm"
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-2">
                      <div className="w-full aspect-square overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-slate-800">
                            {product.name}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="text-xs ml-1 flex-shrink-0 bg-slate-100 text-slate-700 border-slate-300"
                          >
                            {product.category}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-emerald-600">
                            Rp {product.price.toLocaleString("id-ID")}
                          </span>
                          <Button
                            onClick={() => addToCart(product)}
                            size="sm"
                            className="text-xs px-2 py-1 h-7 bg-slate-700 hover:bg-slate-800"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-lg border-slate-200/50 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Keranjang kosong</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-slate-800">{item.name}</h4>
                              <p className="text-xs text-slate-600">Rp {item.price.toLocaleString("id-ID")}</p>
                              {item.selectedAddOns.length > 0 && (
                                <div className="mt-1">
                                  {item.selectedAddOns.map((addOn) => (
                                    <p key={addOn.id} className="text-xs text-slate-600">
                                      + {addOn.name} (Rp {addOn.price.toLocaleString("id-ID")})
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.notes && <p className="text-xs text-gray-500 mt-1 italic">"{item.notes}"</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => editCartItem(index)}
                                className="w-8 h-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, -1)}
                                className="w-8 h-8 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, 1)}
                                className="w-8 h-8 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal:</span>
                        <span className="font-medium text-slate-800">Rp {subtotal.toLocaleString("id-ID")}</span>
                      </div>
                      {discount && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Diskon:</span>
                          <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-slate-800">Total:</span>
                        <span className="text-emerald-600">Rp {total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowPaymentSection(true)}
                      className="w-full mt-4 bg-slate-700 hover:bg-slate-800"
                      disabled={cart.length === 0}
                    >
                      Checkout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedProduct?.addOns && selectedProduct.addOns.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Add-On Tersedia:</h4>
                  <div className="space-y-2">
                    {selectedProduct.addOns.map((addOn) => (
                      <div key={addOn.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`addon-${addOn.id}`}
                          checked={selectedAddOns.some((item) => item.id === addOn.id)}
                          onCheckedChange={() => toggleAddOn(addOn)}
                        />
                        <label
                          htmlFor={`addon-${addOn.id}`}
                          className="flex-1 flex justify-between text-sm cursor-pointer"
                        >
                          <span>{addOn.name}</span>
                          <span className="text-green-600 font-medium">+Rp {addOn.price.toLocaleString("id-ID")}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Catatan:</h4>
                <Textarea
                  placeholder="Tambahkan catatan khusus (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Batal
                </Button>
                <Button onClick={handleUpdateCartItem} className="flex-1">
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showPaymentSection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Pembayaran</h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPaymentSection(false)
                      setPaymentMethod("")
                      setCashAmount("")
                      setSelectedPaymentCategory("cash")
                    }}
                    className="border-slate-300 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left side - Order Summary and Discount */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h3 className="font-medium mb-3 text-slate-800">Ringkasan Pesanan</h3>
                      <div className="space-y-2 text-sm">
                        {cart.map((item, index) => (
                          <div key={index} className="flex justify-between text-slate-700">
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                            <span>
                              Rp{" "}
                              {(
                                item.price * item.quantity +
                                (item.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0) * item.quantity
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-medium text-slate-800">
                          <span>Subtotal:</span>
                          <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        {discount && (
                          <div className="flex justify-between text-red-600">
                            <span>Diskon:</span>
                            <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between text-lg font-bold text-emerald-600">
                          <span>Total:</span>
                          <span>Rp {total.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Discount Section */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-800">
                        <Percent className="w-4 h-4" />
                        Diskon (Opsional)
                      </h4>
                      {!discount ? (
                        <div className="space-y-3">
                          <RadioGroup
                            value={discountType}
                            onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="percentage" id="percentage" />
                              <Label htmlFor="percentage" className="text-slate-700">
                                Persentase (%)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fixed" id="fixed" />
                              <Label htmlFor="fixed" className="text-slate-700">
                                Nominal (Rp)
                              </Label>
                            </div>
                          </RadioGroup>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder={discountType === "percentage" ? "Masukkan %" : "Masukkan nominal"}
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              className="flex-1 border-slate-300"
                            />
                            <Button
                              onClick={applyDiscount}
                              size="sm"
                              disabled={!discountValue}
                              className="bg-slate-700 hover:bg-slate-800"
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
                          <Button
                            onClick={removeDiscount}
                            variant="outline"
                            size="sm"
                            className="border-slate-300 hover:bg-slate-100 bg-transparent"
                          >
                            Hapus
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Payment Methods */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-800">Pilih Metode Pembayaran</h3>

                    {/* Payment Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedPaymentCategory === "cash" ? "default" : "outline"}
                        onClick={() => setSelectedPaymentCategory("cash")}
                        size="sm"
                        className={
                          selectedPaymentCategory === "cash"
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "border-slate-300 hover:bg-slate-100"
                        }
                      >
                        Cash
                      </Button>
                      <Button
                        variant={selectedPaymentCategory === "debit" ? "default" : "outline"}
                        onClick={() => setSelectedPaymentCategory("debit")}
                        size="sm"
                        className={
                          selectedPaymentCategory === "debit"
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "border-slate-300 hover:bg-slate-100"
                        }
                      >
                        Debit
                      </Button>
                      <Button
                        variant={selectedPaymentCategory === "qris" ? "default" : "outline"}
                        onClick={() => setSelectedPaymentCategory("qris")}
                        size="sm"
                        className={
                          selectedPaymentCategory === "qris"
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "border-slate-300 hover:bg-slate-100"
                        }
                      >
                        QRIS
                      </Button>
                      <Button
                        variant={selectedPaymentCategory === "credit" ? "default" : "outline"}
                        onClick={() => setSelectedPaymentCategory("credit")}
                        size="sm"
                        className={
                          selectedPaymentCategory === "credit"
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "border-slate-300 hover:bg-slate-100"
                        }
                      >
                        Credit Card
                      </Button>
                      <Button
                        variant={selectedPaymentCategory === "voucher" ? "default" : "outline"}
                        onClick={() => setSelectedPaymentCategory("voucher")}
                        size="sm"
                        className={
                          selectedPaymentCategory === "voucher"
                            ? "bg-slate-700 hover:bg-slate-800"
                            : "border-slate-300 hover:bg-slate-100"
                        }
                      >
                        Voucher
                      </Button>
                    </div>

                    {/* Payment Options Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPaymentCategory === "cash" && (
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === "cash"
                              ? "border-slate-500 bg-slate-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => setPaymentMethod("cash")}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Banknote className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">Cash</p>
                              <p className="text-sm text-slate-600">Tunai</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPaymentCategory === "debit" &&
                        paymentMethodsData.debit.map((method) => (
                          <div
                            key={method.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === method.id
                                ? "border-slate-500 bg-slate-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={method.image || "/placeholder.svg"}
                                alt={method.name}
                                className="w-12 h-12 object-contain"
                              />
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-sm text-gray-600">Debit Card</p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {selectedPaymentCategory === "qris" &&
                        paymentMethodsData.qris.map((method) => (
                          <div
                            key={method.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === method.id
                                ? "border-slate-500 bg-slate-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={method.image || "/placeholder.svg"}
                                alt={method.name}
                                className="w-12 h-12 object-contain"
                              />
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-sm text-gray-600">QRIS</p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {selectedPaymentCategory === "credit" &&
                        paymentMethodsData.credit.map((method) => (
                          <div
                            key={method.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === method.id
                                ? "border-slate-500 bg-slate-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={method.image || "/placeholder.svg"}
                                alt={method.name}
                                className="w-12 h-12 object-contain"
                              />
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-sm text-gray-600">Credit Card</p>
                              </div>
                            </div>
                          </div>
                        ))}

                      {selectedPaymentCategory === "voucher" &&
                        paymentMethodsData.voucher.map((method) => (
                          <div
                            key={method.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              paymentMethod === method.id
                                ? "border-slate-500 bg-slate-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={method.image || "/placeholder.svg"}
                                alt={method.name}
                                className="w-12 h-12 object-contain"
                              />
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-sm text-gray-600">Voucher</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
