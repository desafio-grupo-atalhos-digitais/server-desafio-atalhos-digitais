import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { AutomationDocument, AutomationType } from 'src/schemas/automationSchema';

describe('AutomationService', () => {
  let automationService: AutomationService;
  let automationRepository: jest.Mocked<AutomationRepository>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: AutomationRepository, useValue: mockAutomationRepository },
      ],
    }).compile();

    automationService = module.get<AutomationService>(AutomationService);
    automationRepository = module.get(AutomationRepository);
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
    it('deve lançar NotFoundException se a automação não existir', async () => {
      automationRepository.findById.mockResolvedValue(null);

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

    it('deve atualizar o status para PENDING ao tentar novamente', async () => {
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
  });
});
