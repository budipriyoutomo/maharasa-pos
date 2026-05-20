"use client"

import { useState, useEffect, useCallback } from "react"
import { apiService, type Product, type Transaction, type SalesReport } from "@/lib/api"

// Hook for authentication
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsAuthenticated(apiService.isAuthenticated())
    setIsLoading(false)
  }, [])

  const login = useCallback(async (pin: string) => {
    try {
      await apiService.login(pin)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiService.logout()
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
      // Force logout even if API call fails
      setIsAuthenticated(false)
    }
  }, [])

  return { isAuthenticated, isLoading, login, logout }
}

// Hook for products
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiService.getProducts()
      setProducts(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch products")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, isLoading, error, refetch: fetchProducts }
}

// Hook for transactions
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiService.getTransactions()
      setTransactions(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch transactions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTransaction = useCallback(async (transactionData: any) => {
    try {
      const newTransaction = await apiService.createTransaction(transactionData)
      setTransactions((prev) => [...prev, newTransaction])
      return { success: true, data: newTransaction }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create transaction" }
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return { transactions, isLoading, error, createTransaction, refetch: fetchTransactions }
}

// Hook for sales reports
export function useSalesReport() {
  const [report, setReport] = useState<SalesReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiService.getSalesReport(startDate, endDate)
      setReport(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch sales report")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { report, isLoading, error, fetchReport }
}
