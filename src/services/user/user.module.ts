import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from 'src/repositories/userRepository';
import { UserDocument, UserSchema } from 'src/schemas/userSchema';
import { UserService } from './user.service';
import { UserController } from 'src/controllers/user.controller';
import { AutomationModule } from '../automation/automation.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    AutomationModule,
    QueueModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepository,
      useFactory: (userModel: Model<UserDocument>) => new UserRepository(userModel),
      inject: [getModelToken('User')],
    },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
