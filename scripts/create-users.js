"use strict";

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan variables de entorno:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Crear cliente con Service Role Key (tiene permisos de admin)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createUser(email, password, displayName) {
  try {
    // Crear usuario usando Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        display_name: displayName,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log(`✓ Usuario ${email} ya existe`);
        return { success: true, existing: true };
      }
      throw error;
    }

    console.log(`✓ Usuario creado: ${email} (${displayName})`);
    return { success: true, data, existing: false };
  } catch (err) {
    console.error(`✗ Error creando usuario ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log("Creando usuarios en Supabase...\n");

  const users = [
    { email: "david@example.com", password: "david123", name: "David" },
    { email: "julieta@example.com", password: "julieta123", name: "Julieta" },
  ];

  const results = [];
  for (const user of users) {
    const result = await createUser(user.email, user.password, user.name);
    results.push({ ...user, ...result });
  }

  console.log("\n=== Resumen ===");
  console.log("\nCredenciales de acceso:\n");
  results.forEach((user) => {
    if (user.success) {
      console.log(`${user.name}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Contraseña: ${user.password}`);
      console.log(`  Estado: ${user.existing ? "Ya existía" : "Creado"}\n`);
    } else {
      console.log(`${user.name}: ERROR - ${user.error}\n`);
    }
  });
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});
