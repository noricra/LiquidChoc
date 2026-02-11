import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, Flame, ShoppingBag, Users, Grid2X2 } from 'lucide-react'
import Header from '../components/Header'
import useMerchantStore from '../store/useMerchantStore'
import client from '../api/client'

export default function Dashboard() {
  const { merchant, stats, fetchMerchant, loading } = useMerchantStore()
  const [salesData, setSalesData] = useState({ today: 0, week: 0, pending: 0 })
  const [liquidationsData, setLiquidationsData] = useState({ active: 0, total: 0 })
  const [error, setError] = useState(null)

  // Initialisation
  useEffect(() => {
    fetchMerchant()
  }, [fetchMerchant])

  // Récupération des données temps réel
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [salesRes, liquidationsRes] = await Promise.all([
          client.get('/sales'),
          client.get('/liquidations')
        ])

        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const allSales = [...(salesRes.data.pending || []), ...(salesRes.data.history || [])]

        const todayRevenue = allSales
          .filter(s => new Date(s.createdAt) >= todayStart)
          .reduce((sum, s) => sum + (s.amount || 0), 0)

        const weekRevenue = allSales
          .filter(s => new Date(s.createdAt) >= weekStart)
          .reduce((sum, s) => sum + (s.amount || 0), 0)

        setSalesData({
          today: todayRevenue,
          week: weekRevenue,
          pending: salesRes.data.pending?.length || 0
        })

        const liquidations = liquidationsRes.data.liquidations || []
        const nonCancelled = liquidations.filter(l => l.status !== 'cancelled')
        setLiquidationsData({
          active: nonCancelled.filter(l => l.status === 'active').length,
          total: nonCancelled.length
        })
      } catch (e) {
        console.error('Erreur chargement dashboard', e)
        setError('Impossible de charger les données. Veuillez réessayer.')
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Squelette chargement
  if (loading && !merchant) {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <Header />
        <main className="px-5 pt-6 max-w-2xl mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Header />

      <main className="px-5 pt-6 max-w-2xl mx-auto">

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            Tableau de bord
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Vue d'ensemble de votre activité
          </p>
        </div>

        {/* Bento Grid - Premium Layout */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Card 1: Ventes du jour (LARGE - 2 colonnes) */}
          <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 active:scale-[0.98] transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#006644]/10 flex items-center justify-center">
                <DollarSign size={24} className="text-[#006644]" strokeWidth={2.5} />
              </div>
              <span className="px-3 py-1 bg-green-50 text-[#006644] text-xs font-bold rounded-full">
                Aujourd'hui
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Revenus du jour
            </p>
            <p className="text-4xl font-black text-gray-900">
              ${salesData.today.toFixed(2)}
            </p>
          </div>

          {/* Card 2: Commandes en attente */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <ShoppingBag size={20} className="text-orange-500" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              À préparer
            </p>
            <p className="text-3xl font-black text-gray-900">
              {salesData.pending}
            </p>
          </div>

          {/* Card 3: Liquidations actives */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
              <Flame size={20} className="text-red-500" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Actives
            </p>
            <p className="text-3xl font-black text-gray-900">
              {liquidationsData.active}
            </p>
          </div>

          {/* Card 4: Revenu 7 jours (MEDIUM) */}
          <div className="col-span-2 bg-gradient-to-br from-[#006644] to-[#004d33] rounded-2xl p-6 shadow-md active:scale-[0.98] transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={24} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-2">
              Revenus 7 derniers jours
            </p>
            <p className="text-4xl font-black text-white">
              ${salesData.week.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Stats Globales */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package size={16} className="text-gray-600" strokeWidth={2.5} />
            </div>
            Statistiques globales
          </h2>

          <div className="space-y-4">
            {/* Abonnés */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users size={18} className="text-blue-500" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-gray-600">Abonnés SMS</span>
              </div>
              <span className="text-2xl font-black text-gray-900">{stats?.subscribers || 0}</span>
            </div>

            {/* Produits au catalogue */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Grid2X2 size={18} className="text-purple-500" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-gray-600">Produits catalogue</span>
              </div>
              <span className="text-2xl font-black text-gray-900">{merchant?.templates?.length || 0}</span>
            </div>

            {/* Revenu total vie */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign size={18} className="text-[#006644]" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-gray-600">Revenu total</span>
              </div>
              <span className="text-2xl font-black text-[#006644]">
                ${stats?.totalRevenue?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
