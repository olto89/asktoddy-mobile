#!/usr/bin/env node

/**
 * Validate Edge Functions Setup
 * Checks TypeScript files and configuration
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const SUPABASE_DIR = path.join(PROJECT_ROOT, 'supabase');

/**
 * Check if all required Edge Functions exist
 */
function validateEdgeFunctions() {
  console.log('🧪 Validating Edge Functions setup...\n');

  const expectedFunctions = ['analyze-construction', 'get-pricing', 'generate-document'];
  const functionsDir = path.join(SUPABASE_DIR, 'functions');

  if (!fs.existsSync(functionsDir)) {
    throw new Error('Supabase functions directory not found');
  }

  const results = [];

  expectedFunctions.forEach(functionName => {
    const functionDir = path.join(functionsDir, functionName);
    const indexFile = path.join(functionDir, 'index.ts');
    const denoFile = path.join(functionDir, 'deno.json');

    const result = {
      name: functionName,
      directoryExists: fs.existsSync(functionDir),
      indexFileExists: fs.existsSync(indexFile),
      denoConfigExists: fs.existsSync(denoFile),
      indexFileSize: 0,
    };

    if (result.indexFileExists) {
      const stats = fs.statSync(indexFile);
      result.indexFileSize = stats.size;
    }

    results.push(result);
  });

  return results;
}

/**
 * Check shared utilities
 */
function validateSharedUtilities() {
  const sharedDir = path.join(SUPABASE_DIR, 'functions', '_shared');
  const envFile = path.join(sharedDir, 'env.ts');

  return {
    sharedDirExists: fs.existsSync(sharedDir),
    envFileExists: fs.existsSync(envFile),
    envFileSize: fs.existsSync(envFile) ? fs.statSync(envFile).size : 0,
  };
}

/**
 * Check Supabase configuration
 */
function validateSupabaseConfig() {
  const configFile = path.join(SUPABASE_DIR, 'config.toml');
  const envFile = path.join(SUPABASE_DIR, '.env.local');

  const result = {
    configExists: fs.existsSync(configFile),
    envExists: fs.existsSync(envFile),
    configuredFunctions: [],
  };

  if (result.configExists) {
    const configContent = fs.readFileSync(configFile, 'utf-8');
    const functionMatches = configContent.match(/\[functions\.([\w-]+)\]/g);
    if (functionMatches) {
      result.configuredFunctions = functionMatches.map(match =>
        match.replace('[functions.', '').replace(']', '')
      );
    }
  }

  return result;
}

/**
 * Main validation
 */
function main() {
  console.log('🏗️ Edge Functions Validation Report\n');

  try {
    // Validate Edge Functions
    const functions = validateEdgeFunctions();
    console.log('📁 Edge Functions:');
    functions.forEach(func => {
      const status = func.directoryExists && func.indexFileExists ? '✅' : '❌';
      console.log(`   ${status} ${func.name}`);
      console.log(`      Directory: ${func.directoryExists ? 'Yes' : 'No'}`);
      console.log(
        `      Index file: ${func.indexFileExists ? 'Yes' : 'No'} (${func.indexFileSize} bytes)`
      );
      console.log(`      Deno config: ${func.denoConfigExists ? 'Yes' : 'No'}`);
    });

    // Validate shared utilities
    const shared = validateSharedUtilities();
    console.log('\n🔧 Shared Utilities:');
    console.log(`   ${shared.sharedDirExists ? '✅' : '❌'} Shared directory`);
    console.log(
      `   ${shared.envFileExists ? '✅' : '❌'} Environment utilities (${shared.envFileSize} bytes)`
    );

    // Validate Supabase config
    const config = validateSupabaseConfig();
    console.log('\n⚙️  Supabase Configuration:');
    console.log(`   ${config.configExists ? '✅' : '❌'} config.toml`);
    console.log(`   ${config.envExists ? '✅' : '❌'} .env.local`);
    console.log(`   📋 Configured functions: ${config.configuredFunctions.join(', ') || 'None'}`);

    // Summary
    const allFunctionsValid = functions.every(f => f.directoryExists && f.indexFileExists);
    const sharedValid = shared.sharedDirExists && shared.envFileExists;
    const configValid = config.configExists && config.envExists;

    console.log('\n📊 Summary:');
    console.log(`   Edge Functions: ${allFunctionsValid ? '✅ Ready' : '❌ Issues found'}`);
    console.log(`   Shared Utilities: ${sharedValid ? '✅ Ready' : '❌ Issues found'}`);
    console.log(`   Configuration: ${configValid ? '✅ Ready' : '❌ Issues found'}`);

    if (allFunctionsValid && sharedValid && configValid) {
      console.log('\n🎉 All Edge Functions are properly configured!');
      console.log('\n📋 What was created:');
      console.log('   - analyze-construction: AI-powered construction analysis');
      console.log('   - get-pricing: UK construction pricing data');
      console.log('   - generate-document: PDF quote and plan generation');
      console.log('   - Shared environment utilities');
      console.log('   - TypeScript configuration for Deno');
      console.log('\n💡 Next steps:');
      console.log('   1. Install Docker Desktop for local testing');
      console.log('   2. Run: supabase functions serve');
      console.log('   3. Test health endpoints: GET /functions/v1/{function-name}');
      console.log('   4. Begin API-002: Migrate AIMiddleware');

      return true;
    } else {
      console.log('\n❌ Setup incomplete - please check the issues above');
      return false;
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run validation
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = { validateEdgeFunctions, validateSharedUtilities, validateSupabaseConfig };
