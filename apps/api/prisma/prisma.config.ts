import path from 'node:path'
import { defineConfig } from 'prisma/config'

const dbUrl = process.env.DATABASE_URL ?? 'postgresql://raioxgoverno:raioxgoverno_dev@localhost:5433/raioxdogoverno'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),
  datasource: {
    url: dbUrl,
  },
  migrate: {
    url: dbUrl,
  },
})
