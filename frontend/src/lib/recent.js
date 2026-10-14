/** "Recently viewed" salons, kept per browser (no account needed). */
const KEY = 'bms.recentSalons';
const MAX = 8;

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const recentSalons = () => read();

export const rememberSalon = (salon) => {
  if (!salon?.id) return;
  const card = {
    id: salon.id,
    name: salon.name,
    city: salon.city,
    address: salon.address,
    images: (salon.images || []).slice(0, 2),
    averageRating: salon.averageRating,
    reviewCount: salon.reviewCount,
    minPrice: salon.minPrice,
    serviceCount: salon.serviceCount,
    openTime: salon.openTime,
    closeTime: salon.closeTime,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify([card, ...read().filter((s) => s.id !== salon.id)].slice(0, MAX)));
  } catch {
    /* storage unavailable */
  }
};

export const clearRecentSalons = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
