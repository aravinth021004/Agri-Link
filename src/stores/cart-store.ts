import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  quantity: number
  deliveryOption: 'HOME_DELIVERY' | 'FARM_PICKUP' | 'MEETUP_POINT'
  product: {
    id: string
    title: string
    price: number
    unit: string
    mediaUrls: string[]
    farmerId: string
    farmer: {
      id: string
      fullName: string
    }
  }
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateDeliveryOption: (itemId: string, option: 'HOME_DELIVERY' | 'FARM_PICKUP' | 'MEETUP_POINT') => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getItemCount: () => number
  getTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(i => i.productId === item.productId)
          if (existingIndex >= 0) {
            const updated = [...state.items]
            updated[existingIndex] = item
            return { items: updated }
          }
          return { items: [...state.items, item] }
        })
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter(i => i.id !== itemId)
        }))
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
        }))
      },

      updateDeliveryOption: (itemId, option) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, deliveryOption: option } : item
          )
        }))
      },

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotal: () => get().items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      ),
    }),
    {
      name: 'agrilink-cart',
    }
  )
)
