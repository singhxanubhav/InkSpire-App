import { prisma } from '../../config/database';
import { UpdateProfileInput } from './user.schema';

export class UserService {
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    
    // Omit sensitive data before returning
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
