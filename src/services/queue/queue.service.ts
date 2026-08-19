import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AutomationDocument } from 'src/schemas/automationSchema';
import { IAutomationJobPayload } from 'src/intefaces/AutomationJobPayload.interface';
import { AutomationJobPayloadFactory } from 'src/factories/jobPayload.factory';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('automationQueue')
    private readonly automationQueue: Queue<IAutomationJobPayload>,
  ) {}

  async startQueue(automation: AutomationDocument): Promise<{ jobId: string }> {
    const payload = AutomationJobPayloadFactory.createPayload(
      automation._id.toString(),
      automation.candidateId,
    );

    const job = await this.automationQueue.add(
      'process-automation',
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    );

    return { jobId: job.id ?? '' };
  }
}
