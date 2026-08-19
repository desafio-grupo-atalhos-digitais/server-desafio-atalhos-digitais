import { Injectable, Logger } from '@nestjs/common';
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
    const candidateData = UserFactory.createCandidate(user);
    const newUser = await this.userRepository.create(candidateData);

    const initialAutomation = AutomationFactory.createInitial(
      newUser._id.toString(),
    );
    const createJob = await this.automation.create(initialAutomation);

    this.queue.startQueue(createJob).catch((err) => {
      this.logger.error(`Erro ao adicionar automação na fila: ${err.message}`);
    });

    return newUser;
  }

  async getUsers() {
    return await this.userRepository.findAll();
  }
}
