import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as {
      id: number
      name: string
      price: number
      qty: number
      topping?: { name: string; price: number }
      sugar?: string
      total: number
    }[],
  }),

  getters: {
    total: (state) => state.items.reduce((sum, item) => sum + item.total, 0),
  },

  actions: {
    addItem(item) {
      const itemKey = JSON.stringify({
        id: item.id,
        topping: item.topping?.name || '',
        sugar: item.sugar || '',
      })

      const existing = this.items.find(i => {
        const existingKey = JSON.stringify({
          id: i.id,
          topping: i.topping?.name || '',
          sugar: i.sugar || '',
        })
        return existingKey === itemKey
      })

      if (existing) {
        existing.qty += 1
        existing.total = (existing.price + (existing.topping?.price || 0)) * existing.qty
      } else {
        const toppingPrice = item.topping?.price || 0
        const total = (item.price + toppingPrice) * item.qty
        this.items.push({ ...item, total })
      }
    },
    increaseQty(item) {
      item.qty += 1
      item.total = (item.price + (item.topping?.price || 0)) * item.qty
    },

    decreaseQty(item) {
      if (item.qty > 1) {
        item.qty -= 1
        item.total = (item.price + (item.topping?.price || 0)) * item.qty
      } else {
        this.removeItem(item)
      }
    },

    removeItem(target) {
      this.items = this.items.filter(item => item !== target)
    },

    clearCart() {
      this.items = []
    },
  },
})
