# ✅ تم تعديل منطق الطابور (Queue Logic) بنجاح!

## 🎯 التعديلات المنفذة

تم تعديل منطق الطابور لضمان إدراج الرحلات تلقائياً في قائمة الانتظار عند قرار "انتظر على الرصيف" (WAIT_CASHIER).

---

## 🔄 دورة العمل الجديدة

### السيناريو: الكاشير ممتلئ

```
1. المندوب يصل ويبدأ الرحلة
   ↓
2. يمر بمراحل: ENTRY → DOCK → PREPARATION → INVENTORY → LOADING
   ↓
3. ينتهي من مرحلة LOADING
   ↓
4. Decision Engine يتحقق من حالة الكاشير
   ↓
5. الكاشير ممتلئ (cashierOccupancy >= cashierCapacity)
   ↓
6. يتخذ قرار: WAIT_CASHIER
   ↓
7. ✅ يتم إضافة الرحلة إلى الطابور تلقائياً
   ↓
8. ✅ تتغير حالة الرحلة إلى WAITING
   ↓
9. ✅ تتغير حالة المندوب إلى WAITING
   ↓
10. ✅ تظهر الرحلة في قائمة الطابور
    ↓
11. ✅ يظهر عداد المنتظرين في صفحة الكاشير
    ↓
12. ينتظر حتى يفرغ مكان في الكاشير
    ↓
13. مندوب آخر ينهي مرحلة CASHIER
    ↓
14. ✅ يتم ترقية الرحلة التالية من الطابور تلقائياً
    ↓
15. ✅ تتغير حالة الرحلة إلى ACTIVE
    ↓
16. ✅ تبدأ مرحلة CASHIER تلقائياً
    ↓
17. ✅ تتغير حالة المندوب إلى IN_CASHIER
    ↓
18. ينهي مرحلة CASHIER
    ↓
19. تتغير حالة الرحلة إلى COMPLETED
    ↓
20. تتغير حالة المندوب إلى AVAILABLE
```

---

## 📝 التعديلات في الكود

### 1. **إضافة دالة `addToQueue`**

```typescript
export function addToQueue(tripId: string, branchId: string, priority: number = 5): QueueRecord | null {
  // التحقق من عدم وجود الرحلة في الطابور بالفعل
  const existing = state.queue.find(q => q.tripId === tripId && q.status === 'WAITING');
  if (existing) {
    return existing;
  }

  // حساب رقم الطابور التالي
  const branchQueue = state.queue.filter(q => q.branchId === branchId);
  const maxQueueNumber = branchQueue.length > 0 
    ? Math.max(...branchQueue.map(q => q.queueNumber))
    : 0;

  const queueRecord: QueueRecord = {
    id: generateId(),
    tripId,
    branchId,
    queueNumber: maxQueueNumber + 1,
    priority,
    enteredAt: new Date().toISOString(),
    status: 'WAITING',
  };

  state.queue.push(queueRecord);
  saveState(state);
  
  return queueRecord;
}
```

**المميزات:**
- ✅ التحقق من عدم التكرار
- ✅ حساب رقم الطابور تلقائياً
- ✅ حفظ وقت الدخول
- ✅ تحديد الأولوية

---

### 2. **إضافة دالة `promoteFromQueue`**

```typescript
export function promoteFromQueue(branchId: string): QueueRecord | null {
  const branch = state.branches.find(b => b.id === branchId);
  if (!branch) return null;

  // التحقق من وجود مساحة في الكاشير
  if (branch.cashierOccupancy >= branch.cashierCapacity) {
    return null;
  }

  // الحصول على أول رحلة في الطابور (حسب الأولوية ثم وقت الدخول)
  const waitingQueue = state.queue
    .filter(q => q.branchId === branchId && q.status === 'WAITING')
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
    });

  if (waitingQueue.length === 0) {
    return null;
  }

  const nextInQueue = waitingQueue[0];
  
  // تحديث حالة الطابور
  nextInQueue.status = 'PROMOTED';
  
  // زيادة إشغال الكاشير
  branch.cashierOccupancy++;
  
  // تحديث حالة الرحلة
  const trip = state.trips.find(t => t.id === nextInQueue.tripId);
  if (trip) {
    trip.status = 'ACTIVE';
    trip.currentStage = 'CASHIER';
    
    // بدء مرحلة الكاشير
    const cashierStage = state.tripStages.find(s => s.tripId === trip.id && s.stage === 'CASHIER');
    if (cashierStage) {
      cashierStage.status = 'IN_PROGRESS';
      cashierStage.startedAt = new Date().toISOString();
    }
    
    // تحديث حالة المندوب
    const courier = state.couriers.find(c => c.id === trip.courierId);
    if (courier) {
      courier.status = 'IN_CASHIER';
    }
  }
  
  saveState(state);
  return nextInQueue;
}
```

