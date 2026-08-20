import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { UserRepository } from 'src/repositories/userRepository';
import { QueueService } from '../queue/queue.service';
import { AutomationType } from 'src/schemas/automationSchema';
import { AutomationFactory } from 'src/factories/automation.factory';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly automationRepository: AutomationRepository,
    private readonly userRepository: UserRepository,
    private readonly queueService: QueueService,
  ) {}

  async create(data: AutomationType) {
    return this.automationRepository.create(data);
  }

  async retry(id: string) {
    let automation = await this.automationRepository.findById(id);

    if (!automation) {
      automation = await this.automationRepository.findLatestByCandidateId(id);
    }

    if (!automation) {
      const candidate = await this.userRepository.findById(id);
      if (!candidate) {
        throw new NotFoundException('Automação ou Candidato não encontrado.');
      }
      const newAutomationData = AutomationFactory.createInitial(id);
      automation = await this.automationRepository.create(newAutomationData);
    }

    if (automation.status === 'PROCESSING') {
      throw new BadRequestException(
        `Automação já está em processamento! ID: ${automation._id}`,
      );
    }

    const updatedAutomation = await this.automationRepository.updateStatus(
      automation._id.toString(),
      'PENDING',
      null,
    );

    if (!updatedAutomation) {
      throw new InternalServerErrorException(
        'Falha ao atualizar status da automação.',
      );
    }

    await this.userRepository.updateAutomationStatus(
      updatedAutomation.candidateId,
      'PENDING',
    );
    this.queueService.startQueue(updatedAutomation).catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Erro ao adicionar automação na fila: ${errorMessage}`);
    });

    return updatedAutomation;
  }
}
