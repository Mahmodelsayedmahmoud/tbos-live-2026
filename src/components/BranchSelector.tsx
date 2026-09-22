import * as React from 'react';
import { MapPin, ChevronDown, Building2, X } from 'lucide-react';
import * as db from '../lib/db';
import { Lang } from '../lib/i18n';

interface BranchSelectorProps {
  lang: Lang;
}

export default function BranchSelector({ lang }: BranchSelectorProps) {
  const [branches, setBranches] = React.useState(db.getBranches());
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // تحديث الفروع كل 5 ثوانٍ
    const interval = setInterval(() => {
      setBranches(db.getBranches());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // تحديد الفرع الأول كافتراضي
  React.useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const currentBranch = branches.find(b => b.id === selectedBranch);

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    setIsOpen(false);
  };

  if (!currentBranch) return null;

  return (
    <div className="relative">
      {/* زر عرض الفرع - Compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 transition-all duration-200 group"
      >
        <MapPin size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
        <div className="text-right">
          <div className="text-xs text-gray-500 leading-none">{lang === 'ar' ? 'الفرع' : 'Branch'}</div>
          <div className="text-xs font-semibold text-gray-800 leading-tight">{currentBranch.name}</div>
        </div>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* قائمة الفروع */}
      {isOpen && (
        <>
          {/* خلفية شفافة للإغلاق */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* القائمة */}
          <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* رأس القائمة */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={18} />
                  <span className="font-semibold">{lang === 'ar' ? 'اختر الفرع' : 'Select Branch'}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* قائمة الفروع */}
            <div className="max-h-96 overflow-y-auto">
              {branches.map((branch) => {
                const isActive = branch.id === selectedBranch;
                const occupancy = branch.cashierOccupancy;
                const capacity = branch.cashierCapacity;
                const isFull = occupancy >= capacity;

                return (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchSelect(branch.id)}
                    className={`w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{branch.name}</span>
                          <span className="text-xs text-gray-500">({branch.code})</span>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                              {lang === 'ar' ? 'نشط' : 'Active'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{lang === 'ar' ? 'الكاشير:' : 'Cashier:'}</span>
                            <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                              {occupancy}/{capacity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{lang === 'ar' ? 'الحالة:' : 'Status:'}</span>
                            <span className={`font-semibold ${
                              branch.operationalStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {branch.operationalStatus === 'ACTIVE' 
                                ? (lang === 'ar' ? 'نشط' : 'Active')
                                : (lang === 'ar' ? 'متوقف' : 'Paused')
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* تذييل القائمة */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center">
              {lang === 'ar' ? `${branches.length} فروع متاحة` : `${branches.length} branches available`}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
