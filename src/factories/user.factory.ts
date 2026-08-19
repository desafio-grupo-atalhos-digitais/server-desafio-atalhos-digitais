import { UserType } from 'src/schemas/userSchema';

export class UserFactory {
  static createCandidate(data: Omit<UserType, 'automationStatus'>): UserType {
    return {
      ...data,
      automationStatus: 'PENDING',
    };
  }
}
