// Permission system configuration

// Define all available permissions
const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  MANAGE_ROLES: 'manage_roles',

  // Booking management
  VIEW_ALL_BOOKINGS: 'view_all_bookings',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  CREATE_BOOKING: 'create_booking',
  UPDATE_BOOKING: 'update_booking',
  CANCEL_BOOKING: 'cancel_booking',
  DELETE_BOOKING: 'delete_booking',
  ASSIGN_STAFF: 'assign_staff',

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
  VIEW_STAFF_PERFORMANCE: 'view_staff_performance',

  // Audit logs
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Inventory
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',

  // Customer management
  VIEW_CUSTOMERS: 'view_customers',
  MANAGE_CUSTOMERS: 'manage_customers',

  // Reports
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
};

// Role definitions with their permissions
const ROLE_PERMISSIONS = {
  super_admin: '*', // Wildcard - all permissions

  admin: [
    // User management
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.MANAGE_ROLES,

    // Booking management
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.UPDATE_BOOKING,
    PERMISSIONS.CANCEL_BOOKING,
    PERMISSIONS.DELETE_BOOKING,
    PERMISSIONS.ASSIGN_STAFF,

    // Service management
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.CREATE_SERVICE,
    PERMISSIONS.UPDATE_SERVICE,
    PERMISSIONS.DELETE_SERVICE,

    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REVENUE,
    PERMISSIONS.EXPORT_DATA,

    // Settings
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.UPDATE_SETTINGS,

    // Payments
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.REFUND_PAYMENT,

    // Staff management
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_STAFF_PERFORMANCE,

    // Audit logs
    PERMISSIONS.VIEW_AUDIT_LOGS,

    // Inventory
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,

    // Customer management
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.MANAGE_CUSTOMERS,

    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],

  manager: [
    // User management (limited)
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.UPDATE_USER,

    // Booking management
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.UPDATE_BOOKING,
    PERMISSIONS.CANCEL_BOOKING,
    PERMISSIONS.ASSIGN_STAFF,

    // Service management
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.UPDATE_SERVICE,

    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REVENUE,
    PERMISSIONS.EXPORT_DATA,

    // Payments
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.PROCESS_PAYMENT,

    // Staff management
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_STAFF_PERFORMANCE,

    // Inventory
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.MANAGE_INVENTORY,

    // Customer management
    PERMISSIONS.VIEW_CUSTOMERS,

    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],

  staff: [
    // Booking management
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.UPDATE_BOOKING,

    // Service management
    PERMISSIONS.VIEW_SERVICES,

    // Customer management
    PERMISSIONS.VIEW_CUSTOMERS,
  ],

  customer: [
    // Booking management
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.CANCEL_BOOKING,

    // Service management
    PERMISSIONS.VIEW_SERVICES,
  ],
};

