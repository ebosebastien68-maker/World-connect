// ============================================================================
// BUILD SCRIPT - WORLD CONNECT
// ============================================================================
// Injection des variables d'environnement Supabase au moment du build Vercel.
// Usage : ts-node build.ts  (ou via "build" dans package.json)
// ============================================================================

import fs   from 'fs';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface BuildEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// ============================================================================
// VALIDATION DES VARIABLES D'ENVIRONNEMENT
// ============================================================================

function requireEnv(name: keyof BuildEnv): string {
  const value = process.env[name];

  if (!value) {
    console.error(`❌ Erreur : la variable d'environnement ${name} est manquante.`);
    process.exit(1);
  }

  return value;
}

const SUPABASE_URL     = requireEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv('SUPABASE_ANON_KEY');

// ============================================================================
// VÉRIFICATION DU FICHIER CIBLE
// ============================================================================

// Le build cible maintenant supabaseClient.ts (converti depuis .js)
const TARGET_FILE = path.join(__dirname, 'supabaseClient.ts');

if (!fs.existsSync(TARGET_FILE)) {
  console.error(`❌ Erreur : le fichier ${path.basename(TARGET_FILE)} est introuvable.`);
  process.exit(1);
}

// ============================================================================
// INJECTION DES MARQUEURS
// ============================================================================

const MARKER_URL = '__SUPABASE_URL__';
const MARKER_KEY = '__SUPABASE_ANON_KEY__';

let code: string = fs.readFileSync(TARGET_FILE, 'utf8');

if (!code.includes(MARKER_URL) || !code.includes(MARKER_KEY)) {
  console.error(
    `❌ Erreur : les marqueurs ${MARKER_URL} ou ${MARKER_KEY} sont absents de ${path.basename(TARGET_FILE)}.`,
  );
  process.exit(1);
}

code = code.replace(MARKER_URL, SUPABASE_URL);
code = code.replace(MARKER_KEY, SUPABASE_ANON_KEY);

fs.writeFileSync(TARGET_FILE, code, 'utf8');

// ============================================================================
// RAPPORT
// ============================================================================

console.log(`🚀 Injection des clés réussie dans ${path.basename(TARGET_FILE)} !`);
console.log(`   ✅ SUPABASE_URL       → ${SUPABASE_URL}`);
console.log(`   ✅ SUPABASE_ANON_KEY  → ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
