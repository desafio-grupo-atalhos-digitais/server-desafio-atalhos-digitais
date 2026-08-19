import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export type WebhookStatus = 500 | 429 | 200;

@Injectable()
export class WebhookService {
  private readonly statuses: WebhookStatus[] = [500, 429, 200];

  sendRequest() {
    const randomIndex = Math.floor(Math.random() * this.statuses.length);
    const status = this.statuses[randomIndex];

    if (status === 200) {
      return { success: 'true', Status: 200 };
    }

    if (status === 429) {
      throw new HttpException(
        '429 Too many requests.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new HttpException(
      '500 Internal server error.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