// Permission categories for UI grouping
const PERMISSION_CATEGORIES = {
  users: {
    label: 'User Management',
    permissions: [
      { key: PERMISSIONS.VIEW_USERS, label: 'View Users', description: 'View all users in the system' },
      { key: PERMISSIONS.CREATE_USER, label: 'Create User', description: 'Create new user accounts' },
      { key: PERMISSIONS.UPDATE_USER, label: 'Update User', description: 'Edit user information' },
      { key: PERMISSIONS.DELETE_USER, label: 'Delete User', description: 'Delete user accounts' },
      { key: PERMISSIONS.MANAGE_ROLES, label: 'Manage Roles', description: 'Assign and modify user roles' },
    ],
  },
  bookings: {
    label: 'Booking Management',
    permissions: [
      { key: PERMISSIONS.VIEW_ALL_BOOKINGS, label: 'View All Bookings', description: 'View all bookings in the system' },
      { key: PERMISSIONS.VIEW_OWN_BOOKINGS, label: 'View Own Bookings', description: 'View own bookings only' },
      { key: PERMISSIONS.CREATE_BOOKING, label: 'Create Booking', description: 'Create new bookings' },
      { key: PERMISSIONS.UPDATE_BOOKING, label: 'Update Booking', description: 'Modify existing bookings' },
      { key: PERMISSIONS.CANCEL_BOOKING, label: 'Cancel Booking', description: 'Cancel bookings' },
      { key: PERMISSIONS.DELETE_BOOKING, label: 'Delete Booking', description: 'Delete bookings permanently' },
      { key: PERMISSIONS.ASSIGN_STAFF, label: 'Assign Staff', description: 'Assign staff to bookings' },
    ],
  },
  services: {
    label: 'Service Management',
    permissions: [
      { key: PERMISSIONS.VIEW_SERVICES, label: 'View Services', description: 'View available services' },
      { key: PERMISSIONS.CREATE_SERVICE, label: 'Create Service', description: 'Create new services' },
      { key: PERMISSIONS.UPDATE_SERVICE, label: 'Update Service', description: 'Modify existing services' },
      { key: PERMISSIONS.DELETE_SERVICE, label: 'Delete Service', description: 'Delete services' },
    ],
  },
  analytics: {
    label: 'Analytics & Reports',
    permissions: [
      { key: PERMISSIONS.VIEW_ANALYTICS, label: 'View Analytics', description: 'View analytics dashboard' },
      { key: PERMISSIONS.VIEW_REVENUE, label: 'View Revenue', description: 'View revenue data' },
      { key: PERMISSIONS.EXPORT_DATA, label: 'Export Data', description: 'Export data to files' },
      { key: PERMISSIONS.VIEW_REPORTS, label: 'View Reports', description: 'View system reports' },
      { key: PERMISSIONS.GENERATE_REPORTS, label: 'Generate Reports', description: 'Generate custom reports' },
    ],
  },
  payments: {
    label: 'Payment Management',
    permissions: [
      { key: PERMISSIONS.VIEW_PAYMENTS, label: 'View Payments', description: 'View payment transactions' },
      { key: PERMISSIONS.PROCESS_PAYMENT, label: 'Process Payment', description: 'Process payment transactions' },
      { key: PERMISSIONS.REFUND_PAYMENT, label: 'Refund Payment', description: 'Issue refunds' },
    ],
  },
  staff: {
    label: 'Staff Management',
    permissions: [
      { key: PERMISSIONS.VIEW_STAFF, label: 'View Staff', description: 'View staff members' },
      { key: PERMISSIONS.MANAGE_STAFF, label: 'Manage Staff', description: 'Manage staff information' },
      { key: PERMISSIONS.VIEW_STAFF_PERFORMANCE, label: 'View Staff Performance', description: 'View staff performance metrics' },
    ],
  },
  inventory: {
    label: 'Inventory Management',
    permissions: [
      { key: PERMISSIONS.VIEW_INVENTORY, label: 'View Inventory', description: 'View inventory items' },
      { key: PERMISSIONS.MANAGE_INVENTORY, label: 'Manage Inventory', description: 'Manage inventory items' },
    ],
  },
  customers: {
    label: 'Customer Management',
    permissions: [
      { key: PERMISSIONS.VIEW_CUSTOMERS, label: 'View Customers', description: 'View customer information' },
      { key: PERMISSIONS.MANAGE_CUSTOMERS, label: 'Manage Customers', description: 'Manage customer accounts' },
    ],
  },
  system: {
    label: 'System Settings',
    permissions: [
      { key: PERMISSIONS.VIEW_SETTINGS, label: 'View Settings', description: 'View system settings' },
      { key: PERMISSIONS.UPDATE_SETTINGS, label: 'Update Settings', description: 'Modify system settings' },
      { key: PERMISSIONS.VIEW_AUDIT_LOGS, label: 'View Audit Logs', description: 'View system audit logs' },
    ],
  },
};

// Get permissions for a role
function getRolePermissions(role) {
  const permissions = ROLE_PERMISSIONS[role];

  // If role has wildcard, return all permissions
  if (permissions === '*') {
    return Object.values(PERMISSIONS);
  }

  return permissions || [];
}

// Check if a role has a specific permission
function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];

  // Super admin has all permissions
  if (permissions === '*') {
    return true;
  }

  // Check if role has the specific permission
  return Array.isArray(permissions) && permissions.includes(permission);
}

// Check if user has any of the given permissions
function hasAnyPermission(role, permissionArray) {
  return permissionArray.some(permission => hasPermission(role, permission));
}

// Check if user has all of the given permissions
function hasAllPermissions(role, permissionArray) {
  return permissionArray.every(permission => hasPermission(role, permission));
}

// Get all available roles
function getAllRoles() {
  return Object.keys(ROLE_PERMISSIONS);
}

// Get role display name
function getRoleDisplayName(role) {
  const displayNames = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff',
    customer: 'Customer',
  };
  return displayNames[role] || role;
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllRoles,
  getRoleDisplayName,
};
