#!/usr/bin/env node
/**
 * QuickBase JS SDK CLI
 *
 * Available commands:
 *   schema   Generate schema from QuickBase application
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'schema':
      const { main: schemaMain } = await import(
        join(__dirname, '..', 'dist', 'cli', 'schema.js')
      );
      await schemaMain(args.slice(1));
      break;

    case '--help':
    case '-h':
    case undefined:
      console.log(`
quickbase-js - QuickBase SDK CLI

Commands:
  schema    Generate schema from QuickBase application

Usage:
  npx quickbase-js <command> [options]

Examples:
  npx quickbase-js schema --help
  npx quickbase-js schema -r mycompany -a bqw123abc -t token
`);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "npx quickbase-js --help" for available commands');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
