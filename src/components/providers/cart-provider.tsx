"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"

import { CART_KEY } from "@/lib/constants"
import { type OrderItem, type Product } from "@/lib/types"

interface CartState {
  vendorId: string | null
  items: OrderItem[]
}

interface CartContextValue extends CartState {
  addItem: (vendorId: string, product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ vendorId: null, items: [] })

  useEffect(() => {
    const existing = window.localStorage.getItem(CART_KEY)
    if (existing) {
      setState(JSON.parse(existing) as CartState)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<CartContextValue>(() => {
    return {
      ...state,
      addItem(vendorId, product) {
        setState((current) => {
          const base =
            current.vendorId && current.vendorId !== vendorId
              ? { vendorId, items: [] }
              : { ...current, vendorId }

          const existing = base.items.find((item) => item.productId === product.id)
          if (existing) {
            return {
              ...base,
              items: base.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            }
          }

          return {
            ...base,
            items: [
              ...base.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
              }
            ]
          }
        })
      },
      removeItem(productId) {
        setState((current) => {
          const nextItems = current.items.filter((item) => item.productId !== productId)
          return {
            vendorId: nextItems.length ? current.vendorId : null,
            items: nextItems
          }
        })
      },
      updateQuantity(productId, quantity) {
        setState((current) => {
          const nextItems = current.items
            .map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            )
            .filter((item) => item.quantity > 0)

          return {
            vendorId: nextItems.length ? current.vendorId : null,
            items: nextItems
          }
        })
      },
      clearCart() {
        setState({ vendorId: null, items: [] })
      },
      subtotal: state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0)
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) {
    throw new Error("useCart must be used within CartProvider")
  }
  return value
}
