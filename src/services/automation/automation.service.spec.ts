import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { UserRepository } from 'src/repositories/userRepository';
import { QueueService } from '../queue/queue.service';
import { AutomationDocument, AutomationType } from 'src/schemas/automationSchema';

describe('AutomationService', () => {
  let automationService: AutomationService;
  let automationRepository: jest.Mocked<AutomationRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let queueService: jest.Mocked<QueueService>;

  const mockAutomationInput: AutomationType = {
    candidateId: '507f1f77bcf86cd799439011',
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 3,
    lastError: null,
  };

  const mockAutomationDocument = {
    _id: '607f1f77bcf86cd799439022',
    ...mockAutomationInput,
  } as unknown as AutomationDocument;

  beforeEach(async () => {
    const mockAutomationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCandidateId: jest.fn(),
      findLatestByCandidateId: jest.fn(),
      updateStatus: jest.fn(),
      incrementAttempts: jest.fn(),
    };

    const mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateAutomationStatus: jest.fn(),
    };

    const mockQueueService = {
      startQueue: jest.fn().mockResolvedValue({ jobId: 'job-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: AutomationRepository, useValue: mockAutomationRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    automationService = module.get<AutomationService>(AutomationService);
    automationRepository = module.get(AutomationRepository);
    userRepository = module.get(UserRepository);
    queueService = module.get(QueueService);
  });

  it('deve estar definido', () => {
    expect(automationService).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma nova automação com os dados corretos', async () => {
      automationRepository.create.mockResolvedValue(mockAutomationDocument);

      const result = await automationService.create(mockAutomationInput);

      expect(automationRepository.create).toHaveBeenCalledWith(mockAutomationInput);
      expect(result).toEqual(mockAutomationDocument);
    });
  });

  describe('retry', () => {
    it('deve lançar NotFoundException se a automação ou candidato não existirem', async () => {
      automationRepository.findById.mockResolvedValue(null);
      automationRepository.findLatestByCandidateId.mockResolvedValue(null);
      userRepository.findById.mockResolvedValue(null);

      await expect(automationService.retry('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se a automação já estiver em PROCESSING', async () => {
      const processingAutomation = {
        ...mockAutomationDocument,
        status: 'PROCESSING',
      } as unknown as AutomationDocument;

      automationRepository.findById.mockResolvedValue(processingAutomation);

      await expect(
        automationService.retry('607f1f77bcf86cd799439022'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar o status para PENDING ao tentar novamente via ID da automação', async () => {
      const failedAutomation = {
        ...mockAutomationDocument,
        status: 'FAILED',
      } as unknown as AutomationDocument;

      const updatedAutomation = {
        ...mockAutomationDocument,
        status: 'PENDING',
      } as unknown as AutomationDocument;

      automationRepository.findById.mockResolvedValue(failedAutomation);
      automationRepository.updateStatus.mockResolvedValue(updatedAutomation);

      const result = await automationService.retry('607f1f77bcf86cd799439022');

      expect(automationRepository.updateStatus).toHaveBeenCalledWith(
        '607f1f77bcf86cd799439022',
        'PENDING',
        null,
      );
      expect(result).toEqual(updatedAutomation);
    });

    it('deve buscar pelo ID do candidato se o ID da automação não for encontrado diretamente', async () => {
      const failedAutomation = {
        ...mockAutomationDocument,
        status: 'FAILED',
      } as unknown as AutomationDocument;

      const updatedAutomation = {
        ...mockAutomationDocument,
        status: 'PENDING',
      } as unknown as AutomationDocument;

      automationRepository.findById.mockResolvedValue(null);
      automationRepository.findLatestByCandidateId.mockResolvedValue(failedAutomation);
      automationRepository.updateStatus.mockResolvedValue(updatedAutomation);

      const result = await automationService.retry('507f1f77bcf86cd799439011');

      expect(automationRepository.findLatestByCandidateId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(updatedAutomation);
    });
  });
});
