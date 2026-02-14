import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import client from '../api/client'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await client.post('/login', { password })
      localStorage.setItem('token', data.token)
      navigate('/')
    } catch (err) {
      setError('Mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006644] to-[#004d33] flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#006644]/10 flex items-center justify-center">
              <Lock size={32} className="text-[#006644]" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">
            Connexion Admin
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Entrez votre mot de passe pour accéder au tableau de bord
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#006644] focus:bg-white transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-[#006644] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/70 text-xs mt-6">
          LiquidaChoc Admin Panel
        </p>
      </div>
    </div>
  )
}
