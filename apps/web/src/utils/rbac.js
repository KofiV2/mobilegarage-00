// Role-Based Access Control utilities

// Define permissions for each role
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',

  // Booking management
  VIEW_ALL_BOOKINGS: 'view_all_bookings',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  CREATE_BOOKING: 'create_booking',
  UPDATE_BOOKING: 'update_booking',
  CANCEL_BOOKING: 'cancel_booking',
  DELETE_BOOKING: 'delete_booking',

  // Service management
  VIEW_SERVICES: 'view_services',
  CREATE_SERVICE: 'create_service',
  UPDATE_SERVICE: 'update_service',
  DELETE_SERVICE: 'delete_service',

  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REVENUE: 'view_revenue',
  EXPORT_DATA: 'export_data',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  UPDATE_SETTINGS: 'update_settings',

  // Payments
  VIEW_PAYMENTS: 'view_payments',
  PROCESS_PAYMENT: 'process_payment',
  REFUND_PAYMENT: 'refund_payment',

  // Staff management
  VIEW_STAFF: 'view_staff',
  MANAGE_STAFF: 'manage_staff',

  // Audit logs
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

// Role definitions with their permissions
export const ROLES = {
  admin: {
    name: 'Administrator',
    permissions: Object.values(PERMISSIONS) // All permissions
  },

  manager: {
    name: 'Manager',
    permissions: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.VIEW_ALL_BOOKINGS,
      PERMISSIONS.CREATE_BOOKING,
      PERMISSIONS.UPDATE_BOOKING,
      PERMISSIONS.CANCEL_BOOKING,
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.UPDATE_SERVICE,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_REVENUE,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.VIEW_PAYMENTS,
      PERMISSIONS.PROCESS_PAYMENT,
      PERMISSIONS.VIEW_STAFF,
      PERMISSIONS.MANAGE_STAFF
    ]
  },

  staff: {
    name: 'Staff',
    permissions: [
      PERMISSIONS.VIEW_ALL_BOOKINGS,
      PERMISSIONS.UPDATE_BOOKING,
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.VIEW_OWN_BOOKINGS,
      PERMISSIONS.CREATE_BOOKING
    ]
  },

  customer: {
    name: 'Customer',
    permissions: [
      PERMISSIONS.VIEW_SERVICES,
      PERMISSIONS.VIEW_OWN_BOOKINGS,
      PERMISSIONS.CREATE_BOOKING,
      PERMISSIONS.CANCEL_BOOKING
    ]
  }
};

// Check if user has a specific permission
export const hasPermission = (userRole, permission) => {
  const role = ROLES[userRole];
  if (!role) return false;

  return role.permissions.includes(permission);
};

// Check if user has any of the given permissions
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Check if user has all of the given permissions
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Get all permissions for a role
export const getRolePermissions = (userRole) => {
  const role = ROLES[userRole];
  return role ? role.permissions : [];
};

// Check if user can access a specific route
export const canAccessRoute = (userRole, route) => {
  const routePermissions = {
    '/admin/dashboard': [PERMISSIONS.VIEW_ANALYTICS],
    '/admin/users': [PERMISSIONS.VIEW_USERS],
    '/admin/bookings': [PERMISSIONS.VIEW_ALL_BOOKINGS],
    '/admin/services': [PERMISSIONS.VIEW_SERVICES],
    '/admin/analytics': [PERMISSIONS.VIEW_ANALYTICS],
    '/admin/settings': [PERMISSIONS.VIEW_SETTINGS],
    '/admin/audit-logs': [PERMISSIONS.VIEW_AUDIT_LOGS]
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true; // No restrictions

  return hasAnyPermission(userRole, requiredPermissions);
};

// Filter menu items based on permissions
export const getAuthorizedMenuItems = (userRole, menuItems) => {
  return menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return hasPermission(userRole, item.requiredPermission);
  });
};

// Hook for checking permissions in components
export const usePermissions = (user) => {
  const can = (permission) => {
    return user && hasPermission(user.role, permission);
  };

  const canAny = (permissions) => {
    return user && hasAnyPermission(user.role, permissions);
  };

  const canAll = (permissions) => {
    return user && hasAllPermissions(user.role, permissions);
  };

  const canAccess = (route) => {
    return user && canAccessRoute(user.role, route);
  };

  return { can, canAny, canAll, canAccess };
};
