import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserService } from 'src/services/user/user.service';
import { UserZodSchema } from 'src/schemas/userSchema';
import { UserFactory } from 'src/factories/user.factory';
import { z } from 'zod';

const CreateCandidateDtoSchema = UserZodSchema.omit({
  automationStatus: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCandidateDto = z.infer<typeof CreateCandidateDtoSchema>;

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('registerCandidate')
  @HttpCode(HttpStatus.CREATED)
  async registerCandidate(@Body() body: unknown) {
    const validatedData = CreateCandidateDtoSchema.parse(body);
    const candidateData = UserFactory.createCandidate(validatedData);
    return this.userService.createUser(candidateData);
  }

  @Get('listCandidates')
  async listCandidates() {
    return this.userService.getUsers();
  }
}
