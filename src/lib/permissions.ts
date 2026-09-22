// نظام الصلاحيات المخصصة
import { UserRole } from './db';

// تعريف الصلاحيات المتاحة
export type Permission = 
  | 'view_dashboard'
  | 'view_inbound'
  | 'manage_inbound'
  | 'view_couriers'
  | 'manage_couriers'
  | 'view_trips'
  | 'manage_trips'
  | 'view_workflow'
  | 'manage_workflow'
  | 'view_cashier'
  | 'manage_cashier'
  | 'view_queue'
  | 'manage_queue'
  | 'view_reports'
  | 'export_reports'
  | 'view_users'
  | 'manage_users'
  | 'view_settings'
  | 'manage_settings'
  | 'view_performance';

// خريطة الصلاحيات حسب الدور
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'view_dashboard',
    'view_inbound', 'manage_inbound',
    'view_couriers', 'manage_couriers',
    'view_trips', 'manage_trips',
    'view_workflow', 'manage_workflow',
    'view_cashier', 'manage_cashier',
    'view_queue', 'manage_queue',
    'view_reports', 'export_reports',
    'view_users', 'manage_users',
    'view_settings', 'manage_settings',
    'view_performance',
  ],
  SUPERVISOR: [
    'view_dashboard',
    'view_inbound', 'manage_inbound',
    'view_couriers', 'manage_couriers',
    'view_trips', 'manage_trips',
    'view_workflow', 'manage_workflow',
    'view_cashier', 'manage_cashier',
    'view_queue', 'manage_queue',
    'view_reports', 'export_reports',
    'view_users',
    'view_settings',
    'view_performance',
  ],
  WAREHOUSE: [
    'view_dashboard',
    'view_inbound', 'manage_inbound',
    'view_couriers',
    'view_trips',
    'view_workflow', 'manage_workflow',
    'view_reports',
    'view_performance',
  ],
  CASHIER: [
    'view_dashboard',
    'view_couriers',
    'view_trips',
    'view_cashier', 'manage_cashier',
    'view_queue', 'manage_queue',
    'view_reports',
  ],
  COURIER: [
    'view_dashboard',
    'view_trips',
  ],
  VIEWER: [
    'view_dashboard',
    'view_reports',
  ],
};

// التحقق من صلاحية المستخدم
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes(permission);
}

// الحصول على جميع صلاحيات الدور
export function getPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

// التحقق من صلاحيات متعددة
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// خريطة الصفحات والصلاحيات المطلوبة
export const PAGE_PERMISSIONS: Record<string, Permission> = {
  '/': 'view_dashboard',
  '/inbound': 'view_inbound',
  '/incoming': 'view_inbound',
  '/couriers': 'view_couriers',
  '/preparation': 'view_workflow',
  '/inventory': 'view_workflow',
  '/loading': 'view_workflow',
  '/workflow': 'view_workflow',
  '/trips': 'view_trips',
  '/cashier': 'view_cashier',
  '/queue': 'view_queue',
  '/reports': 'view_reports',
  '/performance': 'view_performance',
  '/users': 'view_users',
  '/settings': 'view_settings',
};

// التحقق من صلاحية الوصول لصفحة
export function canAccessPage(userRole: UserRole, pagePath: string): boolean {
  const requiredPermission = PAGE_PERMISSIONS[pagePath];
  if (!requiredPermission) return true; // إذا لم تكن محددة، السماح بالوصول
  return hasPermission(userRole, requiredPermission);
}

// خريطة الأزرار والصلاحيات المطلوبة
export const BUTTON_PERMISSIONS: Record<string, Permission> = {
  'import_couriers': 'manage_couriers',
  'start_stage': 'manage_workflow',
  'finish_stage': 'manage_workflow',
  'check_in': 'manage_inbound',
  'create_inbound': 'manage_inbound',
  'export_reports': 'export_reports',
  'manage_settings': 'manage_settings',
  'manage_users': 'manage_users',
};

// التحقق من صلاحية زر
export function canUseButton(userRole: UserRole, buttonKey: string): boolean {
  const requiredPermission = BUTTON_PERMISSIONS[buttonKey];
  if (!requiredPermission) return true; // إذا لم تكن محددة، السماح بالاستخدام
  return hasPermission(userRole, requiredPermission);
}
