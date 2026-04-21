import { getSession } from 'next-auth/react'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await getSession()

  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.user ? { 'x-user-id': (session.user as any).id ?? '' } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }

  return res.json() as Promise<T>
}