**المميزات:**
- ✅ التحقق من وجود مساحة في الكاشير
- ✅ ترتيب حسب الأولوية ثم وقت الدخول
- ✅ ترقية الرحلة التالية تلقائياً
- ✅ بدء مرحلة الكاشير تلقائياً
- ✅ تحديث جميع الحالات

---

### 3. **تعديل دالة `runDecisionEngine`**

```typescript
} else if (branch.cashierOccupancy >= branch.cashierCapacity) {
  decision = 'WAIT_CASHIER';
  reasonAr = 'الكاشير ممتلئ - انتظر على الرصيف';
  reasonEn = 'Cashier full - wait on dock';
  
  // ✅ إضافة الرحلة إلى الطابور تلقائياً
  const queueRecord = addToQueue(tripId, branch.id, 5);
  
  // ✅ تحديث حالة الرحلة إلى WAITING
  trip.status = 'WAITING';
  
  // ✅ تحديث حالة المندوب إلى WAITING
  const courier = state.couriers.find(c => c.id === trip.courierId);
  if (courier) {
    courier.status = 'WAITING';
  }
  
  // ✅ حفظ queueId في القرار
  const sysDecision: SystemDecision = {
    id: generateId(),
    tripId,
    branchId: branch.id,
    decision,
    reasonAr,
    reasonEn,
    priority: 5,
    queueId: queueRecord ? queueRecord.id : null,
    createdAt: new Date().toISOString(),
  };
  state.decisions.push(sysDecision);
  saveState(state);
  
  return sysDecision;
}
```

**التحسينات:**
- ✅ إضافة الرحلة إلى الطابور تلقائياً
- ✅ تحديث حالة الرحلة
- ✅ تحديث حالة المندوب
- ✅ حفظ queueId في القرار

---

### 4. **تعديل دالة `finishStage`**

```typescript
if (stage === 'CASHIER') {
  trip.status = 'COMPLETED';
  trip.completedAt = now.toISOString();
  const courier = state.couriers.find(c => c.id === trip.courierId);
  if (courier) courier.status = 'AVAILABLE';
  
  // ✅ تقليل إشغال الكاشير
  const branch = state.branches.find(b => b.id === trip.branchId);
  if (branch && branch.cashierOccupancy > 0) {
    branch.cashierOccupancy--;
    
    // ✅ ترقية الرحلة التالية من الطابور تلقائياً
    promoteFromQueue(branch.id);
  }
}
```

**التحسينات:**
- ✅ تقليل إشغال الكاشير
- ✅ ترقية الرحلة التالية تلقائياً

---

### 5. **تحسين دالة `getQueue`**

```typescript
export function getQueue(branchId?: string): QueueRecord[] {
  let items = [...state.queue];
  if (branchId) items = items.filter(q => q.branchId === branchId);
  return items.sort((a, b) => {
    // ✅ ترتيب حسب الأولوية ثم حسب وقت الدخول
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.enteredAt).getTime() - new Date(b.enteredAt).getTime();
  });
}
```

**التحسينات:**
- ✅ ترتيب تلقائي حسب الأولوية
- ✅ ترتيب حسب وقت الدخول

---

## 📊 عرض الطابور في الواجهة

### صفحة الكاشير (CashierPage)

```typescript
const queueCount = db.getQueue(branch.id).filter(q => q.status === 'WAITING').length;

<div className="mt-3 p-3 bg-orange-50 rounded-lg text-center">
  <p className="text-2xl font-bold text-orange-700">{queueCount}</p>
  <p className="text-xs text-orange-600">{t('queue.waiting', lang)}</p>
</div>
```

**النتيجة:**
- ✅ عداد المنتظرين يتحدث تلقائياً
- ✅ يظهر في كل فرع
- ✅ يتحدث كل 3 ثوانٍ

---

### صفحة الطابور (QueuePage)

```typescript
const waitingQueue = queue.filter(q => q.status === 'WAITING');

<table>
  <thead>
    <tr>
      <th>{t('queue.number', lang)}</th>
      <th>{t('couriers.name', lang)}</th>
      <th>{t('incoming.trip_number', lang)}</th>
      <th>{t('couriers.branch', lang)}</th>
      <th>{t('queue.priority', lang)}</th>
      <th>{t('queue.position', lang)}</th>
      <th>{t('queue.waiting', lang)}</th>
    </tr>
  </thead>
  <tbody>
    {waitingQueue.map((q, idx) => {
      const trip = db.getTrip(q.tripId);
      const courier = trip ? db.getCourier(trip.courierId) : null;
      const branch = db.getBranch(q.branchId);
      return (
        <tr key={q.id}>
          <td className="font-mono font-bold">#{q.queueNumber}</td>
          <td>{courier?.name}</td>
          <td className="font-mono">{trip?.tripNumber}</td>
          <td>{branch?.name}</td>
          <td><span className="badge badge-purple">{q.priority}</span></td>
          <td><span className="badge badge-blue">{idx + 1}</span></td>
          <td><span className="badge badge-orange">{t('queue.waiting', lang)}</span></td>
        </tr>
      );
    })}
  </tbody>
</table>
```

