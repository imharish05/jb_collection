export const getAdminPermissions = () => {
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    return adminUser?.permissions || [];
  } catch (e) {
    return [];
  }
};

export const hasPermission = (reqPerm) => {
  const permissions = getAdminPermissions();
  if (!permissions) return false;
  if (permissions.includes('*') || permissions.includes('super_admin')) return true;
  return permissions.includes(reqPerm);
};
