import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/repositories/userRepository';
import { UserType } from 'src/schemas/userSchema';
import { AutomationService } from '../automation/automation.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private automation: AutomationService,
    private queue: QueueService,
  ) {}

  async createUser(user: UserType) {
    const newUser = await this.userRepository.create(user);

    const createJob = await this.automation.create({
      candidateId: newUser._id.toString(),
      status: 'PENDING',
      attempts: 0,
    });

    await this.queue.startQueue(createJob);

    return newUser;
  }

  async getUsers() {
    return await this.userRepository.findAll();
  }
}
