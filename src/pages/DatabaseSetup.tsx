import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, Database, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs_setup' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [tables, setTables] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [sqlContent, setSqlContent] = useState('');

  useEffect(() => {
    checkDatabase();
    loadSqlContent();
  }, []);

  const loadSqlContent = async () => {
    try {
      const response = await fetch('/setup-database.sql');
      const content = await response.text();
      setSqlContent(content);
    } catch (error) {
      console.error('Failed to load SQL:', error);
    }
  };

  const checkDatabase = async () => {
    setStatus('checking');
    setMessage('جاري فحص قاعدة البيانات...');

    if (!isSupabaseConfigured() || !supabase) {
      setStatus('error');
      setMessage('❌ Supabase غير مُعدّ بشكل صحيح');
      return;
    }

    try {
      // فحص وجود جدول الفروع
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .limit(1);

      if (branchesError) {
        setStatus('needs_setup');
        setMessage('⚠️ قاعدة البيانات غير مُعدّة. يرجى تنفيذ السكريبت أدناه.');
        return;
      }

      // فحص جميع الجداول
      const requiredTables = [
        'branches', 'couriers', 'trips', 'trip_stages', 
        'queue', 'decisions', 'inbound', 'inbound_items', 
        'users', 'audit_logs'
      ];

      const existingTables: string[] = [];
      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
          existingTables.push(table);
        }
      }

      setTables(existingTables);

      if (existingTables.length === requiredTables.length) {
        setStatus('ready');
        setMessage(`✅ قاعدة البيانات جاهزة! جميع الجداول (${existingTables.length}) موجودة.`);
      } else {
        setStatus('needs_setup');
        setMessage(`⚠️ تم العثور على ${existingTables.length}/${requiredTables.length} جداول. يرجى تنفيذ السكريبت.`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ خطأ في الاتصال: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard/project/jkzgpfjaovqxxtrkxalu/sql/new', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl mb-4">
            <Database size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            إعداد قاعدة البيانات
          </h1>
          <p className="text-gray-600">تفعيل المزامنة اللحظية بين الأجهزة</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            {status === 'checking' && <Loader size={32} className="text-blue-500 animate-spin" />}
            {status === 'ready' && <CheckCircle size={32} className="text-green-500" />}
            {status === 'needs_setup' && <AlertTriangle size={32} className="text-yellow-500" />}
            {status === 'error' && <XCircle size={32} className="text-red-500" />}
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{message}</h2>
              
              {status === 'ready' && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">الجداول الموجودة:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {tables.map(table => (
                      <div key={table} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                        ✓ {table}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 font-medium">
                      🎉 قاعدة البيانات جاهزة! التطبيق سيعمل مع المزامنة اللحظية بين جميع الأجهزة.
                    </p>
                    <button
                      onClick={() => window.location.href = '/#/login'}
                      className="mt-3 btn btn-primary w-full"
                    >
                      الانتقال إلى التطبيق
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Setup Instructions */}
          {(status === 'needs_setup' || status === 'error') && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-3">📋 خطوات الإعداد:</h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>انقر على الزر أدناه لفتح Supabase SQL Editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>انسخ السكريبت بالكامل (زر النسخ أدناه)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>الصق السكريبت في SQL Editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>انقر على "Run" أو اضغط Ctrl+Enter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">5.</span>
                    <span>انتظر حتى تظهر رسالة النجاح</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">6.</span>
                    <span>انقر على "إعادة الفحص" أدناه</span>
                  </li>
                </ol>
              </div>

              {/* Connection Info */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-2">🔐 بيانات الاتصال:</h4>
                <div className="space-y-1 text-xs font-mono">
                  <p><span className="text-gray-600">URL:</span> <span className="text-indigo-600">{SUPABASE_URL}</span></p>
                  <p><span className="text-gray-600">Key:</span> <span className="text-indigo-600">{SUPABASE_ANON_KEY.substring(0, 30)}...</span></p>
                </div>
              </div>

              {/* SQL Content */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 text-sm">📄 سكريبت SQL</span>
                  <button
                    onClick={copySql}
                    className="btn btn-outline text-xs"
                  >
                    <Copy size={14} />
                    {copied ? 'تم النسخ!' : 'نسخ السكريبت'}
                  </button>
                </div>
                <pre className="p-4 bg-gray-900 text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {sqlContent || 'جاري تحميل السكريبت...'}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={openSupabase}
                  className="btn btn-primary flex-1"
                >
                  <ExternalLink size={18} />
                  فتح Supabase SQL Editor
                </button>
                <button
                  onClick={checkDatabase}
                  className="btn btn-outline flex-1"
                >
                  <Loader size={18} />
                  إعادة الفحص
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Database size={20} className="text-indigo-500" />
            ما الذي سيحدث بعد التنفيذ؟
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-2">📊 10 جداول</h4>
              <p className="text-sm text-blue-800">
                branches, couriers, trips, trip_stages, queue, decisions, inbound, inbound_items, users, audit_logs
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-green-900 mb-2">🔒 أمان كامل</h4>
              <p className="text-sm text-green-800">
                Row Level Security (RLS) مفعل على جميع الجداول مع سياسات وصول آمنة
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <h4 className="font-semibold text-purple-900 mb-2">🔄 مزامنة لحظية</h4>
              <p className="text-sm text-purple-800">
                Realtime مفعل على 8 جداول للمزامنة الفورية بين جميع الأجهزة
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <h4 className="font-semibold text-orange-900 mb-2">🌱 بيانات أولية</h4>
              <p className="text-sm text-orange-800">
                3 فروع، 5 مندوبين، 6 مستخدمين جاهزين للاستخدام الفوري
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
