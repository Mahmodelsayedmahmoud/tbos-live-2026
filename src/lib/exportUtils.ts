// أدوات التصدير إلى Excel و PDF
import * as XLSX from 'xlsx';

// تصدير إلى Excel
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // تعديل عرض الأعمدة
    const columns = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = columns;
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

// تصدير إلى CSV
export function exportToCSV(data: any[], filename: string): void {
  try {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // التعامل مع القيم التي تحتوي على فواصل أو علامات اقتباس
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // إضافة BOM لدعم UTF-8 في Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}

// تصدير إلى PDF (باستخدام window.print)
export function exportToPDF(elementId: string, filename: string): void {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    // نسخ الأنماط
    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>${filename}</title>
        <style>
          ${styles}
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>${filename}</h1>
        <p>تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}</p>
        ${element.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    
    // انتظار تحميل المحتوى ثم الطباعة
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}

// تصدير بيانات الرحلات
export function exportTripsReport(trips: any[], filename: string = 'تقرير_الرحلات'): void {
  const reportData = trips.map(trip => ({
    'رقم الرحلة': trip.tripNumber,
    'المندوب': trip.courierName || '-',
    'الفرع': trip.branchName || '-',
    'وقت الوصول': trip.arrivalAt ? new Date(trip.arrivalAt).toLocaleString('ar-EG') : '-',
    'المرحلة الحالية': trip.currentStage || '-',
    'الحالة': trip.status || '-',
    'وقت الإكمال': trip.completedAt ? new Date(trip.completedAt).toLocaleString('ar-EG') : '-',
  }));

  exportToExcel(reportData, filename, 'الرحلات');
}

// تصدير بيانات المندوبين
export function exportCouriersReport(couriers: any[], filename: string = 'تقرير_المندوبين'): void {
  const reportData = couriers.map(courier => ({
    'الكود': courier.code,
    'الاسم': courier.name,
    'الهاتف': courier.phone || '-',
    'الفرع': courier.branchName || '-',
    'الحالة': courier.status || '-',
  }));

  exportToExcel(reportData, filename, 'المندوبين');
}

// تصدير بيانات الوارد
export function exportInboundReport(inbounds: any[], filename: string = 'تقرير_الوارد'): void {
  const reportData = inbounds.map(inbound => ({
    'رقم الوارد': inbound.inboundNumber,
    'السائق': inbound.driverName,
    'كود السائق': inbound.driverCode,
    'رقم الحاوية': inbound.containerNumber,
    'نوع الحاوية': inbound.containerType,
    'الفرع': inbound.branchName || '-',
    'الحالة': inbound.status,
    'وقت البدء': inbound.startedAt ? new Date(inbound.startedAt).toLocaleString('ar-EG') : '-',
    'وقت الانتهاء': inbound.completedAt ? new Date(inbound.completedAt).toLocaleString('ar-EG') : '-',
    'عدد الأصناف': inbound.items?.length || 0,
  }));

  exportToExcel(reportData, filename, 'الوارد');
}

// تصدير تقرير الأداء
export function exportPerformanceReport(performances: any[], filename: string = 'تقرير_الأداء'): void {
  const reportData = performances.map(perf => ({
    'رقم الرحلة': perf.tripNumber,
    'المندوب': perf.courier,
    'الفرع': perf.branch,
    'وقت الوصول': perf.arrivalTime ? new Date(perf.arrivalTime).toLocaleString('ar-EG') : '-',
    'الحالة': perf.status,
    'ENTRY (دقيقة)': Math.round((perf.stageDurations?.ENTRY || 0) / 60),
    'DOCK (دقيقة)': Math.round((perf.stageDurations?.DOCK || 0) / 60),
    'PREPARATION (دقيقة)': Math.round((perf.stageDurations?.PREPARATION || 0) / 60),
    'INVENTORY (دقيقة)': Math.round((perf.stageDurations?.INVENTORY || 0) / 60),
    'LOADING (دقيقة)': Math.round((perf.stageDurations?.LOADING || 0) / 60),
    'CASHIER (دقيقة)': Math.round((perf.stageDurations?.CASHIER || 0) / 60),
    'الوقت الإجمالي (دقيقة)': Math.round((perf.totalTime || 0) / 60),
  }));

  exportToExcel(reportData, filename, 'الأداء');
}

// تصدير سجل الأنشطة
export function exportAuditLog(logs: any[], filename: string = 'سجل_الأنشطة'): void {
  const reportData = logs.map(log => ({
    'التاريخ': new Date(log.timestamp).toLocaleString('ar-EG'),
    'المستخدم': log.userName,
    'الدور': log.userRole,
    'النوع': log.type,
    'الوصف': log.description,
  }));

  exportToExcel(reportData, filename, 'الأنشطة');
}
