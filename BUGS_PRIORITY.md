# 🔥 BUGS PRIORITARIOS - BukoCash

## CORRECCIONES CRÍTICAS ANTES DE SUPABASE

### 🔴 PRIORIDAD CRÍTICA (Bloquean producción)

#### 1. VALIDACIÓN DE SALDO DISPONIBLE
**Riesgo:** Balance negativo, inconsistencias financieras
**Archivos:** `store/useStore.ts:69-77`
**Tiempo:** 15 min

**Antes:**
```typescript
addTransaction: (txData) => {
  const newTx = { id: generateId(), ...txData };
  set((state) => ({
    transactions: [newTx, ...state.transactions],
    wallets: applyTransactionToWallets(state.wallets, newTx)
  }));
}
```

**Después:**
```typescript
addTransaction: (txData) => {
  const state = get();

  if (txData.type === 'expense' || txData.type === 'transfer') {
    const wallet = state.wallets.find(w => w.id === txData.walletId);
    if (!wallet || wallet.balance < txData.amount) {
      throw new Error('Saldo insuficiente');
    }
  }

  const newTx = { id: generateId(), ...txData };
  set((state) => ({
    transactions: [newTx, ...state.transactions],
    wallets: applyTransactionToWallets(state.wallets, newTx)
  }));
}
```

---

#### 2. TRANSFER A SÍ MISMO
**Riesgo:** Lógica incorrecta, confusión del usuario
**Archivos:** `components/modals/TransactionModal.tsx`
**Tiempo:** 5 min

**Antes:**
```typescript
<select value={transferToWalletId}>
  {wallets.map(w => <option value={w.id}>{w.name}</option>)}
</select>
```

**Después:**
```typescript
<select value={transferToWalletId}>
  {wallets
    .filter(w => w.id !== walletId)
    .map(w => <option value={w.id}>{w.name}</option>)
  }
</select>
```

---

#### 3. VALIDACIÓN DE AMOUNTS
**Riesgo:** Transacciones con $0 o negativas
**Archivos:** `components/modals/TransactionModal.tsx`
**Tiempo:** 10 min

**Agregar en handleSubmit:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const amt = parseFloat(amount);
  if (!amt || amt <= 0) {
    alert('El monto debe ser mayor a cero');
    return;
  }

  // ... resto del código
};
```

---

#### 4. TIMEZONE ISSUES
**Riesgo:** Transacciones en fecha incorrecta
**Archivos:** `utils/formatting.ts`, `store/useStore.ts`, `hooks/useDashboardData.ts`
**Tiempo:** 30 min

**Crear helper en formatting.ts:**
```typescript
export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getLocalDateTimeString = (date?: Date): string => {
  const d = date || new Date();
  const dateStr = getLocalDateString(d);
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  return `${dateStr}T${timeStr}`;
};
```

**Reemplazar en store:**
```typescript
// ANTES:
date: txData.date || new Date().toISOString()

