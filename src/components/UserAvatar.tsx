import { User } from 'lucide-react';

interface UserAvatarProps {
  userName: string;
  userRole: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserAvatar({ userName, userRole, size = 'md' }: UserAvatarProps) {
  // استخراج الحرف الأول من الاسم
  const initial = userName.charAt(0).toUpperCase();
  
  // ألوان مختلفة حسب الدور
  const roleColors: Record<string, string> = {
    ADMIN: 'from-purple-500 to-indigo-600',
    SUPERVISOR: 'from-blue-500 to-cyan-600',
    WAREHOUSE: 'from-orange-500 to-amber-600',
    CASHIER: 'from-green-500 to-emerald-600',
    COURIER: 'from-pink-500 to-rose-600',
    VIEWER: 'from-gray-500 to-slate-600',
  };
  
  const colorClass = roleColors[userRole] || 'from-gray-500 to-slate-600';
  
  // أحجام مختلفة
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  
  return (
    <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white`}>
      {initial}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
    </div>
  );
}
