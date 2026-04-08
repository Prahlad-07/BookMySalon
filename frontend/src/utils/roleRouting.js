const normalizeRoleToken = (value) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, '')
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z_]/g, '');

  if (!normalized) return '';
  if (normalized.includes('ADMIN')) return 'ADMIN';
  if (normalized.includes('SALON') && normalized.includes('OWNER')) return 'SALON_OWNER';
  if (normalized.includes('CUSTOMER') || normalized === 'USER') return 'CUSTOMER';
  return normalized;
};

const normalizeRole = (role) => {
  const tokens = String(role || '')
    .split(/[\s,;|()[\]{}]+/)
    .map(normalizeRoleToken)
    .filter(Boolean);

  for (const token of tokens) {
    if (token === 'ADMIN' || token === 'SALON_OWNER' || token === 'CUSTOMER') {
      return token;
    }
  }

  return 'CUSTOMER';
};

export const getDashboardPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'ADMIN') {
    return '/admin/dashboard';
  }

  if (normalizedRole === 'SALON_OWNER') {
    return '/salon/dashboard';
  }

  return '/customer/dashboard';
};

export const canAccessCustomerRoute = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'CUSTOMER' || normalizedRole === 'SALON_OWNER';
};

export const canAccessSalonOwnerRoute = (role) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'SALON_OWNER' || normalizedRole === 'ADMIN';
};

export const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'ADMIN') {
    return 'ADMIN';
  }

  if (normalizedRole === 'SALON_OWNER') {
    return 'SALON_OWNER';
  }

  return 'CUSTOMER';
};
