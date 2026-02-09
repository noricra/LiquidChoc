import React, { useState, useRef } from 'react'
import { X, Upload, Camera } from 'lucide-react'
import client from '../api/client'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export default function ProfilePictureModal({ merchant, onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier taille
    if (file.size > MAX_SIZE) {
      setError('Image trop volumineuse (max 5MB)')
      return
    }

    // Vérifier type
    if (!file.type.startsWith('image/')) {
      setError('Fichier invalide (image requise)')
      return
    }

    setError('')

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')

      const { data } = await client.post('/merchant/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      onSuccess(data.profileImageUrl)
      onClose()
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err.response?.data?.error || 'Erreur upload')
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal - max height pour éviter débordement */}
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Photo de profil</h2>
            <p className="text-xs text-gray-500 font-medium">Max 5MB</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Preview actuel ou placeholder */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              {preview || merchant?.profileImageUrl ? (
                <img
                  src={preview || merchant.profileImageUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#006644] to-[#004d33] flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-5xl">
                    {merchant?.businessName?.[0]?.toUpperCase() || 'L'}
                  </span>
                </div>
              )}

              {/* Badge Camera */}
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#006644] flex items-center justify-center shadow-lg border-4 border-white">
                <Camera size={18} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3.5 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-700 font-bold text-sm hover:bg-gray-100 hover:border-gray-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>Upload en cours...</>
            ) : (
              <>
                <Upload size={18} strokeWidth={2.5} />
                Choisir une photo
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
