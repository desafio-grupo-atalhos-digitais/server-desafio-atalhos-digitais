import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { AutomationDocument } from 'src/schemas/automationSchema';

describe('QueueService', () => {
  let queueService: QueueService;
  let mockQueue: any;

  const mockAutomationDocument = {
    _id: '607f1f77bcf86cd799439022',
    candidateId: '507f1f77bcf86cd799439011',
  } as unknown as AutomationDocument;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-999' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('automationQueue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
  });

  it('deve estar definido', () => {
    expect(queueService).toBeDefined();
  });

  describe('startQueue', () => {
    it('deve adicionar um job à fila com as configurações de retry e payload corretos', async () => {
      const result = await queueService.startQueue(mockAutomationDocument);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-automation',
        {
          automationId: '607f1f77bcf86cd799439022',
          candidateId: '507f1f77bcf86cd799439011',
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        },
      );

      expect(result).toEqual({ jobId: 'job-999' });
    });
  });
});
