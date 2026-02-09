import { create } from 'zustand'
import client from '../api/client'

const useMerchantStore = create((set) => ({
  merchant: null,
  stats: null,
  loading: true,
  error: null,

  // Récupère merchant + stats depuis le backend
  fetchMerchant: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await client.get('/merchant')
      set({ merchant: data.merchant, stats: data.stats, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Met à jour les champs localement (après un PUT réussi)
  setMerchant: (merchant) => set({ merchant })
}))

export default useMerchantStore
