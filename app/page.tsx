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
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { useAuth, useProducts, useTransactions, useSalesReport } from "@/hooks/use-api"
import type { Product, AddOn, CartItem } from "@/lib/api"

interface Discount {
  type: "percentage" | "fixed"
  value: number
}

const paymentMethods = {
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
  creditCard: [
    { id: "cc-visa", name: "Visa", icon: CreditCard, image: "/visa-logo-generic.png" },
    { id: "cc-mastercard", name: "Mastercard", icon: CreditCard, image: "/mastercard-logo.png" },
    { id: "cc-amex", name: "American Express", icon: CreditCard, image: "/american-express-logo.png" },
  ],
  voucher: [
    { id: "voucher-grabfood", name: "GrabFood Voucher", icon: Gift, image: "/grabfood-voucher.png" },
    { id: "voucher-gofood", name: "GoFood Voucher", icon: Gift, image: "/gofood-voucher.png" },
  ],
}

export default function MaharasaPOS() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth()
  const { products, isLoading: productsLoading, error: productsError } = useProducts()
  const { transactions, createTransaction } = useTransactions()
  const { report, isLoading: reportLoading, error: reportError, fetchReport } = useSalesReport()

  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [currentView, setCurrentView] = useState<"pos" | "reports">("pos")

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [notes, setNotes] = useState<string>("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [cashAmount, setCashAmount] = useState<string>("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const [discount, setDiscount] = useState<Discount | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("")

  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<string>("cash")
  const [showPaymentSection, setShowPaymentSection] = useState(false)

  const categories = ["Semua", ...Array.from(new Set(products.map((p) => p.category)))]

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const cartItem: CartItem = {
        ...product,
        quantity: 1,
        selected_add_ons: [],
        notes: "",
      }

      // Find existing item with same product, no add-ons, and no notes
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.selected_add_ons.length === 0 && item.notes === "",
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
    setSelectedAddOns([...item.selected_add_ons]) // Create a copy to avoid mutation
    setNotes(item.notes)
    setEditingCartIndex(index)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCartItem = () => {
    if (editingCartIndex !== null && selectedProduct) {
      setCart((prev) =>
        prev.map((item, index) =>
          index === editingCartIndex
            ? {
                ...item,
                selected_add_ons: [...selectedAddOns], // Create a copy
                notes: notes.trim(), // Trim whitespace
              }
            : item,
        ),
      )

      // Reset dialog state
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
        return [...prev, { ...addOn }] // Create a copy of the add-on
      }
    })
  }

  const updateQuantity = (index: number, change: number) => {
    setCart((prev) => {
      return prev
        .map((item, i) => {
          if (i === index) {
            const newQuantity = Math.max(0, item.quantity + change) // Ensure non-negative
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
          }
          return item
        })
        .filter((item): item is CartItem => item !== null) // Type-safe filter
    })
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Keranjang kosong!")
      return
    }
    setShowPaymentSection(true)
  }

  const subtotal = cart.reduce((sum, item) => {
    try {
      const addOnsTotal = item.selected_add_ons.reduce((addOnSum, addOn) => {
        return addOnSum + (addOn.price || 0) // Handle potential undefined prices
      }, 0)
      return sum + ((item.price || 0) + addOnsTotal) * (item.quantity || 1)
    } catch (error) {
      console.error("Error calculating subtotal for item:", item, error)
      return sum
    }
  }, 0)

  const calculateDiscountAmount = () => {
    if (!discount) return 0
    if (discount.type === "percentage") {
      return Math.min((subtotal * discount.value) / 100, subtotal) // Cap at subtotal
    }
    return Math.min(discount.value, subtotal) // Cap at subtotal
  }

  const discountAmount = calculateDiscountAmount()
  const total = Math.max(0, subtotal - discountAmount) // Ensure non-negative total

  const applyDiscount = () => {
    const value = Number.parseFloat(discountValue)
    if (isNaN(value) || value <= 0) {
      alert("Masukkan nilai diskon yang valid!")
      return
    }

    if (discountType === "percentage") {
      if (value > 100) {
        alert("Persentase diskon tidak boleh lebih dari 100%!")
        return
      }
    } else {
      if (value > subtotal) {
        alert("Diskon tidak boleh lebih besar dari subtotal!")
        return
      }
    }

    setDiscount({ type: discountType, value })
    setDiscountValue("") // Clear input after applying
  }

  const removeDiscount = () => {
    setDiscount(null)
    setDiscountValue("")
  }

  const handleReportsView = async () => {
    await fetchReport()
    setCurrentView("reports")
  }
    if (cart.length === 0) {
      alert("Keranjang kosong!")
      return
    }

    if (!paymentMethod) {
      alert("Pilih metode pembayaran!")
      return
    }

    // Validate cash payment
    if (paymentMethod === "cash") {
      const cash = Number.parseFloat(cashAmount)
      if (isNaN(cash) || cash < total) {
        alert("Jumlah pembayaran tidak boleh kurang dari total!")
        return
      }
    }

    setIsProcessingPayment(true)

    try {
      // Prepare transaction data for Laravel API
      const transactionData = {
        items: cart.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          selected_add_ons: item.selected_add_ons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: addon.price,
          })),
          notes: item.notes || "",
          category: item.category,
        })),
        subtotal: subtotal,
        discount: discount
          ? {
              type: discount.type,
              value: discount.value,
            }
          : null,
        discount_amount: discountAmount,
        total: total,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === "cash" ? Number.parseFloat(cashAmount) : null,
        change_amount: paymentMethod === "cash" ? getChange() : 0,
      }

      const result = await createTransaction(transactionData)

      if (result.success) {
        alert(`Pembayaran berhasil dengan metode ${paymentMethod}!`)

        // Clear all states after successful payment
        setCart([])
        setShowPaymentSection(false)
        setPaymentMethod("")
        setCashAmount("")
        setDiscount(null)
        setDiscountValue("")
        setSelectedPaymentCategory("cash")
      } else {
        throw new Error(result.error || "Pembayaran gagal")
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      alert(`Terjadi kesalahan saat memproses pembayaran: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const getChange = () => {
    if (paymentMethod !== "cash") return 0
    const cash = Number.parseFloat(cashAmount) || 0
    return Math.max(0, cash - total)
  }

  const filteredProducts =
    selectedCategory === "Semua" ? products : products.filter((p) => p.category === selectedCategory)

  const getSalesAnalytics = () => {
    const categoryStats = { Makanan: 0, Minuman: 0 }
    const menuStats: { [key: string]: { quantity: number; revenue: number } } = {}
    const paymentStats: { [key: string]: { count: number; revenue: number } } = {}
    let totalDiscountGiven = 0

    transactions.forEach((transaction) => {
      try {
        const paymentMethodKey = transaction.payment_method || "unknown"

        if (!paymentStats[paymentMethodKey]) {
          paymentStats[paymentMethodKey] = { count: 0, revenue: 0 }
        }
        paymentStats[paymentMethodKey].count++
        paymentStats[paymentMethodKey].revenue += transaction.total || 0

        totalDiscountGiven += transaction.discount_amount || 0

        transaction.items.forEach((item) => {
          try {
            const itemTotal =
              ((item.price || 0) + (item.selected_add_ons?.reduce((sum, addon) => sum + (addon.price || 0), 0) || 0)) *
              (item.quantity || 1)

            const category = item.category as keyof typeof categoryStats
            if (categoryStats[category] !== undefined) {
              categoryStats[category] += itemTotal
            }

            const menuName = item.name || "Unknown"
            if (!menuStats[menuName]) {
              menuStats[menuName] = { quantity: 0, revenue: 0 }
            }
            menuStats[menuName].quantity += item.quantity || 0
            menuStats[menuName].revenue += itemTotal
          } catch (itemError) {
            console.error("Error processing transaction item:", item, itemError)
          }
        })
      } catch (transactionError) {
        console.error("Error processing transaction:", transaction, transactionError)
      }
    })

    return { categoryStats, menuStats, paymentStats, totalDiscountGiven }
  }

  const { categoryStats, menuStats, paymentStats, totalDiscountGiven } = getSalesAnalytics()
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
  const totalSubtotal = transactions.reduce((sum, t) => sum + t.subtotal, 0)

  const handleLogout = () => {
    logout()
  }

  if (authLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">
            {authLoading ? "Memuat..." : productsLoading ? "Memuat menu..." : "Memuat..."}
          </p>
        </div>
      </div>
    )
  }

  if (productsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 mb-4">Gagal memuat menu: {productsError}</p>
          <Button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-800">
            Coba Lagi
          </Button>
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

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">
                  {selectedCategory === "Semua"
                    ? "Belum ada menu tersedia"
                    : `Tidak ada menu di kategori ${selectedCategory}`}
                </p>
              </div>
            ) : (
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
            )}
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
                        <div key={`${item.id}-${index}`} className="p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-slate-800">{item.name}</h4>
                              <p className="text-xs text-slate-600">Rp {item.price.toLocaleString("id-ID")}</p>
                              {item.selected_add_ons.length > 0 && (
                                <div className="mt-1">
                                  {item.selected_add_ons.map((addOn) => (
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
              {selectedProduct?.add_ons && selectedProduct.add_ons.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Add-On Tersedia:</h4>
                  <div className="space-y-2">
                    {selectedProduct.add_ons.map((addOn) => (
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
                                (item.add_ons?.reduce((sum, addon) => sum + addon.price, 0) || 0) * item.quantity
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
                        variant={selectedPaymentCategory === "creditCard" ? "default" : "outline"}
                        onClick={() => setSelectedPaymentCategory("creditCard")}
                        size="sm"
                        className={
                          selectedPaymentCategory === "creditCard"
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
                        paymentMethods.debit.map((method) => (
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
                        paymentMethods.qris.map((method) => (
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

                      {selectedPaymentCategory === "creditCard" &&
                        paymentMethods.creditCard.map((method) => (
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
                        paymentMethods.voucher.map((method) => (
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

                    {paymentMethod === "cash" && (
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="font-medium mb-3 text-slate-800">Jumlah Uang Tunai</h4>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Masukkan jumlah uang tunai"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            className="flex-1 border-slate-300"
                          />
                        </div>
                        {cashAmount && Number(cashAmount) >= total && (
                          <div className="mt-3">
                            <p className="text-sm text-emerald-600 font-medium">
                              Kembalian: Rp {(Number(cashAmount) - total).toLocaleString("id-ID")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-end">
                  <Button
                    onClick={processPayment}
                    disabled={!paymentMethod || (paymentMethod === "cash" && !cashAmount) || isProcessingPayment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memproses...
                      </div>
                    ) : (
                      "Bayar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Reports View */}
      {currentView === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">Maharasa POS</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleReportsView}
                variant="outline"
                className="gap-2 border-slate-300 hover:bg-slate-100"
              >
                <BarChart3 className="w-4 h-4" />
                Laporan
              </Button>
              <Button onClick={() => logout()} variant="outline" className="gap-2 border-red-300 hover:bg-red-50">
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Logout</span>
              </Button>
            </div>
          </div>
          </div>

          {reportError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-700">{reportError}</p>
              </CardContent>
            </Card>
          )}

          {reportLoading ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-600 mt-2">Memuat laporan...</p>
              </CardContent>
            </Card>
          ) : report ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Revenue */}
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="text-sm text-emerald-700">Total Pendapatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">
                    Rp {report.total_revenue.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">{report.total_transactions} transaksi</p>
                </CardContent>
              </Card>

              {/* Sales by Category */}
              <Card className="md:col-span-2 border-slate-200 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Penjualan Berdasarkan Kategori
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.category_sales.map((category) => (
                      <div key={category.category}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-700">{category.category}</span>
                          <span className="text-xs text-slate-600">({category.count} item)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{
                              width: `${(category.total / report.total_revenue) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-emerald-600 font-medium mt-1">
                          Rp {category.total.toLocaleString("id-ID")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sales by Payment Method */}
              <Card className="md:col-span-2 border-slate-200 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Penjualan Berdasarkan Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.payment_method_sales.map((method) => (
                      <div key={method.method} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800">{method.method}</p>
                            <p className="text-xs text-slate-600">({method.count} transaksi)</p>
                          </div>
                          <p className="font-bold text-emerald-600">Rp {method.total.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="md:col-span-3 border-slate-200 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Detail Penjualan Per Menu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 text-slate-600">Menu</th>
                          <th className="text-right py-2 px-2 text-slate-600">Qty</th>
                          <th className="text-right py-2 px-2 text-slate-600">Total Penjualan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.menu_sales.map((menu) => (
                          <tr key={menu.product_id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2 px-2 text-slate-800">{menu.product_name}</td>
                            <td className="text-right py-2 px-2 text-slate-700">{menu.quantity_sold}</td>
                            <td className="text-right py-2 px-2 font-medium text-emerald-600">
                              Rp {menu.total_revenue.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-8">
                <p className="text-slate-600">Tidak ada data laporan</p>
                <Button onClick={handleReportsView} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  Muat Ulang
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
