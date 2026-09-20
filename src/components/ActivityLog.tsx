import React, { useEffect, useState } from 'react';
import { Activity, Filter, Download, Trash2 } from 'lucide-react';
import { auditLogManager, ActivityLog, ActivityType } from '../lib/auditLog';
import { exportAuditLog } from '../lib/exportUtils';
import { Lang } from '../lib/i18n';

interface ActivityLogViewerProps {
  lang: Lang;
}

export default function ActivityLogViewer({ lang }: ActivityLogViewerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    updateLogs();
    const unsubscribe = auditLogManager.subscribe(() => {
      updateLogs();
    });
    return unsubscribe;
  }, [filterType, filterDate]);

  const updateLogs = () => {
    let filteredLogs = auditLogManager.getLogs();

    // تصفية حسب النوع
    if (filterType !== 'ALL') {
      filteredLogs = filteredLogs.filter(log => log.type === filterType);
    }

    // تصفية حسب التاريخ
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);

      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= selectedDate.getTime() && 
        log.timestamp < nextDate.getTime()
      );
    }

    setLogs(filteredLogs);
  };

  const handleExport = () => {
    try {
      exportAuditLog(logs, lang === 'ar' ? 'سجل_الأنشطة' : 'Activity_Log');
      alert(lang === 'ar' ? 'تم تصدير السجل بنجاح' : 'Log exported successfully');
    } catch (error) {
      alert(lang === 'ar' ? 'فشل التصدير' : 'Export failed');
    }
  };

  const handleClear = () => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من مسح جميع السجلات؟' : 'Are you sure you want to clear all logs?')) {
      auditLogManager.clearLogs();
      updateLogs();
    }
  };

  const getActivityIcon = (type: ActivityType): string => {
    const icons: Record<ActivityType, string> = {
      LOGIN: '🔐',
      LOGOUT: '🚪',
      CREATE_TRIP: '📦',
      START_STAGE: '▶️',
      FINISH_STAGE: '✅',
      CREATE_INBOUND: '📥',
      START_INBOUND: '⏱️',
      COMPLETE_INBOUND: '✔️',
      ADD_ITEM: '➕',
      REMOVE_ITEM: '➖',
      IMPORT_COURIERS: '📊',
      UPDATE_SETTINGS: '⚙️',
      DECISION_MADE: '🎯',
      QUEUE_PROMOTION: '🔼',
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type: ActivityType): string => {
    const colors: Record<ActivityType, string> = {
      LOGIN: 'bg-green-100 text-green-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      CREATE_TRIP: 'bg-blue-100 text-blue-800',
      START_STAGE: 'bg-yellow-100 text-yellow-800',
      FINISH_STAGE: 'bg-green-100 text-green-800',
      CREATE_INBOUND: 'bg-purple-100 text-purple-800',
      START_INBOUND: 'bg-orange-100 text-orange-800',
      COMPLETE_INBOUND: 'bg-emerald-100 text-emerald-800',
      ADD_ITEM: 'bg-cyan-100 text-cyan-800',
      REMOVE_ITEM: 'bg-red-100 text-red-800',
      IMPORT_COURIERS: 'bg-indigo-100 text-indigo-800',
      UPDATE_SETTINGS: 'bg-pink-100 text-pink-800',
      DECISION_MADE: 'bg-violet-100 text-violet-800',
      QUEUE_PROMOTION: 'bg-teal-100 text-teal-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const stats = auditLogManager.getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-indigo-500" size={28} />
          {lang === 'ar' ? 'سجل حركة الأنشطة' : 'Activity Audit Log'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-primary"
          >
            <Download size={16} />
            {lang === 'ar' ? 'تصدير' : 'Export'}
          </button>
          <button
            onClick={handleClear}
            className="btn btn-outline text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            {lang === 'ar' ? 'مسح' : 'Clear'}
          </button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">
            {lang === 'ar' ? 'إجمالي السجلات' : 'Total Logs'}
          </p>
          <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">
            {lang === 'ar' ? 'أنشطة اليوم' : 'Today Activities'}
          </p>
          <p className="text-3xl font-bold text-green-700">{stats.today}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-600 mb-1">
            {lang === 'ar' ? 'السجلات المعروضة' : 'Displayed Logs'}
          </p>
          <p className="text-3xl font-bold text-purple-700">{logs.length}</p>
        </div>
      </div>

      {/* فلاتر */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">
            {lang === 'ar' ? 'تصفية' : 'Filter'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'ar' ? 'نوع النشاط' : 'Activity Type'}
            </label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ActivityType | 'ALL')}
              className="input"
            >
              <option value="ALL">{lang === 'ar' ? 'الكل' : 'All'}</option>
              <option value="LOGIN">{lang === 'ar' ? 'تسجيل دخول' : 'Login'}</option>
              <option value="LOGOUT">{lang === 'ar' ? 'تسجيل خروج' : 'Logout'}</option>
              <option value="CREATE_TRIP">{lang === 'ar' ? 'إنشاء رحلة' : 'Create Trip'}</option>
              <option value="START_STAGE">{lang === 'ar' ? 'بدء مرحلة' : 'Start Stage'}</option>
              <option value="FINISH_STAGE">{lang === 'ar' ? 'إنهاء مرحلة' : 'Finish Stage'}</option>
              <option value="CREATE_INBOUND">{lang === 'ar' ? 'إنشاء وارد' : 'Create Inbound'}</option>
              <option value="IMPORT_COURIERS">{lang === 'ar' ? 'استيراد مندوبين' : 'Import Couriers'}</option>
              <option value="UPDATE_SETTINGS">{lang === 'ar' ? 'تحديث إعدادات' : 'Update Settings'}</option>
              <option value="DECISION_MADE">{lang === 'ar' ? 'قرار النظام' : 'Decision Made'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'ar' ? 'التاريخ' : 'Date'}
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* جدول السجلات */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  {lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  {lang === 'ar' ? 'المستخدم' : 'User'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  {lang === 'ar' ? 'الدور' : 'Role'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  {lang === 'ar' ? 'النوع' : 'Type'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  {lang === 'ar' ? 'الوصف' : 'Description'}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {lang === 'ar' ? 'لا توجد سجلات' : 'No logs found'}
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {log.userName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="badge badge-purple">{log.userRole}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(log.type)}`}>
                        <span>{getActivityIcon(log.type)}</span>
                        <span>{log.type}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
