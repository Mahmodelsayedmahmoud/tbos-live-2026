import * as React from 'react';

// ============================================
// Types & Interfaces
// ============================================

interface Trip {
  id: string;
  tripNumber: string;
  courierName: string;
  courierCode: string;
  branchName: string;
  arrivalTime: string;
  status: 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'CANCELLED';
  currentStage: string;
  decision?: string;
}

interface Courier {
  id: string;
  code: string;
  name: string;
  phone: string;
  branch: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'WAITING' | 'IN_CASHIER' | 'COMPLETED';
}

interface Decision {
  id: string;
  tripNumber: string;
  courierName: string;
  decision: string;
  reason: string;
  timestamp: string;
}

// ============================================
// Mock Data (بيانات وهمية ثابتة)
// ============================================

const mockTrips: Trip[] = [
  {
    id: '1',
    tripNumber: 'TR-0001',
    courierName: 'أحمد محمد',
    courierCode: 'C001',
    branchName: 'القاهرة',
    arrivalTime: '2024-01-15 10:30',
    status: 'ACTIVE',
    currentStage: 'التحميل',
    decision: '🟢 اذهب إلى الكاشير'
  },
  {
    id: '2',
    tripNumber: 'TR-0002',
    courierName: 'محمود علي',
    courierCode: 'C002',
    branchName: 'القاهرة',
    arrivalTime: '2024-01-15 11:00',
    status: 'WAITING',
    currentStage: 'الرصيف',
    decision: '🟠 انتظر على الرصيف'
  },
  {
    id: '3',
    tripNumber: 'TR-0003',
    courierName: 'خالد حسن',
    courierCode: 'C003',
    branchName: 'الإسكندرية',
    arrivalTime: '2024-01-15 11:30',
    status: 'COMPLETED',
    currentStage: 'مكتمل',
    decision: '🟢 اذهب إلى الكاشير'
  },
  {
    id: '4',
    tripNumber: 'TR-0004',
    courierName: 'عمر سعيد',
    courierCode: 'C004',
    branchName: 'الإسكندرية',
    arrivalTime: '2024-01-15 12:00',
    status: 'ACTIVE',
    currentStage: 'الجرد',
    decision: '🔴 الجرد لم يكتمل'
  },
  {
    id: '5',
    tripNumber: 'TR-0005',
    courierName: 'ياسر إبراهيم',
    courierCode: 'C005',
    branchName: 'طنطا',
    arrivalTime: '2024-01-15 12:30',
    status: 'ACTIVE',
    currentStage: 'التحضير',
    decision: '🟢 اذهب إلى الكاشير'
  }
];

const mockCouriers: Courier[] = [
  {
    id: '1',
    code: 'C001',
    name: 'أحمد محمد',
    phone: '0101234567',
    branch: 'القاهرة',
    status: 'ON_TRIP'
  },
  {
    id: '2',
    code: 'C002',
    name: 'محمود علي',
    phone: '0109876543',
    branch: 'القاهرة',
    status: 'WAITING'
  },
  {
    id: '3',
    code: 'C003',
    name: 'خالد حسن',
    phone: '0115554433',
    branch: 'الإسكندرية',
    status: 'COMPLETED'
  },
  {
    id: '4',
    code: 'C004',
    name: 'عمر سعيد',
    phone: '0127778899',
    branch: 'الإسكندرية',
    status: 'ON_TRIP'
  },
  {
    id: '5',
    code: 'C005',
    name: 'ياسر إبراهيم',
    phone: '0103332211',
    branch: 'طنطا',
    status: 'ON_TRIP'
  }
];

const mockDecisions: Decision[] = [
  {
    id: '1',
    tripNumber: 'TR-0001',
    courierName: 'أحمد محمد',
    decision: '🟢 اذهب إلى الكاشير',
    reason: 'الكاشير متاح - اذهب الآن',
    timestamp: '2024-01-15 10:35'
  },
  {
    id: '2',
    tripNumber: 'TR-0002',
    courierName: 'محمود علي',
    decision: '🟠 انتظر على الرصيف',
    reason: 'الكاشير ممتلئ - انتظر على الرصيف',
    timestamp: '2024-01-15 11:05'
  },
  {
    id: '3',
    tripNumber: 'TR-0003',
    courierName: 'خالد حسن',
    decision: '🟢 اذهب إلى الكاشير',
    reason: 'الكاشير متاح - اذهب الآن',
    timestamp: '2024-01-15 11:35'
  },
  {
    id: '4',
    tripNumber: 'TR-0004',
    courierName: 'عمر سعيد',
    decision: '🔴 الجرد لم يكتمل',
    reason: 'الجرد لم يكتمل بعد',
    timestamp: '2024-01-15 12:05'
  },
  {
    id: '5',
    tripNumber: 'TR-0005',
    courierName: 'ياسر إبراهيم',
    decision: '🟢 اذهب إلى الكاشير',
    reason: 'الكاشير متاح - اذهب الآن',
    timestamp: '2024-01-15 12:35'
  }
];

// ============================================
// Review Page Component
// ============================================

