import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AutomationService } from 'src/services/automation/automation.service';
import { z } from 'zod';

const RetryAutomationDtoSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

export type RetryAutomationDto = z.infer<typeof RetryAutomationDtoSchema>;

@Controller('automations')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('retry')
  @HttpCode(HttpStatus.OK)
  async retryAutomation(@Body() body: unknown) {
    const { id } = RetryAutomationDtoSchema.parse(body);
    return this.automationService.retry(id);
  }
}
