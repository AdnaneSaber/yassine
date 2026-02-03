/**
 * Charge les variables d'environnement depuis .env.local
 * Supporte le format avec ou sans 'export '
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  envContent.split('\n').forEach(line => {
    // Supprime \r (Windows line endings) d'abord
    line = line.replace(/\r$/, '');
    
    // Ignore les lignes vides et les commentaires
    if (!line.trim() || line.startsWith('#')) return;
    
    // Supprime le prefix 'export ' si présent
    const cleanLine = line.replace(/^export\s+/, '');
    
    // Parse KEY="value" ou KEY=value
    const match = cleanLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Supprime les guillemets entourants
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Ne remplace pas si déjà défini
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  
  console.log('✅ .env.local loaded');
} else {
  console.warn('⚠️ .env.local not found');
}
