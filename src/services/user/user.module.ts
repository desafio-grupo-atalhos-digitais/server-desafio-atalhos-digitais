import { Module } from '@nestjs/common';
import { UserRepository } from 'src/repositories/userRepository';
import { UserModel } from 'src/schemas/userSchema';
import { UserService } from './user.service';
import { UserController } from 'src/controllers/user.controller';
import { AutomationModule } from '../automation/automation.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [AutomationModule, QueueModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository,
      useFactory: () => new UserRepository(UserModel),
    },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
