import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from 'src/repositories/userRepository';
import { AutomationService } from '../automation/automation.service';
import { QueueService } from '../queue/queue.service';
import { UserType } from 'src/schemas/userSchema';
import { AutomationDocument } from 'src/schemas/automationSchema';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let automationService: jest.Mocked<AutomationService>;
  let queueService: jest.Mocked<QueueService>;

  const mockUser: UserType = {
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'Desenvolvedor Fullstack',
    linkedin: 'https://linkedin.com/in/joaosilva',
    automationStatus: 'PENDING',
  };

  const mockUserDocument = {
    _id: '507f1f77bcf86cd799439011',
    ...mockUser,
  } as any;

  const mockAutomationDocument = {
    _id: '607f1f77bcf86cd799439022',
    candidateId: '507f1f77bcf86cd799439011',
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 3,
  } as unknown as AutomationDocument;

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateAutomationStatus: jest.fn(),
    };

    const mockAutomationService = {
      create: jest.fn(),
      retry: jest.fn(),
    };

    const mockQueueService = {
      startQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AutomationService, useValue: mockAutomationService },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    automationService = module.get(AutomationService);
    queueService = module.get(QueueService);
  });

  it('deve estar definido', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('deve criar um novo usuário, salvar a automação inicial e disparar a fila com sucesso', async () => {
      userRepository.create.mockResolvedValue(mockUserDocument);
      automationService.create.mockResolvedValue(mockAutomationDocument);
      queueService.startQueue.mockResolvedValue({ jobId: 'job-123' });

      const result = await userService.createUser(mockUser);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          linkedin: mockUser.linkedin,
          automationStatus: 'PENDING',
        }),
      );

      expect(automationService.create).toHaveBeenCalledWith({
        candidateId: '507f1f77bcf86cd799439011',
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3,
        lastError: null,
      });

      expect(queueService.startQueue).toHaveBeenCalledWith(mockAutomationDocument);
      expect(result).toEqual(mockUserDocument);
    });
  });

  describe('getUsers', () => {
    it('deve retornar a lista de usuários salvos', async () => {
      userRepository.findAll.mockResolvedValue([mockUserDocument]);

      const result = await userService.getUsers();

      expect(userRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUserDocument]);
    });
  });
});
