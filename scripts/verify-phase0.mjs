#!/usr/bin/env node
/**
 * Phase 0 Setup Verification Script
 * Checks if all required files and configuration are in place
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const checks = [];
let hasErrors = false;

function check(name, condition, errorMsg = '', successMsg = '') {
  if (condition) {
    checks.push({ name, status: '✅', message: successMsg });
  } else {
    checks.push({ name, status: '❌', message: errorMsg });
    hasErrors = true;
  }
}

console.log('\n🔍 PHASE 0 SETUP VERIFICATION\n');

// Check required files exist
check(
  'State Machine',
  existsSync(join(projectRoot, 'src/lib/voice/spokenLoopMachine.ts')),
  'Missing src/lib/voice/spokenLoopMachine.ts',
  'State machine found'
);

check(
  'Speech Controller',
  existsSync(join(projectRoot, 'src/lib/voice/speechController.ts')),
  'Missing src/lib/voice/speechController.ts',
  'Speech controller found'
);

check(
  'Gemini Client',
  existsSync(join(projectRoot, 'src/lib/ai/geminiSimpleClient.ts')),
  'Missing src/lib/ai/geminiSimpleClient.ts',
  'Gemini client found'
);

check(
  'Zustand Store',
  existsSync(join(projectRoot, 'src/store/spokenLoopStore.ts')),
  'Missing src/store/spokenLoopStore.ts',
  'Zustand store found'
);

check(
  'Focus UI',
  existsSync(join(projectRoot, 'src/pages/Focus.tsx')),
  'Missing src/pages/Focus.tsx',
  'Focus UI found'
);

// Check .env file
const envPath = join(projectRoot, '.env');
const envExamplePath = join(projectRoot, '.env.example');
const hasEnv = existsSync(envPath);
const hasEnvExample = existsSync(envExamplePath);

check(
  '.env.example',
  hasEnvExample,
  'Missing .env.example file',
  'Template found'
);

if (hasEnv) {
  const envContent = readFileSync(envPath, 'utf-8');
  const hasApiKey = envContent.includes('VITE_GEMINI_API_KEY=') && 
                    !envContent.includes('VITE_GEMINI_API_KEY=your_gemini_api_key_here');
  
  check(
    'Gemini API Key',
    hasApiKey,
    '.env file exists but VITE_GEMINI_API_KEY is not set. Get one from https://aistudio.google.com/app/apikey',
    'API key configured'
  );
} else {
  check(
    '.env Configuration',
    false,
    '.env file not found. Copy .env.example to .env and add your Gemini API key',
    ''
  );
}

// Check package.json dependencies
const packageJsonPath = join(projectRoot, 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  check(
    'Zustand Dependency',
    packageJson.dependencies?.zustand,
    'Zustand not found in package.json dependencies',
    `Zustand ${packageJson.dependencies?.zustand} installed`
  );
} else {
  check('package.json', false, 'package.json not found');
}

// Print results
console.log('');
checks.forEach(({ name, status, message }) => {
  console.log(`${status} ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
});

console.log('\n' + '='.repeat(50) + '\n');

if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Phase 0 is ready.\n');
  console.log('Next steps:');
  console.log('  1. Make sure .env has your Gemini API key');
  console.log('  2. Run: npm run dev');
  console.log('  3. Open browser and navigate to Focus page');
  console.log('  4. Click "Start Listening" and test the voice loop\n');
  process.exit(0);
}
