<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Header -->
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-red-600">🍔 Resto POS</h1>
      <button class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
    </header>

    <!-- Main Layout: 2 Columns -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Menu Section (2/3 width) -->
      <section class="lg:col-span-2">
        <h2 class="text-xl font-semibold mb-4">📋 Menu</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
         <button
                v-for="item in menu"
                :key="item.id"
                @click="add(item)"
                class="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold p-4 rounded shadow"
                >
            <div class="text-lg">{{ item.name }}</div>
            <div class="text-sm">Rp{{ item.price }}</div>
          </button>
        </div>
      </section>
 
      <!-- Cart Section -->
            <aside class="bg-white p-4 rounded shadow h-full sticky top-6">
            <h2 class="text-xl font-semibold mb-4">🛒 Keranjang</h2>
            <ul class="divide-y divide-gray-200 mb-4">
                <li v-for="item in cart.items" :key="item.id" class="py-2">
                <div class="flex justify-between items-center">
                    <div>
                    <div>{{ item.name }}</div>
                    <div class="text-sm text-gray-500">
                        <span v-if="item.topping">+ {{ item.topping.name }}</span>,
                        <span v-if="item.sugar">Gula: {{ item.sugar }}</span>
                    </div>
                    </div>
                    <div class="text-right">
                    <div>Rp{{ item.total }}</div>
                    <div class="flex items-center gap-1 mt-1">
                        <button
                        @click="decreaseQty(item)"
                        class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >−</button>
                        <span class="px-2">{{ item.qty }}</span>
                        <button
                        @click="increaseQty(item)"
                        class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >+</button>
                    </div>
                    </div>
                </div>
                </li>
            </ul>
            <p class="text-lg font-bold mb-4">Total: Rp{{ cart.total }}</p> 
            <button
                @click="pembayaranDialogOpen = true"
                class="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
                >
                Bayar Sekarang
                </button>
            </aside>
    </div>

    
    <!-- Dialog -->
    <div v-if="dialogOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">{{ selectedItem.name }} - Rp{{ selectedItem.price }}</h3>
            <!-- Topping -->
            <div v-if="selectedItem.options?.toppings" class="mb-4">
            <label class="block font-semibold mb-2">Topping (opsional)</label>
            <select v-model="selectedTopping" class="w-full border rounded p-2">
                <option :value="null">Tanpa topping</option>
                <option
                v-for="top in selectedItem.options.toppings"
                :key="top.name"
                :value="top"
                >
                {{ top.name }} (+Rp{{ top.price }})
                </option>
            </select>
            </div>

            <!-- Gula -->
            <div v-if="selectedItem.options?.sugarLevels" class="mb-4">
            <label class="block font-semibold mb-2">Tingkat Gula</label>
            <select v-model="selectedSugar" class="w-full border rounded p-2">
                <option
                v-for="level in selectedItem.options.sugarLevels"
                :key="level"
                :value="level"
                >
                {{ level }}
                </option>
            </select>
            </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button @click="dialogOpen = false" class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Batal</button>
          <button @click="addToCart" class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog Pembayaran -->
    <div
    v-if="pembayaranDialogOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
    <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">💳 Metode Pembayaran</h3>

        <div class="grid grid-cols-3 gap-3 mb-4">
        <button
            v-for="method in metodeList"
            :key="method"
            @click="metodePembayaran = method"
            :class="[
            'p-3 rounded font-semibold shadow',
            metodePembayaran === method
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            ]"
        >
            {{ method }}
        </button>
        </div>

        <div v-if="metodePembayaran === 'Tunai'" class="mb-4">
        <label class="block font-semibold mb-2">Uang Dibayar</label>
        <input
            type="number"
            v-model="uangDibayar"
            class="w-full border rounded p-2"
            placeholder="Masukkan jumlah uang"
        />
        <p v-if="uangDibayar < cart.total" class="text-red-500 mt-2">Uang kurang!</p>
        </div>

        <div class="flex justify-end gap-2">
        <button
            @click="pembayaranDialogOpen = false"
            class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
        >
            Batal
        </button>
        <button
            @click="prosesPembayaran"
            :disabled="metodePembayaran === null || (metodePembayaran === 'Tunai' && uangDibayar < cart.total)"
            class="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
        >
            Konfirmasi
        </button>
        </div>
    </div>
    </div>
    <!-- Footer -->
    <footer class="mt-6 text-center text-gray-500">
      <p>&copy; 2025 Budi Priyo Utomo POS. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from '~/store/cart' 

const pembayaranDialogOpen = ref(false)
const metodePembayaran = ref(null)
const metodeList = ['Tunai', 'QRIS', 'Debit']
const uangDibayar = ref(0)

const cart = useCartStore()
const dialogOpen = ref(false)
const selectedItem = ref(null)
const selectedTopping = ref(null)
const selectedSugar = ref('Normal')

const menu = [
  {
    id: 1,
    name: 'Coconut Delights Original Large',
    price: 15000,
    options: {
      toppings: [
        { name: 'Pandan', price: 1000 },
        { name: 'Boba', price: 2000 },
        { name: 'Nangka', price: 1500 },
      ],
      sugarLevels: ['Less Sweet', 'Normal', 'Extra Sweet'],
    },
  },
  {
    id: 2,
    name: 'Coconut Delights Original Large No Add Ons',
    price: 16000, 
  },
  {
    id: 3,
    name: 'Coconut Delights Original Large No Add Ons',
    price: 16000, 
  },
  {
    id: 4,
    name: 'Coconut Delights Original Large No Add Ons',
    price: 16000, 
  },
  {
    id: 5,
    name: 'Coconut Delights Original Large No Add Ons',
    price: 16000, 
  },
  {
    id: 6,
    name: 'Coconut Delights Original Large No Add Ons',
    price: 16000, 
  },
]

function openDialog(item) {
  selectedItem.value = item
  selectedTopping.value = null
  selectedSugar.value = item.options?.sugarLevels?.[0] || null
  dialogOpen.value = true
}

function add(item) {
  if (item.options?.toppings || item.options?.sugarLevels) {
    openDialog(item)
  } else {
    cart.addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      total: item.price,
    })
  }
}

function addToCart() {
  const base = selectedItem.value.price
  const toppingPrice = selectedTopping.value ? selectedTopping.value.price : 0
  const total = base + toppingPrice

  cart.addItem({
    id: selectedItem.value.id,
    name: selectedItem.value.name,
    price: base,
    topping: selectedTopping.value,
    sugar: selectedSugar.value,
    qty: 1,
    total,
  })

  dialogOpen.value = false
}
 
function checkout() {
  tahap.value = 'pembayaran'
}


function increaseQty(item) {
  item.qty++
  item.total = (item.price + (item.topping?.price || 0)) * item.qty
  cart.recalculateTotal()
}

function decreaseQty(item) {
  if (item.qty > 1) {
    item.qty--
    item.total = (item.price + (item.topping?.price || 0)) * item.qty
    cart.recalculateTotal()
  } else {
    cart.removeItem(item.id)
  }
}

function prosesPembayaran() {
  alert(`Pembayaran berhasil dengan metode: ${metodePembayaran.value}`)
  cart.clearCart()
  tahap.value = 'menu'
  metodePembayaran.value = null
  uangDibayar.value = 0
}
</script>
