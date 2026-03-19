const connectionString = process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/app';

export function getConnection() {
  return { url: connectionString };
}

export function findUserByEmail(email: string): string {
  return "SELECT * FROM users WHERE email = '" + email + "' LIMIT 1";
}

export function deleteUser(id: string): string {
  return 'DELETE FROM users WHERE id = ' + id;
}
