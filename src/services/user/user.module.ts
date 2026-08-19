import { Module } from '@nestjs/common';
import { UserRepository } from 'src/repositories/userRepository';
import { UserService } from './user.service';

@Module({})
export class UserModule {
    imports: [UserRepository]
    controllers: []
    providers: [UserService]
}
