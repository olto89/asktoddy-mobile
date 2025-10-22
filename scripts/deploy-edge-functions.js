#!/usr/bin/env node

/**
 * Deploy Edge Functions to Supabase
 * Usage: npm run deploy:staging or npm run deploy:production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determine environment from command line argument
const environment = process.argv[2] || 'staging';

console.log(`🚀 Deploying Edge Functions to ${environment}...`);

// Environment-specific configurations
const configs = {
  staging: {
    projectRef: 'tggvoqhewfmczyjoxrqu', // Current project as staging
    envFile: '.env.staging',
  },
  production: {
    projectRef: 'YOUR_PRODUCTION_PROJECT_REF', // TODO: Update when created
    envFile: '.env.production',
  },
};

const config = configs[environment];

if (!config) {
  console.error('❌ Invalid environment. Use "staging" or "production"');
  process.exit(1);
}

// Check if production project is configured
if (environment === 'production' && config.projectRef === 'YOUR_PRODUCTION_PROJECT_REF') {
  console.error('❌ Production project not configured yet!');
  console.log('📝 To set up production:');
  console.log('   1. Create new Supabase project at https://app.supabase.com');
  console.log('   2. Update projectRef in scripts/deploy-edge-functions.js');
  console.log('   3. Update .env.production with new project details');
  process.exit(1);
}

try {
  // List of Edge Functions to deploy
  const functions = ['analyze-construction', 'generate-document', 'get-pricing'];

  console.log(`📦 Deploying to project: ${config.projectRef}`);
  console.log(`📋 Functions to deploy: ${functions.join(', ')}`);

  // Deploy each function
  functions.forEach(func => {
    console.log(`\n🔧 Deploying ${func}...`);

    const command = `supabase functions deploy ${func} --project-ref ${config.projectRef}`;

    try {
      execSync(command, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });
      console.log(`✅ ${func} deployed successfully`);
    } catch (error) {
      console.error(`❌ Failed to deploy ${func}`);
      throw error;
    }
  });

  console.log('\n✨ All Edge Functions deployed successfully!');
  console.log(`🌐 Environment: ${environment}`);
  console.log(`🔗 Project: https://app.supabase.com/project/${config.projectRef}`);

  // Show next steps
  console.log('\n📝 Next steps:');
  if (environment === 'staging') {
    console.log('   1. Test Edge Functions with: npm run test:edge-functions');
    console.log('   2. Build for TestFlight: eas build --profile staging --platform ios');
    console.log('   3. Submit to TestFlight: eas submit --profile staging --platform ios');
  } else {
    console.log('   1. Test in production: Update app to use production environment');
    console.log('   2. Build for App Store: eas build --profile production --platform ios');
    console.log('   3. Submit to App Store: eas submit --profile production --platform ios');
  }
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
