import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { AutomationModel } from 'src/schemas/automationSchema';
import { UserRepository } from 'src/repositories/userRepository';
import { UserModel } from 'src/schemas/userSchema';
import { QueueModule } from '../queue/queue.module';
import { WebhookModule } from '../webhook/webhook.module';
import { AutomationProcessor } from './processors/automation.processor';
import { AutomationController } from 'src/controllers/automation.controller';

@Module({
  imports: [QueueModule, WebhookModule],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationProcessor,
    {
      provide: AutomationRepository,
      useFactory: () => new AutomationRepository(AutomationModel),
    },
    {
      provide: UserRepository,
      useFactory: () => new UserRepository(UserModel),
    },
  ],
  exports: [AutomationService, AutomationRepository],
})
export class AutomationModule {}
