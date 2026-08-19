import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './services/user/user.module';
import { WebhookControllerController } from './controllers/webhook-controller/webhook-controller.controller';

@Module({
  imports: [UserModule],
  controllers: [AppController, WebhookControllerController],
  providers: [AppService],
})
export class AppModule { }
