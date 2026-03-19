import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.email || !body.password) {
    throw new Error('Missing email or password');
  }

  if (body.password !== 'secret') {
    throw new Error('Invalid credentials');
  }

  return NextResponse.json({ token: 'fake-jwt-token' });
}
