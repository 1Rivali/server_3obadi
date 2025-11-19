import * as bcrypt from 'bcryptjs';

export async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 2);
}
