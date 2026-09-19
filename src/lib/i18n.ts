export type Lang = 'ar' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.inbound': { ar: 'الوارد', en: 'Inbound' },
  'nav.incoming': { ar: 'دخول المندوب', en: 'Courier Entry' },
  'nav.couriers': { ar: 'المندوبون', en: 'Couriers' },
  'nav.preparation': { ar: 'التحضير', en: 'Preparation' },
  'nav.inventory': { ar: 'الجرد', en: 'Inventory' },
  'nav.loading': { ar: 'التحميل', en: 'Loading' },
  'nav.trips': { ar: 'الرحلات', en: 'Trips' },
  'nav.workflow': { ar: 'سير العمل', en: 'Workflow' },
  'nav.cashier': { ar: 'الكاشير', en: 'Cashier' },
  'nav.queue': { ar: 'الطابور', en: 'Queue' },
  'nav.reports': { ar: 'التقارير', en: 'Reports' },
  'nav.users': { ar: 'المستخدمون', en: 'Users' },
  'nav.settings': { ar: 'الإعدادات', en: 'Settings' },
  'nav.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  
  'login.title': { ar: 'تسجيل الدخول', en: 'Login' },
  'login.username': { ar: 'اسم المستخدم', en: 'Username' },
  'login.password': { ar: 'كلمة المرور', en: 'Password' },
  'login.submit': { ar: 'دخول', en: 'Sign In' },
  'login.error': { ar: 'بيانات الدخول غير صحيحة', en: 'Invalid credentials' },
  
  'dashboard.title': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'dashboard.trips_today': { ar: 'رحلات اليوم', en: 'Trips Today' },
  'dashboard.active_trips': { ar: 'رحلات نشطة', en: 'Active Trips' },
  'dashboard.on_dock': { ar: 'على الرصيف', en: 'On Dock' },
  'dashboard.in_preparation': { ar: 'التحضير', en: 'Preparation' },
  'dashboard.in_inventory': { ar: 'الجرد', en: 'Inventory' },
  'dashboard.in_loading': { ar: 'التحميل', en: 'Loading' },
  'dashboard.in_cashier': { ar: 'الكاشير', en: 'Cashier' },
  'dashboard.in_queue': { ar: 'في الطابور', en: 'In Queue' },
  'dashboard.avg_trip_time': { ar: 'متوسط وقت الرحلة', en: 'Avg Trip Time' },
  
  'workflow.title': { ar: 'سير العمل', en: 'Workflow' },
  'workflow.start': { ar: 'بدء', en: 'Start' },
  'workflow.finish': { ar: 'إنهاء', en: 'Finish' },
  'workflow.current_stage': { ar: 'المرحلة الحالية', en: 'Current Stage' },
  'workflow.status': { ar: 'الحالة', en: 'Status' },
  'workflow.duration': { ar: 'المدة', en: 'Duration' },
  'workflow.decision': { ar: 'القرار', en: 'Decision' },
  
  'stage.ENTRY': { ar: 'الوصول', en: 'Entry' },
  'stage.DOCK': { ar: 'الرصيف', en: 'Dock' },
  'stage.PREPARATION': { ar: 'التحضير', en: 'Preparation' },
  'stage.INVENTORY': { ar: 'الجرد', en: 'Inventory' },
  'stage.LOADING': { ar: 'التحميل', en: 'Loading' },
  'stage.DECISION': { ar: 'القرار', en: 'Decision' },
  'stage.CASHIER': { ar: 'الكاشير', en: 'Cashier' },
  'stage.COMPLETED': { ar: 'مكتمل', en: 'Completed' },
  
  'decision.GO_TO_CASHIER': { ar: '🟢 اذهب إلى الكاشير', en: '🟢 Go to Cashier' },
  'decision.WAIT_CASHIER': { ar: '🟠 انتظر على الرصيف', en: '🟠 Wait on Dock' },
  'decision.BLOCKED_INVENTORY': { ar: '🔴 الجرد لم يكتمل', en: '🔴 Inventory Not Complete' },
  'decision.WAIT_LOADING': { ar: '🟠 التحميل غير جاهز', en: '🟠 Loading Not Ready' },
  'decision.WAIT_CONGESTION': { ar: '🟠 ازدحام تشغيلي', en: '🟠 Operational Congestion' },
  
  'couriers.title': { ar: 'المندوبون', en: 'Couriers' },
  'couriers.add': { ar: 'إضافة مندوب', en: 'Add Courier' },
  'couriers.code': { ar: 'الكود', en: 'Code' },
  'couriers.name': { ar: 'الاسم', en: 'Name' },
  'couriers.phone': { ar: 'الهاتف', en: 'Phone' },
  'couriers.branch': { ar: 'الفرع', en: 'Branch' },
  'couriers.status': { ar: 'الحالة', en: 'Status' },
  
  'courier_status.AVAILABLE': { ar: 'متاح', en: 'Available' },
  'courier_status.ON_TRIP': { ar: 'في رحلة', en: 'On Trip' },
  'courier_status.WAITING': { ar: 'ينتظر', en: 'Waiting' },
  'courier_status.IN_CASHIER': { ar: 'في الكاشير', en: 'In Cashier' },
  'courier_status.COMPLETED': { ar: 'مكتمل', en: 'Completed' },
  
  'incoming.title': { ar: 'دخول المندوب', en: 'Courier Entry' },
  'incoming.register': { ar: 'تسجيل الوصول', en: 'Check In' },
  'incoming.trip_number': { ar: 'رقم الرحلة', en: 'Trip Number' },
  'incoming.arrival_time': { ar: 'وقت الوصول', en: 'Arrival Time' },
  
  'cashier.title': { ar: 'الكاشير', en: 'Cashier' },
  'cashier.capacity': { ar: 'السعة', en: 'Capacity' },
  'cashier.occupancy': { ar: 'المشغول', en: 'Occupancy' },
  
  'queue.title': { ar: 'الطابور', en: 'Queue' },
  'queue.number': { ar: 'الرقم', en: 'Number' },
  'queue.priority': { ar: 'الأولوية', en: 'Priority' },
  'queue.position': { ar: 'الموقع', en: 'Position' },
  'queue.waiting': { ar: 'ينتظر', en: 'Waiting' },
  
  'reports.title': { ar: 'التقارير', en: 'Reports' },
  'reports.export_csv': { ar: 'تصدير CSV', en: 'Export CSV' },
  'reports.print': { ar: 'طباعة', en: 'Print' },
  
  'users.title': { ar: 'المستخدمون', en: 'Users' },
  'users.role': { ar: 'الدور', en: 'Role' },
  
  'settings.title': { ar: 'الإعدادات', en: 'Settings' },
  'settings.cashier_capacity': { ar: 'سعة الكاشير', en: 'Cashier Capacity' },
  'settings.dock_capacity': { ar: 'سعة الرصيف', en: 'Dock Capacity' },
  'settings.max_queue': { ar: 'الحد الأقصى للطابور', en: 'Max Queue' },
  'settings.operational_status': { ar: 'الحالة التشغيلية', en: 'Operational Status' },
  'settings.save': { ar: 'حفظ', en: 'Save' },
  'settings.saved': { ar: 'تم الحفظ', en: 'Saved' },
  
  'common.actions': { ar: 'الإجراءات', en: 'Actions' },
  'common.edit': { ar: 'تعديل', en: 'Edit' },
  'common.delete': { ar: 'حذف', en: 'Delete' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.no_data': { ar: 'لا توجد بيانات', en: 'No data' },
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'common.error': { ar: 'حدث خطأ', en: 'An error occurred' },
  'common.live': { ar: 'مباشر', en: 'LIVE' },
  'common.minutes': { ar: 'دقيقة', en: 'min' },
  'common.seconds': { ar: 'ثانية', en: 'sec' },
};

export function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] || key;
}

export function formatDuration(seconds: number, lang: Lang): string {
  if (seconds < 60) return `${seconds} ${t('common.seconds', lang)}`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} ${t('common.minutes', lang)} ${secs} ${t('common.seconds', lang)}`;
}

export function formatTime(date: Date | string, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}
