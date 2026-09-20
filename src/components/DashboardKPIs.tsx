import React, { useEffect, useState } from 'react';
import { TrendingUp, Package, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import * as db from '../lib/db';
import { auditLogManager } from '../lib/auditLog';
import { Lang } from '../lib/i18n';

interface DashboardKPIsProps {
  lang: Lang;
}

export default function DashboardKPIs({ lang }: DashboardKPIsProps) {
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalCouriers: 0,
    availableCouriers: 0,
    totalInbound: 0,
    pendingInbound: 0,
    completedInbound: 0,
    todayActivities: 0,
    avgTripTime: 0,
  });

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // تحديث كل 5 ثواني
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const trips = db.getTrips();
    const couriers = db.getCouriers();
    const inbounds = db.getInbounds();
    const auditStats = auditLogManager.getStats();

    // حساب متوسط وقت الرحلات المكتملة
    const completedTrips = trips.filter(t => t.status === 'COMPLETED');
    let avgTripTime = 0;
    if (completedTrips.length > 0) {
      const totalTime = completedTrips.reduce((sum, trip) => {
        if (trip.completedAt && trip.arrivalAt) {
          const duration = new Date(trip.completedAt).getTime() - new Date(trip.arrivalAt).getTime();
          return sum + duration;
        }
        return sum;
      }, 0);
      avgTripTime = Math.round(totalTime / completedTrips.length / 1000 / 60); // بالدقائق
    }

    setStats({
      totalTrips: trips.length,
      activeTrips: trips.filter(t => t.status === 'ACTIVE').length,
      completedTrips: completedTrips.length,
      totalCouriers: couriers.length,
      availableCouriers: couriers.filter(c => c.status === 'AVAILABLE').length,
      totalInbound: inbounds.length,
      pendingInbound: inbounds.filter(i => i.status === 'PENDING').length,
      completedInbound: inbounds.filter(i => i.status === 'COMPLETED').length,
      todayActivities: auditStats.today,
      avgTripTime,
    });
  };

  const kpis = [
    {
      title: lang === 'ar' ? 'إجمالي الرحلات' : 'Total Trips',
      value: stats.totalTrips,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: lang === 'ar' ? 'الرحلات النشطة' : 'Active Trips',
      value: stats.activeTrips,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: lang === 'ar' ? 'الرحلات المكتملة' : 'Completed Trips',
      value: stats.completedTrips,
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: lang === 'ar' ? 'إجمالي المندوبين' : 'Total Couriers',
      value: stats.totalCouriers,
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      title: lang === 'ar' ? 'المندوبون المتاحون' : 'Available Couriers',
      value: stats.availableCouriers,
      icon: Users,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700',
    },
    {
      title: lang === 'ar' ? 'إجمالي الوارد' : 'Total Inbound',
      value: stats.totalInbound,
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      title: lang === 'ar' ? 'الوارد المكتمل' : 'Completed Inbound',
      value: stats.completedInbound,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: lang === 'ar' ? 'أنشطة اليوم' : 'Today Activities',
      value: stats.todayActivities,
      icon: AlertCircle,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
    {
      title: lang === 'ar' ? 'متوسط وقت الرحلة' : 'Avg Trip Time',
      value: `${stats.avgTripTime} ${lang === 'ar' ? 'دقيقة' : 'min'}`,
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          {lang === 'ar' ? 'لوحة المؤشرات الرئيسية' : 'Dashboard KPIs'}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {lang === 'ar' ? 'مباشر' : 'Live'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`${kpi.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`bg-gradient-to-br ${kpi.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                <p className={`text-3xl font-bold ${kpi.textColor}`}>
                  {kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
