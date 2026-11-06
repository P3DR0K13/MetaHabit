import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || 'file:./dev.db'

  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaPg } = require('@prisma/adapter-pg')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require('pg')
      const pool = new Pool({ connectionString: url })
      const adapter = new PrismaPg(pool)
      return new PrismaClient({ adapter })
    } catch (err) {
      console.error('Falha ao inicializar adapter-pg, usando fallback:', err)
    }
  }

  // SQLite local via @prisma/adapter-libsql
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require('@prisma/adapter-libsql')
  const clientUrl = url.startsWith('file:') ? url : `file:${url}`
  const adapter = new PrismaLibSql({ url: clientUrl })

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
