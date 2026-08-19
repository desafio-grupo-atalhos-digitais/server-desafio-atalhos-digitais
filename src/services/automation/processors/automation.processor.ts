import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { IAutomationJobPayload } from "src/intefaces/AutomationJobPayload.interface";
import { AutomationRepository } from "src/repositories/automationRepository";
import { UserRepository } from "src/repositories/userRepository";
import { WebhookService } from "src/services/webhook/webhook.service";

@Processor('automationQueue')
export class AutomationProcessor extends WorkerHost {
    private readonly logger = new Logger(AutomationProcessor.name);
    constructor(
        private readonly webhook: WebhookService,
        private userRepository: UserRepository,
        private automationRepository: AutomationRepository) {
        super();
    }

    async process(job: Job<IAutomationJobPayload>) {
        this.logger.log(`Iniciando processamento do job ${job.id}`);

        const { automationId, candidateId } = job.data;
        await this.automationRepository.updateStatus(automationId, "PROCESSING");
        await this.userRepository.updateAutomationStatus(candidateId, "PROCESSING");

        try {
            const callWebhook = this.webhook.sendRequest();

            if (callWebhook.Status == 200) {
                await this.automationRepository.updateStatus(automationId, "SUCCESS");
                await this.userRepository.updateAutomationStatus(candidateId, "SUCCESS");

                const response = this.logger.log(callWebhook)
                return { response };
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            const response = this.logger.log(errorMessage)


            await this.automationRepository.incrementAttempts(automationId);
            const maxAttempts = job.opts.attempts || 3;

            if (job.attemptsMade + 1 >= maxAttempts) {
                await this.userRepository.updateAutomationStatus(candidateId, "FAILED");
                await this.automationRepository.updateStatus(automationId, "FAILED", response!);
            }

            throw error;
        }

    }
}