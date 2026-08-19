import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { IAutomationJobPayload } from "src/intefaces/AutomationJobPayload.interface";
import { WebhookService } from "src/services/webhook/webhook.service";

@Processor('automationQueue')
export class AutomationProcessor extends WorkerHost {
    private readonly logger = new Logger();
    constructor(private readonly webhook: WebhookService) {
        super();
    }

    async process(job: Job<IAutomationJobPayload>) {
        this.logger.log(`Iniciando processamento do job ${job.id}`);



    }
}