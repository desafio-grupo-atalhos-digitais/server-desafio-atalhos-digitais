import { Injectable } from '@nestjs/common';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { AutomationType } from 'src/schemas/automationSchema';

@Injectable()
export class AutomationService {
    constructor(private automationRepository: AutomationRepository) { }

    async create(data: AutomationType) {
        return this.automationRepository.create(data);
    }
}
