import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { AutomationType } from 'src/schemas/automationSchema';

@Injectable()
export class AutomationService {
    constructor(private automationRepository: AutomationRepository) { }

    async create(data: AutomationType) {
        return this.automationRepository.create(data);
    }

    async retry(automationId: string) {
        const checkExistingAutomation = await this.automationRepository.findById(automationId);

        if (!checkExistingAutomation) {
            throw new NotFoundException('Automação não encontrada.');
        }

        if (checkExistingAutomation.status == "PROCESSING") {
            throw new BadRequestException(`Automação já incializada! ${automationId}`);
        }

        const uptadeAutomation = await this.automationRepository.updateStatus(
            automationId,
            "PENDING",
            null);

        return uptadeAutomation;
    }
}
