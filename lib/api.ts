const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// API Response types
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
    role: string
  }
}

interface Product {
  id: number
  name: string
  price: number
  category: string
  image: string
  add_ons?: AddOn[]
}

interface AddOn {
  id: number
  name: string
  price: number
}

interface CartItem extends Product {
  quantity: number
  selected_add_ons: AddOn[]
  notes: string
}

interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  discount?: {
    type: "percentage" | "fixed"
    value: number
  }
  discount_amount: number
  total: number
  payment_method: string
  timestamp: string
}

interface SalesReport {
  total_revenue: number
  total_transactions: number
  category_sales: {
    category: string
    total: number
    count: number
  }[]
  menu_sales: {
    product_id: number
    product_name: string
    quantity_sold: number
    total_revenue: number
  }[]
  payment_method_sales: {
    method: string
    total: number
    count: number
  }[]
}

class ApiService {
  private token: string | null = null

  constructor() {
    // Get token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "API request failed")
      }

      return data
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  }

  // Authentication
  async login(pin: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ pin }),
    })

    if (response.success && response.data.token) {
      this.token = response.data.token
      localStorage.setItem("auth_token", this.token)
    }

    return response.data
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", {
        method: "POST",
      })
    } finally {
      this.token = null
      localStorage.removeItem("auth_token")
    }
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await this.request<Product[]>("/products")
    return response.data
  }

  async getProductById(id: number): Promise<Product> {
    const response = await this.request<Product>(`/products/${id}`)
    return response.data
  }

  // Transactions
  async createTransaction(transactionData: {
    items: CartItem[]
    subtotal: number
    discount?: {
      type: "percentage" | "fixed"
      value: number
    }
    discount_amount: number
    total: number
    payment_method: string
  }): Promise<Transaction> {
    const response = await this.request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    })
    return response.data
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await this.request<Transaction[]>("/transactions")
    return response.data
  }

  // Reports
  async getSalesReport(startDate?: string, endDate?: string): Promise<SalesReport> {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)

    const endpoint = `/reports/sales${params.toString() ? `?${params.toString()}` : ""}`
    const response = await this.request<SalesReport>(endpoint)
    return response.data
  }

  // Payment Methods
  async getPaymentMethods(): Promise<any[]> {
    const response = await this.request<any[]>("/payment-methods")
    return response.data
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }

  // Get current token
  getToken(): string | null {
    return this.token
  }
}

// Export singleton instance
export const apiService = new ApiService()
export type { Product, AddOn, CartItem, Transaction, SalesReport, ApiResponse }
