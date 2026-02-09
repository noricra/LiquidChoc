const config = require('./env')

/**
 * BACKEND CAMÉLÉON : Configuration spécifique par secteur
 *
 * Chaque secteur a ses propres :
 * - Templates par défaut (small/medium/large)
 * - Textes SMS personnalisés
 * - Durée de validité des liquidations
 * - Logique métier spécifique
 */

const SECTOR_CONFIGS = {
  // ════════════════════════════════════════════════════════════
  // FOOD : Restaurants, Pâtisseries, Épiceries
  // ════════════════════════════════════════════════════════════
  food: {
    name: 'Food',
    emoji: '🍽️',

    // Templates par défaut
    templates: {
      small: {
        name: 'Petit Lot',
        originalPrice: 25,
        discountedPrice: 15,
        discountPercent: 40,
        quantity: 10,
        productDescription: 'Boîtes surprise du jour'
      },
      medium: {
        name: 'Lot Moyen',
        originalPrice: 25,
        discountedPrice: 12.5,
        discountPercent: 50,
        quantity: 20,
        productDescription: 'Boîtes surprise du jour'
      },
      large: {
        name: 'Gros Lot',
        originalPrice: 25,
        discountedPrice: 10,
        discountPercent: 60,
        quantity: 50,
        productDescription: 'Boîtes surprise du jour'
      }
    },

    // Durée de validité des liquidations (en heures)
    liquidationDuration: 4,

    // Durée de pickup après achat (en heures)
    pickupDuration: 2,

    // Templates SMS personnalisés
    sms: {
      liquidation: (data) => `LIQUIDACHOC: ${data.productDescription} dispo (-${data.discountPercent}%)! ${data.discountedPrice}$ au lieu de ${data.originalPrice}$. Stock: ${data.quantity}. Voir: ${data.liquidationUrl} (STOP=Desabo)`,

      confirmation: (data) => `Commande OK! Code: ${data.pickupCode}. Pickup: ${data.address} avant ${data.expiresAt}. Merci!`,

      welcome: (data) => `Bienvenue! Vous recevrez nos offres flash. STOP pour se desabonner.`
    }
  },

  // ════════════════════════════════════════════════════════════
  // GAMES : Salles de jeux, Arcades, Escape Games
  // ════════════════════════════════════════════════════════════
  games: {
    name: 'Games',
    emoji: '🎮',

    templates: {
      small: {
        name: 'Session Courte',
        originalPrice: 30,
        discountedPrice: 18,
        discountPercent: 40,
        quantity: 10,
        productDescription: 'Session de jeu 1h'
      },
      medium: {
        name: 'Session Standard',
        originalPrice: 50,
        discountedPrice: 25,
        discountPercent: 50,
        quantity: 20,
        productDescription: 'Session de jeu 2h'
      },
      large: {
        name: 'Session VIP',
        originalPrice: 80,
        discountedPrice: 32,
        discountPercent: 60,
        quantity: 50,
        productDescription: 'Session de jeu 3h + bonus'
      }
    },

    liquidationDuration: 6,
    pickupDuration: 24,

    sms: {
      liquidation: (data) => `LIQUIDACHOC: ${data.productDescription} dispo (-${data.discountPercent}%)! ${data.discountedPrice}$ au lieu de ${data.originalPrice}$. Places: ${data.quantity}. Voir: ${data.liquidationUrl} (STOP=Desabo)`,

      confirmation: (data) => `Reservation OK! Code: ${data.pickupCode}. Acces: ${data.address} avant ${data.expiresAt}. Bon jeu!`,

      welcome: (data) => `Bienvenue! Vous recevrez nos offres flash. STOP pour se desabonner.`
    }
  },

  // ════════════════════════════════════════════════════════════
  // SERVICES : Salons, Spas, Coiffeurs, etc.
  // ════════════════════════════════════════════════════════════
  services: {
    name: 'Services',
    emoji: '✨',

    templates: {
      small: {
        name: 'Service Express',
        originalPrice: 40,
        discountedPrice: 24,
        discountPercent: 40,
        quantity: 10,
        productDescription: 'Prestation express'
      },
      medium: {
        name: 'Service Standard',
        originalPrice: 60,
        discountedPrice: 30,
        discountPercent: 50,
        quantity: 20,
        productDescription: 'Prestation complète'
      },
      large: {
        name: 'Service Premium',
        originalPrice: 100,
        discountedPrice: 40,
        discountPercent: 60,
        quantity: 50,
        productDescription: 'Forfait premium'
      }
    },

    liquidationDuration: 12,
    pickupDuration: 48,

    sms: {
      liquidation: (data) => `LIQUIDACHOC: ${data.productDescription} dispo (-${data.discountPercent}%)! ${data.discountedPrice}$ au lieu de ${data.originalPrice}$. Creneaux: ${data.quantity}. Voir: ${data.liquidationUrl} (STOP=Desabo)`,

      confirmation: (data) => `Reservation OK! Code: ${data.pickupCode}. Rendez-vous: ${data.address} avant ${data.expiresAt}. A bientot!`,

      welcome: (data) => `Bienvenue! Vous recevrez nos offres exclusives. STOP pour se desabonner.`
    }
  }
}

/**
 * Récupère la config du secteur actuel
 */
const getSectorConfig = () => {
  const sectorConfig = SECTOR_CONFIGS[config.sector]

  if (!sectorConfig) {
    throw new Error(`Unknown sector: ${config.sector}`)
  }

  return {
    ...sectorConfig,
    // Inject branding from env
    businessName: config.branding.businessName,
    address: config.merchant.address,
    pickupHours: config.merchant.pickupHours
  }
}

/**
 * Génère un message SMS en fonction du secteur et du type
 */
const generateSMS = (type, data) => {
  const sectorConfig = getSectorConfig()
  const template = sectorConfig.sms[type]

  if (!template) {
    throw new Error(`Unknown SMS type: ${type}`)
  }

  return template({
    ...data,
    businessName: sectorConfig.businessName,
    address: sectorConfig.address
  })
}

module.exports = {
  SECTOR_CONFIGS,
  getSectorConfig,
  generateSMS
}
