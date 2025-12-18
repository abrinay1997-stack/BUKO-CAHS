# 🔒 AUDITORÍA DE SEGURIDAD - BukoCash

**Fecha:** 2025-12-18
**Estado:** CRÍTICO - Requiere Acción Inmediata

---

## ⚠️ RESUMEN EJECUTIVO

La aplicación BukoCash tiene **vulnerabilidades críticas de seguridad** que permiten:
- ❌ Cualquier usuario puede acceder a los datos de TODOS los usuarios
- ❌ No hay autenticación real de usuarios
- ❌ Todos los datos están en localStorage sin encriptación
- ❌ La "sincronización en la nube" es FALSA

**RIESGO:** CRÍTICO
**IMPACTO:** Los datos financieros de todos los usuarios están completamente expuestos

---

## 🔍 PROBLEMAS ENCONTRADOS

### 1. ❌ NO HAY AUTENTICACIÓN DE USUARIOS

**Archivo:** `store/useStore.ts:9-10, 22, 50, 63`

```typescript
user: any | null;  // ← Puede ser cualquier cosa
setUser: (user: any) => void;
```

**Problema:**
- El campo `user` puede ser `null` o cualquier objeto
- No hay proceso de login/registro
- No hay verificación de identidad
- No hay tokens de autenticación

**Impacto:**
- Cualquier persona que abra la app puede acceder
- No hay forma de distinguir entre usuarios
- Imposible implementar multi-usuario

---

### 2. ❌ DATOS EN LOCALSTORAGE SIN PROTECCIÓN

**Archivo:** `store/useStore.ts:45, 210-215`

```typescript
const STORAGE_KEY = 'bukocash-storage-v2';

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage), // ← TODO EN LOCALSTORAGE
    }
  )
);
```

**Problema:**
- TODAS las transacciones, wallets, categorías están en localStorage
- No está encriptado
- Cualquier persona con acceso al navegador puede leer los datos
- Vulnerable a ataques XSS
- Los datos no están asociados a usuarios específicos

**Impacto:**
- Datos financieros expuestos en texto plano
- Un script malicioso puede robar toda la información
- No se puede compartir dispositivo entre usuarios
- Los datos se pierden si se limpia el cache

---

### 3. ❌ SINCRONIZACIÓN FALSA CON LA NUBE

**Archivo:** `store/useStore.ts:180-187`

```typescript
syncWithCloud: async () => {
  if (!navigator.onLine) {
    set({ isSyncing: false });
    return;
  }
  await new Promise(resolve => setTimeout(resolve, 1200)); // ← FAKE!
  set({ isSyncing: false, lastSynced: new Date().toISOString() });
},
```

**Problema:**
- `syncWithCloud()` NO hace nada real
- Solo espera 1.2 segundos y marca como sincronizado
- No hay integración con Supabase
- El mensaje "Sincronización Activa" en la UI es MENTIRA

**Archivo:** `views/Settings.tsx:78-94`

```typescript
{/* Cloud Account Card */}
<GlassCard className="p-5 flex items-center justify-between border-cyan-500/20 bg-cyan-500/5">
  <div className="flex items-center gap-4">
    {/* ... */}
    <div>
      <h3 className="font-black text-white text-sm tracking-tight">{user?.email || 'Usuario Cloud'}</h3>
      <div className="flex items-center gap-1.5 mt-0.5">
        <Cloud size={10} className="text-emerald-400" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronización Activa</p>
        {/* ↑ ESTO ES MENTIRA */}
      </div>
    </div>
  </div>
</GlassCard>
```

**Impacto:**
- Los usuarios CREEN que sus datos están en la nube
- Si pierden el dispositivo, pierden TODOS sus datos
- No hay backup real
- No hay sincronización entre dispositivos

---

### 4. ✅ ELIMINADO: Prueba de Velocidad

**Archivo:** `components/modals/SpeedTestModal.tsx` (ELIMINADO)

**Problema:**
- Módulo de "test de velocidad de internet" sin relación con finanzas
- Consumía recursos innecesarios

**Solución:**
- ✅ Archivo eliminado completamente
- ✅ Imports eliminados de Settings.tsx
- ✅ Sección "Rendimiento Cloud" eliminada
- ✅ Build verificado y funcional

---

### 5. ⚠️ SEGURIDAD LOCAL INSUFICIENTE

**Archivo:** `components/SecurityLock.tsx`