**النتيجة:**
- ✅ جدول شامل للطابور
- ✅ رقم الطابور
- ✅ اسم المندوب
- ✅ رقم الرحلة
- ✅ الفرع
- ✅ الأولوية
- ✅ الموقع في الطابور
- ✅ الحالة

---

## 🎯 أمثلة على الاستخدام

### مثال 1: كاشير ممتلئ

```
الفرع: القاهرة
سعة الكاشير: 3
المشغول: 3 (ممتلئ)

الرحلة TR-0001 تنتهي من LOADING
↓
Decision Engine يتحقق
↓
الكاشير ممتلئ
↓
قرار: WAIT_CASHIER
↓
✅ تُضاف الرحلة إلى الطابور (رقم 1)
✅ حالة الرحلة: WAITING
✅ حالة المندوب: WAITING
↓
تظهر في صفحة الطابور:
┌────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ #  │ المندوب  │ الرحلة   │ الفرع    │ الأولوية │ الموقع   │ الحالة   │
├────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 1  │ أحمد     │ TR-0001  │ القاهرة  │ 5        │ 1        │ ينتظر    │
└────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

تظهر في صفحة الكاشير:
┌─────────────────┐
│ القاهرة         │
│ 3 / 3           │
│ ممتلئ           │
├─────────────────┤
│ 1               │
│ ينتظر           │
└─────────────────┘
```

### مثال 2: ترقية من الطابور

```
الرحلة TR-0002 تنهي CASHIER
↓
✅ تقليل إشغال الكاشير: 3 → 2
✅ ترقية TR-0001 من الطابور
↓
✅ حالة TR-0001: WAITING → ACTIVE
✅ مرحلة TR-0001: CASHIER (IN_PROGRESS)
✅ حالة المندوب: WAITING → IN_CASHIER
↓
تظهر في صفحة الكاشير:
┌─────────────────┐
│ القاهرة         │
│ 3 / 3           │
│ ممتلئ           │
├─────────────────┤
│ 0               │
│ ينتظر           │
├─────────────────┤
│ أحمد - TR-0001  │
└─────────────────┘
```

---

## 📊 إحصائيات البناء

```
✓ 1373 modules transformed
✓ built in 7.68s

Output:
- dist/index.html          3.48 kB  (gzip: 1.49 kB)
- dist/assets/index.css   40.45 kB  (gzip: 7.68 kB)
- dist/assets/index.js   716.84 kB  (gzip: 224.69 kB)
```

**✅ لا توجد أخطاء!**

---

## ✅ ما لم يتم تغييره

- ✅ لا تغيير في الواجهات الحالية
- ✅ لا تغيير في الأزرار الحالية
- ✅ لا تغيير في المسارات الحالية
- ✅ لا تغيير في نظام المصادقة
- ✅ لا تغيير في نظام الصلاحيات
- ✅ لا تغيير في نظام التنبيهات

---

## 🎉 الخلاصة

تم تعديل منطق الطابور بنجاح!

### ✅ ما تم إنجازه:
1. ✅ إضافة دالة `addToQueue` لإدراج الرحلات في الطابور
2. ✅ إضافة دالة `promoteFromQueue` لترقية الرحلات تلقائياً
3. ✅ تعديل `runDecisionEngine` لإضافة الرحلات للطابور عند WAIT_CASHIER
4. ✅ تعديل `finishStage` لترقية الرحلات عند إنهاء CASHIER
5. ✅ تحسين `getQueue` للترتيب التلقائي
6. ✅ تحديث حالة الرحلة والمندوب تلقائياً
7. ✅ البناء ناجح بدون أخطاء

### ✅ النتائج:
- 🔄 إدراج تلقائي في الطابور
- ⚡ ترقية تلقائية من الطابور
- 📊 عداد منتظرين دقيق
- 🎯 عرض صحيح في الواجهة
- 🔄 تحديث فوري كل 3 ثوانٍ

---

**تم تعديل منطق الطابور بنجاح!** 🎉✅

**النظام الآن يدعم الطابور التلقائي بشكل كامل!** 🔄🚀
