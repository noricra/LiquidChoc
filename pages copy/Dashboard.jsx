import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import useMerchantStore from '../store/useMerchantStore'
import client from '../api/client'

const TrendUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const DollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const FireIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
)

export default function Dashboard() {
  const { merchant, stats, fetchMerchant, loading } = useMerchantStore()
  const [salesData, setSalesData] = useState({ today: 0, week: 0, pending: 0 })
  const [liquidationsData, setLiquidationsData] = useState({ active: 0, total: 0 })

  useEffect(() => {
    fetchMerchant()
  }, [fetchMerchant])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [salesRes, liquidationsRes] = await Promise.all([
          client.get('/sales'),
          client.get('/liquidations')
        ])

        // Calculate today's revenue
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
        setLiquidationsData({
          active: liquidations.filter(l => l.status === 'active').length,
          total: liquidations.length
        })
      } catch (e) {
        console.error('fetch dashboard data failed', e)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading && !merchant) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <Header />
        <main className="px-6 pt-6 pb-28 max-w-2xl mx-auto">
          <div className="grid gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  const cards = [
    {
      title: "Revenu aujourd'hui",
      value: `$${salesData.today.toFixed(2)}`,
      icon: DollarIcon,
      color: '#06D6A0',
      bgColor: '#06D6A015'
    },
    {
      title: 'Revenu 7 jours',
      value: `$${salesData.week.toFixed(2)}`,
      icon: TrendUpIcon,
      color: 'var(--primary-color)',
      bgColor: 'var(--primary-color)15'
    },
    {
      title: 'Commandes en attente',
      value: salesData.pending,
      icon: BoxIcon,
      color: '#FF6B35',
      bgColor: '#FF6B3515'
    },
    {
      title: 'Liquidations actives',
      value: liquidationsData.active,
      icon: FireIcon,
      color: '#EF476F',
      bgColor: '#EF476F15'
    }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <Header />

      <main className="px-6 pt-6 pb-28 max-w-2xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Tableau de bord</h1>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            Bienvenue, {merchant?.businessName || 'Marchand'}
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid gap-4 mb-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300"
              style={{
                backgroundColor: 'var(--card-color)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <span style={{ color: card.color }}>
                    <card.icon />
                  </span>
                </div>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                {card.title}
              </p>
              <p className="text-3xl font-black" style={{ color: 'var(--text-color)' }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="rounded-2xl p-6 shadow-md" style={{ backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)' }}>
          <h2 className="font-black text-lg mb-4">Statistiques globales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total abonnés</p>
              <p className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>{stats?.subscribers || 0}</p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total produits</p>
              <p className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>{merchant?.templates?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Total liquidations</p>
              <p className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>{liquidationsData.total}</p>
            </div>
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Revenu total</p>
              <p className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
