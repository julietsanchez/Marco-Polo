# Shared Budget

MVP de webapp de finanzas compartida para 2 socios. Dashboard + Historial, carga manual. Deploy en Vercel, DB en Supabase (free tier).

## Stack

- **Next.js 15** (App Router) + TypeScript
- **TailwindCSS**
- **Supabase Postgres** (`@supabase/supabase-js`) con autenticación de usuarios
- **Supabase Auth** para login y protección de rutas

## Env vars

Copiar `.env.local.example` a `.env.local` y completar:

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública para autenticación del cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server; nunca en client |

## Base de datos (Supabase)

1. Crear proyecto en [Supabase](https://supabase.com).
2. En **SQL Editor**, ejecutar el contenido de `supabase/schema.sql`.
3. Tablas: `app_state` (saldo), `items` (movimientos, recurrentes, a cobrar, a pagar).
4. Si ya tenías la BD con la columna `status` en `items`, ejecutá antes la migración `supabase/migrations/001_remove_status_column.sql`.

**Nota:** La autenticación está implementada usando Supabase Auth. Los usuarios deben iniciar sesión para acceder a la aplicación.

## Desarrollo

```bash
npm install
cp .env.local.example .env.local   # completar con valores reales
npm run dev
```

Acceder a `http://localhost:3000/login` e iniciar sesión con las credenciales de usuario.

### Preview con tu proyecto MCP (`guiaslfdkflknkhwciib`)

MCP: `https://mcp.supabase.com/mcp?project_ref=guiaslfdkflknkhwciib`

`.env.local` está configurado para tu proyecto (`NEXT_PUBLIC_SUPABASE_URL`, `APP_SECRET=preview-secret`).

1. **Schema:** Si aún no lo corriste, ejecutá `supabase/schema.sql` en el [SQL Editor](https://supabase.com/dashboard/project/guiaslfdkflknkhwciib/sql/new) del proyecto, o:
   ```bash
   DATABASE_URL="postgresql://postgres:TU_PASS@db.guiaslfdkflknkhwciib.supabase.co:5432/postgres" npm run db:setup
   ```
2. **Service Role Key:** En [Settings → API](https://supabase.com/dashboard/project/guiaslfdkflknkhwciib/settings/api), revelá **service_role** (secret), copialo y pegá en `.env.local` como `SUPABASE_SERVICE_ROLE_KEY=eyJ...`.
3. `npm run dev` y abrí `http://localhost:3000?k=preview-secret`.

## Verificación

```bash
npm run verify   # typecheck + lint + build
```

Comprobación manual: levantar `npm run dev`, abrir `/?k=APP_SECRET`, agregar movimiento, recurrente, a cobrar, a pagar, editar saldo, marcar a cobrar/pagar como hecho y revisar historial.

## Deploy (Vercel)

1. Conectar repo a Vercel.
2. Configurar las mismas env vars en el proyecto.
3. Deploy. La app está protegida por **Supabase Auth** (login); no hace falta protección extra de Vercel.

### Si sigue saliendo "Agregá ?k=APP_SECRET a la URL"

Ese mensaje lo muestra **Vercel** (Deployment Protection), no este código. Para que desaparezca:

1. **Vercel Dashboard** → tu proyecto → **Settings** → **Deployment Protection** (o **Security** → **Deployment Protection**).
2. Desactivar protección para **Production** y también para **Preview** (los previews tienen su propia opción; si la URL es de una rama, suele ser preview).
3. **Guardar** y esperar unos segundos. Probar en **ventana de incógnito** o **otro navegador** por si era caché.
4. Si usás un dominio tipo `xxx-teal.vercel.app`, confirmá que ese proyecto es el que editaste y que el último deploy es de este repo.

### ¿SUPABASE_SERVICE_ROLE_KEY debe estar en Vercel?

**Sí, es obligatoria.** Las rutas API (`/api/dashboard`, `/api/items`, etc.) usan esa variable en el servidor para hablar con Supabase (autenticación y datos). Sin ella, el build puede pasar pero la app falla al cargar el dashboard o al hacer acciones. Las tres variables necesarias en Vercel son:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 404 en /login u otras rutas

Si en incógnito ves **404** en `/login`, suele ser que el dominio está sirviendo un **deploy de otro proyecto o de otra rama** que no tiene esta app (por ejemplo otro repo "marco-polo"). Qué hacer:

1. En **Vercel Dashboard** → proyecto que tiene el dominio → **Deployments**: confirmá que el último deploy es de **este** repo (FINANCE / Shared Budget) y que el **build terminó en éxito**.
2. Si el proyecto correcto está vinculado a otro repo, revinculá el proyecto a este repo o hacé un **nuevo deploy desde este repo** (ver CLI abajo).
3. Después de cambiar env vars o repo, hacé **Redeploy** (⋯ en el último deployment → Redeploy) para que se reconstruya.

### Vercel CLI (env vars y deploy)

La **protección de despliegue** (Deployment Protection) **no** se puede desactivar por CLI; solo desde el Dashboard (Settings → Deployment Protection).

Sí podés usar la CLI para:

- **Vincular el proyecto** (desde la raíz del repo):
  ```bash
  npx vercel link
  ```
  Elegí el equipo/proyecto correcto (el que usa el dominio donde querés que salga la app).

- **Listar variables de entorno**:
  ```bash
  npx vercel env ls
  ```

- **Agregar una variable** (te pide el valor por consola):
  ```bash
  npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
  npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
  npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
  ```
  Repetí para `preview` si querés que los previews también tengan las vars.

- **Traer las env vars a un archivo local** (para desarrollo):
  ```bash
  npx vercel env pull .env.local
  ```

- **Deploy a producción** (y forzar que el dominio de producción use este código):
  ```bash
  npm run build && npx vercel --prod
  ```

Después de `vercel env add` o de cambiar env en el Dashboard, hace falta un **nuevo deploy** para que los cambios apliquen.

## Uso

- **Dashboard:** Saldo, gastos recurrentes (total mensual), a cobrar, a pagar.
- **Historial:** Tabla con filtros por tipo y búsqueda por descripción.
- **Agregar:** Movimiento (ingreso/gasto), Recurrente, A cobrar, A pagar.
- **Editar saldo:** Modal para actualizar el saldo manualmente.
- Al marcar **A cobrar** o **A pagar** como “hecho”, se crea el movimiento correspondiente y se actualiza el saldo.

### Cómo se calculan los gastos recurrentes (suscripciones)

Los gastos recurrentes (por ejemplo suscripciones a Netflix, Spotify, etc.) se calculan así:

1. **Registro:** Cada suscripción se carga como ítem con tipo **Recurrente** y un monto (ej. el precio mensual).
2. **Total mensual:** El dashboard suma todos los recurrentes con **Activo = sí** y muestra ese total como "Gastos recurrentes" (es el gasto fijo mensual por suscripciones).
3. **Proyección anual:** Podés estimar el gasto anual en suscripciones como: **total mensual × 12**.
4. **Desactivar:** Si cancelás una suscripción, podés editar el ítem y desmarcar "Activo" para que deje de sumar en el total (el historial se mantiene).

Si en el futuro quisieras frecuencias distintas (semanal, anual), habría que añadir un campo `frequency` en la tabla y ajustar el cálculo del total (ej. mensualizar: anual ÷ 12, semanal × 4.33).
