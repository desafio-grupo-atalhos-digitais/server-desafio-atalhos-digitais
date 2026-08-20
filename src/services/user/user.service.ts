import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UserRepository } from 'src/repositories/userRepository';
import { UserType } from 'src/schemas/userSchema';
import { AutomationService } from '../automation/automation.service';
import { QueueService } from '../queue/queue.service';
import { UserFactory } from 'src/factories/user.factory';
import { AutomationFactory } from 'src/factories/automation.factory';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private userRepository: UserRepository,
    private automation: AutomationService,
    private queue: QueueService,
  ) {}

  async createUser(user: UserType) {
    const userExists = await this.userRepository.findByEmail(user.email);

    if (userExists) {
      this.logger.error('Erro ao criar usuário: Este email já foi cadastrado.');
      throw new ConflictException('Este e-mail já foi cadastrado.');
    }

    try {
      const candidateData = UserFactory.createCandidate(user);
      const newUser = await this.userRepository.create(candidateData);

      const initialAutomation = AutomationFactory.createInitial(
        newUser._id.toString(),
      );
      const createJob = await this.automation.create(initialAutomation);

      this.queue.startQueue(createJob).catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Erro ao adicionar automação na fila: ${errorMessage}`,
        );
      });

      return newUser;
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao cadastrar candidato.';
      this.logger.error(`Erro ao criar candidato: ${errorMessage}`);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async getUsers() {
    return await this.userRepository.findAll();
  }
}
