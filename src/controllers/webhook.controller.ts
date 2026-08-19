import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WebhookService } from 'src/services/webhook/webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: unknown) {
    return this.webhookService.sendRequest();
  }
}
