import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import mongoose from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './services/user/user.module';
import { AutomationModule } from './services/automation/automation.module';
import { QueueModule } from './services/queue/queue.module';
import { WebhookModule } from './services/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AutomationModule,
    QueueModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const mongoUri = this.configService.get<string>(
      'MONGO_URI',
      'mongodb://localhost:27017/desafio_atalhos',
    );
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }
}
