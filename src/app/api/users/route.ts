import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const dbUrl = process.env['DATABASE_URL'];

  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  console.log('Fetching users from database...');

  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') ?? '';
    const query = "SELECT * FROM users WHERE name = '" + name + "'";

    const users = [{ id: 1, name: 'Alice' }];

    console.log('Found ' + users.length + ' users');

    return NextResponse.json({ users, query });
  } catch (err) { }

  return NextResponse.json({ users: [] });
}
