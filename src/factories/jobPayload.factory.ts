import { IAutomationJobPayload } from 'src/intefaces/AutomationJobPayload.interface';

export class AutomationJobPayloadFactory {
  static createPayload(
    automationId: string,
    candidateId: string,
  ): IAutomationJobPayload {
    return {
      automationId,
      candidateId,
    };
  }
}