export default function ReviewPage() {
  // State للفلترة
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  // دالة فلترة الرحلات
  const getFilteredTrips = (): Trip[] => {
    try {
      let filtered = mockTrips || [];

      // فلترة حسب الحالة
      if (filterStatus !== 'ALL') {
        filtered = filtered.filter(trip => trip?.status === filterStatus);
      }

      // فلترة حسب البحث
      if (searchTerm?.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(trip =>
          trip?.tripNumber?.toLowerCase()?.includes(term) ||
          trip?.courierName?.toLowerCase()?.includes(term) ||
          trip?.courierCode?.toLowerCase()?.includes(term) ||
          trip?.branchName?.toLowerCase()?.includes(term)
        );
      }

      return filtered;
    } catch (error) {
      console.error('Error filtering trips:', error);
      return [];
    }
  };

  // حساب الإحصائيات
  const getStats = () => {
    try {
      const trips = mockTrips || [];
      const couriers = mockCouriers || [];
      const decisions = mockDecisions || [];

      return {
        totalTrips: trips?.length || 0,
        activeTrips: trips?.filter(t => t?.status === 'ACTIVE')?.length || 0,
        completedTrips: trips?.filter(t => t?.status === 'COMPLETED')?.length || 0,
        waitingTrips: trips?.filter(t => t?.status === 'WAITING')?.length || 0,
        totalCouriers: couriers?.length || 0,
        availableCouriers: couriers?.filter(c => c?.status === 'AVAILABLE')?.length || 0,
        totalDecisions: decisions?.length || 0
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalTrips: 0,
        activeTrips: 0,
        completedTrips: 0,
        waitingTrips: 0,
        totalCouriers: 0,
        availableCouriers: 0,
        totalDecisions: 0
      };
    }
  };

  const filteredTrips = getFilteredTrips();
  const stats = getStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          📋 صفحة المراجعة النهائية
        </h1>
        <div className="text-sm text-gray-500">
          آخر تحديث: {new Date()?.toLocaleString('ar-EG') || 'غير متاح'}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">إجمالي الرحلات</div>
          <div className="text-3xl font-bold text-blue-700">{stats?.totalTrips || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-sm text-green-600 mb-1">الرحلات النشطة</div>
          <div className="text-3xl font-bold text-green-700">{stats?.activeTrips || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-sm text-purple-600 mb-1">الرحلات المكتملة</div>
          <div className="text-3xl font-bold text-purple-700">{stats?.completedTrips || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="text-sm text-orange-600 mb-1">المندوبون المتاحون</div>
          <div className="text-3xl font-bold text-orange-700">
            {stats?.availableCouriers || 0} / {stats?.totalCouriers || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 بحث
            </label>
            <input
              type="text"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e?.target?.value || '')}
              placeholder="ابحث برقم الرحلة، اسم المندوب، أو الفرع..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 فلترة حسب الحالة
            </label>
            <select
              value={filterStatus || 'ALL'}
              onChange={(e) => setFilterStatus(e?.target?.value || 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="WAITING">انتظار</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            📦 قائمة الرحلات ({filteredTrips?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الرحلة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المندوب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفرع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت الوصول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المرحلة الحالية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  القرار
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrips?.length > 0 ? (
                filteredTrips.map((trip) => (
                  <tr key={trip?.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trip?.tripNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{trip?.courierName || '-'}</div>
                      <div className="text-xs text-gray-500">{trip?.courierCode || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {trip?.branchName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {trip?.arrivalTime || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {trip?.currentStage || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        trip?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        trip?.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                        trip?.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {trip?.status === 'ACTIVE' ? 'نشط' :
                         trip?.status === 'WAITING' ? 'انتظار' :
                         trip?.status === 'COMPLETED' ? 'مكتمل' :
                         trip?.status === 'CANCELLED' ? 'ملغي' : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {trip?.decision || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد رحلات مطابقة للفلترة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decisions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            🎯 سجل القرارات ({mockDecisions?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الرحلة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المندوب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  القرار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السبب
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوقت
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockDecisions?.length > 0 ? (
                mockDecisions.map((decision) => (
                  <tr key={decision?.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {decision?.tripNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {decision?.courierName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {decision?.decision || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {decision?.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {decision?.timestamp || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا توجد قرارات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Couriers Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            👥 ملخص المندوبين ({mockCouriers?.length || 0})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {mockCouriers?.map((courier) => (
            <div key={courier?.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-gray-800">{courier?.name || '-'}</div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  courier?.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                  courier?.status === 'ON_TRIP' ? 'bg-blue-100 text-blue-800' :
                  courier?.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                  courier?.status === 'IN_CASHIER' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {courier?.status === 'AVAILABLE' ? 'متاح' :
                   courier?.status === 'ON_TRIP' ? 'في رحلة' :
                   courier?.status === 'WAITING' ? 'ينتظر' :
                   courier?.status === 'IN_CASHIER' ? 'في الكاشير' :
                   courier?.status === 'COMPLETED' ? 'مكتمل' : '-'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div>الكود: {courier?.code || '-'}</div>
                <div>الهاتف: {courier?.phone || '-'}</div>
                <div>الفرع: {courier?.branch || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
