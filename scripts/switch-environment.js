#!/usr/bin/env node

/**
 * Switch between development, staging, and production environments
 * Usage: npm run env:use [local|staging|production]
 */

const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'local';

const envFiles = {
  local: '.env.local',
  staging: '.env.staging',
  production: '.env.production',
};

const envFile = envFiles[environment];

if (!envFile) {
  console.error('❌ Invalid environment. Use: local, staging, or production');
  process.exit(1);
}

const sourcePath = path.join(__dirname, '..', envFile);
const targetPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Environment file ${envFile} not found`);
  process.exit(1);
}

// Check if production is properly configured
if (environment === 'production') {
  const content = fs.readFileSync(sourcePath, 'utf8');
  if (content.includes('YOUR_PRODUCTION_PROJECT')) {
    console.error('❌ Production environment not configured yet!');
    console.log('📝 Please update .env.production with your production Supabase project details');
    process.exit(1);
  }
}

try {
  // Backup current .env
  if (fs.existsSync(targetPath)) {
    fs.copyFileSync(targetPath, targetPath + '.backup');
  }

  // Copy selected environment file to .env
  fs.copyFileSync(sourcePath, targetPath);

  console.log(`✅ Switched to ${environment} environment`);
  console.log(`📁 Using: ${envFile}`);

  // Show current configuration
  const envContent = fs.readFileSync(targetPath, 'utf8');
  const appEnv = envContent.match(/EXPO_PUBLIC_APP_ENV=(\w+)/)?.[1];
  const supabaseUrl = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=([^\s]+)/)?.[1];

  console.log(`\n📊 Current Configuration:`);
  console.log(`   Environment: ${appEnv}`);
  console.log(
    `   Supabase: ${supabaseUrl?.includes('localhost') ? 'Local' : supabaseUrl?.split('.')[0]}`
  );
  console.log(`   Mock Data: ${environment === 'local' ? 'Enabled' : 'Disabled'}`);

  // Show next steps
  console.log('\n📝 Next steps:');
  if (environment === 'local') {
    console.log('   - Start local Supabase: supabase start');
    console.log('   - Run app: npm start');
  } else if (environment === 'staging') {
    console.log('   - Deploy functions: npm run deploy:staging');
    console.log('   - Build for TestFlight: npm run build:staging');
  } else {
    console.log('   - Deploy functions: npm run deploy:production');
    console.log('   - Build for App Store: npm run build:production');
  }
} catch (error) {
  console.error('❌ Failed to switch environment:', error.message);
  process.exit(1);
}
