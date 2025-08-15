"use client"

import { useState } from "react"
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
  Lock,
  LogOut,
  BarChart3,
  ArrowLeft,
  Percent,
} from "lucide-react"

const PIN_CODE = "1234" // Default PIN for demo

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

const products: Product[] = [
  {
    id: 1,
    name: "Nasi Gudeg",
    price: 15000,
    category: "Makanan",
    image: "/nasi-gudeg.png",
    addOns: addOnsData[1],
  },
  {
    id: 2,
    name: "Sate Ayam",
    price: 20000,
    category: "Makanan",
    image: "/grilled-chicken-satay.png",
    addOns: addOnsData[2],
  },
  { id: 3, name: "Es Teh Manis", price: 5000, category: "Minuman", image: "/es-teh-manis-glass.png" },
  { id: 4, name: "Kopi Tubruk", price: 8000, category: "Minuman", image: "/kopi-tubruk.png" },
  {
    id: 5,
    name: "Bakso",
    price: 12000,
    category: "Makanan",
    image: "/bakso-indonesian-meatball-soup.png",
    addOns: addOnsData[5],
  },
  { id: 6, name: "Es Jeruk", price: 7000, category: "Minuman", image: "/placeholder-u3yhk.png" },
]

export default function POSSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [currentView, setCurrentView] = useState<"pos" | "reports">("pos")
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [notes, setNotes] = useState<string>("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [cashAmount, setCashAmount] = useState<string>("")

  const [discount, setDiscount] = useState<Discount | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("")

  const categories = ["Semua", "Makanan", "Minuman"]

  const handlePinSubmit = () => {
    if (pin === PIN_CODE) {
      setIsAuthenticated(true)
      setPinError("")
      setPin("")
    } else {
      setPinError("PIN salah! Silakan coba lagi.")
      setPin("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCart([])
    setPin("")
    setPinError("")
    setCurrentView("pos")
  }

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6)
    setPin(numericValue)
    setPinError("")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Maharasa POS</CardTitle>
            <p className="text-gray-600">Masukkan PIN untuk melanjutkan</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePinSubmit()}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              {pinError && <p className="text-sm text-red-600 mt-2">{pinError}</p>}
            </div>
            <Button onClick={handlePinSubmit} className="w-full" size="lg" disabled={pin.length === 0}>
              Masuk
            </Button>
            <div className="text-center text-sm text-gray-500">Demo PIN: 1234</div>
          </CardContent>
        </Card>
      </div>
    )
  }

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

  const handlePayment = () => {
    setIsPaymentDialogOpen(true)
    setPaymentMethod("")
    setCashAmount("")
    setDiscount(null)
    setDiscountType("percentage")
    setDiscountValue("")
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

  const processPayment = () => {
    if (paymentMethod === "cash") {
      const cash = Number.parseFloat(cashAmount)
      if (cash < total) {
        alert("Jumlah pembayaran tidak boleh kurang dari total!")
        return
      }
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      items: [...cart],
      subtotal,
      discount: discount || undefined,
      discountAmount,
      total,
      paymentMethod,
      timestamp: new Date(),
    }
    setTransactions((prev) => [...prev, transaction])

    alert(`Pembayaran berhasil dengan metode ${paymentMethod}!`)
    setCart([]) // Clear cart after successful payment
    setIsPaymentDialogOpen(false)
    setPaymentMethod("")
    setCashAmount("")
    setDiscount(null)
    setDiscountValue("")
  }

  const getChange = () => {
    const cash = Number.parseFloat(cashAmount) || 0
    return cash > total ? cash - total : 0
  }

  const filteredProducts =
    selectedCategory === "Semua" ? products : products.filter((p) => p.category === selectedCategory)

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

  const { categoryStats, menuStats, paymentStats, totalDiscountGiven } = getSalesAnalytics()
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
  const totalSubtotal = transactions.reduce((sum, t) => sum + t.subtotal, 0)

  if (currentView === "reports") {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setCurrentView("pos")} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke POS
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Penjualan</h1>
                  <p className="text-gray-600">Analisis penjualan Maharasa POS</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">Rp {totalRevenue.toLocaleString("id-ID")}</div>
                <p className="text-gray-600 mt-2">{transactions.length} transaksi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Diskon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">Rp {totalDiscountGiven.toLocaleString("id-ID")}</div>
                <p className="text-gray-600 mt-2">Diskon yang diberikan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Penjualan Kotor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">Rp {totalSubtotal.toLocaleString("id-ID")}</div>
                <p className="text-gray-600 mt-2">Sebelum diskon</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Penjualan per Kategori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Makanan</span>
                  <span className="text-green-600 font-bold">Rp {categoryStats.Makanan.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Minuman</span>
                  <span className="text-green-600 font-bold">Rp {categoryStats.Minuman.toLocaleString("id-ID")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Penjualan per Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(paymentStats)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([method, stats]) => (
                      <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm capitalize">{method}</p>
                          <p className="text-xs text-gray-600">{stats.count} transaksi</p>
                        </div>
                        <span className="text-green-600 font-bold text-sm">
                          Rp {stats.revenue.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  {Object.keys(paymentStats).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Belum ada data pembayaran</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Penjualan per Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(menuStats)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)
                  .map(([menuName, stats]) => (
                    <div key={menuName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{menuName}</p>
                        <p className="text-xs text-gray-600">{stats.quantity} terjual</p>
                      </div>
                      <span className="text-green-600 font-bold text-sm">
                        Rp {stats.revenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                {Object.keys(menuStats).length === 0 && (
                  <p className="text-gray-500 text-center py-4">Belum ada data penjualan</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Maharasa POS</h1>
              <p className="text-gray-600">Sistem Point of Sale untuk Restoran</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setCurrentView("reports")} className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Laporan
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
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
                    className="mb-2"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {product.category}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-green-600">
                            Rp {product.price.toLocaleString("id-ID")}
                          </span>
                          <Button onClick={() => addToCart(product)} size="sm" className="text-xs px-2 py-1 h-7">
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
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-600">Rp {item.price.toLocaleString("id-ID")}</p>
                              {item.selectedAddOns.length > 0 && (
                                <div className="mt-1">
                                  {item.selectedAddOns.map((addOn) => (
                                    <p key={addOn.id} className="text-xs text-blue-600">
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

                    <div className="border-t pt-4">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Subtotal:</span>
                          <span className="text-sm">Rp {subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        {discount && (
                          <div className="flex justify-between items-center text-red-600">
                            <span className="text-sm">
                              Diskon (
                              {discount.type === "percentage"
                                ? `${discount.value}%`
                                : `Rp ${discount.value.toLocaleString("id-ID")}`}
                              ):
                            </span>
                            <span className="text-sm">-Rp {discountAmount.toLocaleString("id-ID")}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-lg font-bold">Total:</span>
                          <span className="text-xl font-bold text-green-600">Rp {total.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                      <Button className="w-full" size="lg" onClick={handlePayment}>
                        Bayar Sekarang
                      </Button>
                    </div>
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

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Diskon:</span>
                    <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <p className="text-sm text-gray-600">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-green-600">Rp {total.toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded">
                <h4 className="font-medium mb-3 flex items-center gap-2">
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
                        <Label htmlFor="percentage">Persentase (%)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed" id="fixed" />
                        <Label htmlFor="fixed">Nominal (Rp)</Label>
                      </div>
                    </RadioGroup>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={discountType === "percentage" ? "Masukkan %" : "Masukkan nominal"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={applyDiscount} size="sm" disabled={!discountValue}>
                        Terapkan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Diskon{" "}
                      {discount.type === "percentage"
                        ? `${discount.value}%`
                        : `Rp ${discount.value.toLocaleString("id-ID")}`}{" "}
                      diterapkan
                    </span>
                    <Button onClick={removeDiscount} variant="outline" size="sm">
                      Hapus
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                  className="h-16 flex-col"
                >
                  <Banknote className="w-6 h-6 mb-1" />
                  <span className="text-sm">Cash</span>
                </Button>
                <Button
                  variant={paymentMethod === "debit" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("debit")}
                  className="h-16 flex-col"
                >
                  <CreditCard className="w-6 h-6 mb-1" />
                  <span className="text-sm">Debit</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === "qris" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("qris")}
                  className="h-16 flex-col"
                >
                  <Smartphone className="w-6 h-6 mb-1" />
                  <span className="text-sm">QRIS</span>
                </Button>
                <Button
                  variant={paymentMethod === "credit" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("credit")}
                  className="h-16 flex-col"
                >
                  <Wallet className="w-6 h-6 mb-1" />
                  <span className="text-sm">Credit Card</span>
                </Button>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cashAmount">Jumlah Uang Diterima</Label>
                    <Input
                      id="cashAmount"
                      type="number"
                      placeholder="Masukkan jumlah uang"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                    />
                  </div>
                  {cashAmount && Number.parseFloat(cashAmount) >= total && (
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-green-700">
                        Kembalian:{" "}
                        <span className="font-bold">
                          Rp {(Number.parseFloat(cashAmount) - total).toLocaleString("id-ID")}
                        </span>
                      </p>
                    </div>
                  )}
                  {cashAmount && Number.parseFloat(cashAmount) < total && (
                    <div className="p-3 bg-red-50 rounded">
                      <p className="text-sm text-red-700">
                        Uang tidak mencukupi! Kurang:{" "}
                        <span className="font-bold">
                          Rp {(total - Number.parseFloat(cashAmount)).toLocaleString("id-ID")}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="flex-1">
                  Batal
                </Button>
                <Button
                  onClick={processPayment}
                  className="flex-1"
                  disabled={
                    !paymentMethod ||
                    (paymentMethod === "cash" && (!cashAmount || Number.parseFloat(cashAmount) < total))
                  }
                >
                  Proses Pembayaran
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
