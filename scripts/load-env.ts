import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Match Next's development precedence and keep existing shell values.
for (const file of ['.env.local', '.env']) {
  const path = resolve(file)
  if (existsSync(path)) process.loadEnvFile(path)
}
