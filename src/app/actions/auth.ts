'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
})

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

export async function registerAction(prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = registerSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  const { name, email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  try {
    // RF01 — Impedir cadastro com e-mail já existente
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return { error: 'Este e-mail já está cadastrado em outra conta.' }
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        experiencePoints: 0,
        level: 1,
        rank: 'Bronze (Iniciante)',
        coins: 0,
      },
    })

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return { error: 'Não foi possível concluir o cadastro. Tente novamente mais tarde.' }
  }

  redirect('/hoje')
}

export async function loginAction(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return { error: 'E-mail ou senha incorretos.' }
    }

    const isMatch = await verifyPassword(password, user.passwordHash)
    if (!isMatch) {
      return { error: 'E-mail ou senha incorretos.' }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return { error: 'Ocorreu um erro ao entrar. Tente novamente mais tarde.' }
  }

  redirect('/hoje')
}

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}

export async function getMeAction() {
  return await getCurrentUser()
}
