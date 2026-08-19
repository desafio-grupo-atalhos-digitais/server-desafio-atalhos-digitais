import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AutomationService } from './automation.service';
import { AutomationRepository } from 'src/repositories/automationRepository';
import { AutomationDocument, AutomationSchema } from 'src/schemas/automationSchema';
import { UserRepository } from 'src/repositories/userRepository';
import { UserDocument, UserSchema } from 'src/schemas/userSchema';
import { QueueModule } from '../queue/queue.module';
import { WebhookModule } from '../webhook/webhook.module';
import { AutomationProcessor } from './processors/automation.processor';
import { AutomationController } from 'src/controllers/automation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Automation', schema: AutomationSchema },
      { name: 'User', schema: UserSchema },
    ]),
    QueueModule,
    WebhookModule,
  ],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationProcessor,
    {
      provide: AutomationRepository,
      useFactory: (automationModel: Model<AutomationDocument>) =>
        new AutomationRepository(automationModel),
      inject: [getModelToken('Automation')],
    },
    {
      provide: UserRepository,
      useFactory: (userModel: Model<UserDocument>) =>
        new UserRepository(userModel),
      inject: [getModelToken('User')],
    },
  ],
  exports: [AutomationService, AutomationRepository],
})
export class AutomationModule {}
