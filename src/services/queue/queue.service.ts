import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AutomationDocument } from 'src/schemas/automationSchema';
import { IAutomationJobPayload } from 'src/intefaces/AutomationJobPayload.interface';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('automation-queue')
    private readonly automationQueue: Queue<IAutomationJobPayload>,
  ) {}

  async startQueue(automation: AutomationDocument): Promise<{ jobId: string }> {
    const job = await this.automationQueue.add(
      'process-automation',
      {
        automationId: automation._id.toString(),
        candidateId: automation.candidateId,
      },
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

  async retry() {}
}
