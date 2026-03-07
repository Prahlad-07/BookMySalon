const normalizeRole = (role) => String(role || '').trim().toUpperCase();

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
