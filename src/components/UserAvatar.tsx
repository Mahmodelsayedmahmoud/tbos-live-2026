import { User, Camera } from 'lucide-react';
import { useState, useRef } from 'react';

interface UserAvatarProps {
  userName: string;
  userRole: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onImageUpload?: (imageUrl: string) => void;
  editable?: boolean;
}

export default function UserAvatar({ userName, userRole, imageUrl, size = 'md', onImageUpload, editable = false }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // أحجام مختلفة - مصغرة
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-16 h-16 text-2xl',
  };
  
  // عرض الصورة الحقيقية إذا كانت متوفرة ولم يحدث خطأ
  const showImage = currentImage && !imageError;
  
  const handleImageClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCurrentImage(result);
        if (onImageUpload) {
          onImageUpload(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="relative inline-block">
      <div 
        onClick={handleImageClick}
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white overflow-hidden ${editable ? 'cursor-pointer hover:ring-4 hover:ring-indigo-300 transition-all' : ''}`}
      >
        {showImage ? (
          <img 
            src={currentImage} 
            alt={userName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="relative z-10">{initial}</span>
        )}
        
        {/* زر رفع الصورة */}
        {editable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={size === 'xl' ? 24 : 16} className="text-white" />
          </div>
        )}
        
        {/* مؤشر الحالة */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-20"></div>
      </div>
      
      {/* Input لرفع الصورة */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
}
