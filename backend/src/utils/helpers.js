/**
 * Utilitaires globaux
 */

/**
 * Génère un code de pickup unique (format: LQ-XXXXXX)
 * Charset sans ambiguïté (pas de I/O/0/1)
 */
function generatePickupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'LQ-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Convertit un numéro de téléphone en format E.164
 * Ex: 5141234567 → +15141234567
 */
function toE164(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return phone
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(date) {
  return new Date(date).toLocaleString('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Calcule le pourcentage de réduction
 */
function calculateDiscount(regularPrice, liquidaPrice) {
  return Math.round(((regularPrice - liquidaPrice) / regularPrice) * 100)
}

module.exports = {
  generatePickupCode,
  toE164,
  formatDate,
  calculateDiscount
}