**Problema:**
- Solo hay un PIN de 4 dígitos almacenado en localStorage
- No hay encriptación de datos con el PIN
- El PIN solo "bloquea la pantalla" pero no protege los datos
- Los datos siguen siendo accesibles desde DevTools

**Impacto:**
- El PIN da una falsa sensación de seguridad
- Los datos NO están realmente protegidos

---

## ✅ SOLUCIÓN RECOMENDADA: ARQUITECTURA CON SUPABASE

### Paso 1: Configurar Supabase

```bash
npm install @supabase/supabase-js
```

### Paso 2: Crear Schema de Base de Datos

```sql
-- Tabla: users (automática con Supabase Auth)

-- Tabla: wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initial_balance DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT CHECK (type IN ('cash', 'debit', 'credit', 'savings')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  transfer_to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  is_business BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: recurring_rules
CREATE TABLE recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  transfer_to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date TIMESTAMPTZ NOT NULL,
  original_day INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  is_business BOOLEAN DEFAULT FALSE,
  auto_pay BOOLEAN DEFAULT FALSE,
  reminder_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Paso 3: Activar Row Level Security (RLS)

```sql
-- RLS para wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
  ON wallets FOR DELETE
  USING (auth.uid() = user_id);

-- Repetir para categories, transactions, budgets, recurring_rules
-- (mismo patrón: auth.uid() = user_id)
```

### Paso 4: Implementar Autenticación

**Archivo:** `lib/supabase.ts` (NUEVO)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Archivo:** `.env` (NUEVO)

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Paso 5: Modificar useStore.ts

**ANTES (localStorage):**
```typescript
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => localStorage), // ❌ INSEGURO
  }
)
```

**DESPUÉS (Supabase):**
```typescript
// Eliminar persist middleware
// Agregar funciones de sync real:

addTransaction: async (txData) => {
  const newTx = { id: generateId(), ...txData };

  // Guardar en Supabase
  const { error } = await supabase
    .from('transactions')
    .insert({
      ...newTx,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

  if (!error) {
    set((state) => ({
      transactions: [newTx, ...state.transactions]
    }));
  }
},
```

### Paso 6: Implementar Login/Registro

**Archivo:** `views/Login.tsx` (NUEVO)

```typescript
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      // Usuario autenticado
      // Cargar datos desde Supabase
    }
  };

  return (
    <div>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
  );
};
```

### Paso 7: Cache Offline (Opcional)

```typescript
// Solo usar localStorage como CACHE temporal
// Sincronizar con Supabase cuando haya conexión

const syncFromSupabase = async () => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return;

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.data.user.id);

  // Guardar en localStorage como cache
  localStorage.setItem('transactions_cache', JSON.stringify(transactions));
};
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Setup Básico (2-3 horas)
- [ ] Crear proyecto en Supabase
- [ ] Configurar tablas y RLS
- [ ] Instalar @supabase/supabase-js
- [ ] Crear archivo de configuración

### Fase 2: Autenticación (2-3 horas)
- [ ] Crear pantalla de Login/Registro
- [ ] Implementar signup con email/password
- [ ] Implementar login
- [ ] Implementar logout
- [ ] Proteger rutas (require auth)

### Fase 3: Migrar Store (4-6 horas)
- [ ] Remover persist middleware
- [ ] Implementar addTransaction con Supabase
- [ ] Implementar updateTransaction con Supabase
- [ ] Implementar deleteTransaction con Supabase
- [ ] Repetir para wallets, categories, budgets, recurring_rules

### Fase 4: Sincronización Real (2-3 horas)
- [ ] Implementar carga inicial desde Supabase
- [ ] Implementar sync en tiempo real (opcional: Supabase Realtime)
- [ ] Implementar cache offline con localStorage

### Fase 5: Testing y Deploy (2-3 horas)
- [ ] Testear multi-usuario
- [ ] Verificar RLS funciona
- [ ] Migrar datos existentes (si aplica)
- [ ] Deploy a producción

**TIEMPO TOTAL ESTIMADO:** 12-18 horas

---

## 🚨 RECOMENDACIONES INMEDIATAS

1. **NO lanzar a producción sin implementar autenticación**
2. **Agregar aviso de "Datos solo en este dispositivo"** hasta implementar Supabase
3. **Cambiar mensaje "Sincronización Activa"** por "Solo Local" para no engañar
4. **Implementar Supabase lo antes posible**

---

## 📚 RECURSOS

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

---

**Auditoría completada por:** Claude Code
**Próximos pasos:** Implementar arquitectura con Supabase
