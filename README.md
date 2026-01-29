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

## Uso

- **Dashboard:** Saldo, gastos recurrentes (total mensual), a cobrar, a pagar.
- **Historial:** Tabla con filtros por tipo y búsqueda por descripción.
- **Agregar:** Movimiento (ingreso/gasto), Recurrente, A cobrar, A pagar.
- **Editar saldo:** Modal para actualizar el saldo manualmente.
- Al marcar **A cobrar** o **A pagar** como “hecho”, se crea el movimiento correspondiente y se actualiza el saldo.
