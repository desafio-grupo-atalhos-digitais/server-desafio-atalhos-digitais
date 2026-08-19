import { AutomationType } from 'src/schemas/automationSchema';

export class AutomationFactory {
  static createInitial(candidateId: string): AutomationType {
    return {
      candidateId,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
    };
  }
}