// DESPUÉS:
date: txData.date || getLocalDateTimeString()
```

---

#### 5. TRANSACTION GROUPING BUG
**Riesgo:** Transacciones no se agrupan correctamente por fecha
**Archivos:** `hooks/useDashboardData.ts:100`
**Tiempo:** 5 min

**Antes:**
```typescript
const grouped = transactions.reduce((acc, tx) => {
  const date = tx.date; // "2025-12-18T14:30:00.000Z"
  if (!acc[date]) acc[date] = [];
  acc[date].push(tx);
  return acc;
}, {});
```

**Después:**
```typescript
const grouped = transactions.reduce((acc, tx) => {
  const date = tx.date.split('T')[0]; // "2025-12-18"
  if (!acc[date]) acc[date] = [];
  acc[date].push(tx);
  return acc;
}, {} as Record<string, Transaction[]>);
```

---

### 🟡 PRIORIDAD ALTA (Mejoran seguridad/UX)

#### 6. PIN SECURITY LOCKOUT
**Riesgo:** Brute force attacks, seguridad débil
**Archivos:** `components/SecurityLock.tsx`
**Tiempo:** 20 min

**Agregar estado:**
```typescript
const [failedAttempts, setFailedAttempts] = useState(0);
const [lockedUntil, setLockedUntil] = useState<number | null>(null);
```

**Modificar handleSubmit:**
```typescript
const handleSubmit = (pin: string) => {
  // Check lockout
  if (lockedUntil && Date.now() < lockedUntil) {
    const remainingSeconds = Math.ceil((lockedUntil - Date.now()) / 1000);
    alert(`Bloqueado. Intenta en ${remainingSeconds} segundos.`);
    return;
  }

  if (pin === savedPin) {
    setFailedAttempts(0);
    setLockedUntil(null);
    onUnlock();
  } else {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= 3) {
      const lockTime = Date.now() + (5 * 60 * 1000); // 5 minutos
      setLockedUntil(lockTime);
      alert('Demasiados intentos fallidos. Bloqueado por 5 minutos.');
    }

    setError(true);
  }
};
```

---

#### 7. VALIDACIÓN EN updateTransaction
**Riesgo:** Editar transacción puede dejar balance negativo
**Archivos:** `store/useStore.ts:79-89`
**Tiempo:** 10 min

**Agregar validación similar a addTransaction:**
```typescript
updateTransaction: (id, updatedData) => {
  const state = get();
  const oldTx = state.transactions.find(t => t.id === id);
  if (!oldTx) return;

  const newTx = { ...oldTx, ...updatedData };

  // Validar saldo si cambia el tipo o monto
  if (newTx.type === 'expense' || newTx.type === 'transfer') {
    const walletsAfterRevert = revertTransactionFromWallets(state.wallets, oldTx);
    const wallet = walletsAfterRevert.find(w => w.id === newTx.walletId);

    if (!wallet || wallet.balance < newTx.amount) {
      throw new Error('Saldo insuficiente para esta modificación');
    }
  }

  // ... resto del código
}
```

---

### 🟢 PRIORIDAD MEDIA (Nice to have)

#### 8. DUPLICATE RESET BUTTON
**Archivos:** `views/Settings.tsx:90`
**Tiempo:** 1 min

Remover uno de los dos botones de reset.

---

#### 9. RECURRING TRANSACTION LIMIT
**Archivos:** `utils/financeCore.ts:129`
**Tiempo:** 2 min

```typescript
// ANTES:
while (nextDue <= now && iterations < 12) {

// DESPUÉS:
while (nextDue <= now && iterations < 24) { // Aumentar a 2 años
```

---

#### 10. SAFE TO SPEND - INCLUDE INCOME
**Archivos:** `utils/financeCore.ts:32-51`
**Tiempo:** 15 min

Modificar para también considerar ingresos recurrentes pendientes.

---

## 📊 RESUMEN

| # | Bug | Prioridad | Tiempo | Archivos |
|---|-----|-----------|--------|----------|
| 1 | Validación saldo | 🔴 Crítica | 15 min | useStore.ts |
| 2 | Transfer a sí mismo | 🔴 Crítica | 5 min | TransactionModal.tsx |
| 3 | Validación amounts | 🔴 Crítica | 10 min | TransactionModal.tsx |
| 4 | Timezone issues | 🔴 Crítica | 30 min | formatting.ts, useStore.ts, hooks |
| 5 | Transaction grouping | 🔴 Crítica | 5 min | useDashboardData.ts |
| 6 | PIN security | 🟡 Alta | 20 min | SecurityLock.tsx |
| 7 | Validación update | 🟡 Alta | 10 min | useStore.ts |
| 8 | Duplicate button | 🟢 Media | 1 min | Settings.tsx |
| 9 | Recurring limit | 🟢 Media | 2 min | financeCore.ts |
| 10 | Safe to spend | 🟢 Media | 15 min | financeCore.ts |

**TIEMPO TOTAL BUGS CRÍTICOS:** ~1.5 horas
**TIEMPO TOTAL BUGS ALTOS:** ~2 horas
**TIEMPO TOTAL COMPLETO:** ~2.5 horas

---

## 🎯 PLAN DE EJECUCIÓN

### Fase 1: Bugs Críticos (1.5 horas)
```bash
1. Validación de saldo disponible (15min)
2. Transfer a sí mismo (5min)
3. Validación de amounts (10min)
4. Timezone issues (30min)
5. Transaction grouping (5min)
```

### Fase 2: Testing (30 min)
```bash
- Test flujos críticos
- Test regresión
- Test edge cases
```

### Fase 3: Bugs Altos (30 min)
```bash
6. PIN security lockout (20min)
7. Validación en update (10min)
```

### Fase 4: Deploy & Review (15 min)
```bash
- Build final
- Commit & push
- Revisión de cambios
```

**TOTAL: 2.5-3 horas**

Después de esto, la aplicación estará **lista para integrar Supabase** sin problemas de lógica básica.
