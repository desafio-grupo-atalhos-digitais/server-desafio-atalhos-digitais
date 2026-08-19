import { HttpException, HttpStatus, Injectable } from '@nestjs/common';


type WebhookStatus = 200 | 429 | 500;

@Injectable()
export class WebhookService {

    sendRequest() {
        const status_wheights: Record<WebhookStatus, number> = {
            200: 70,
            429: 20,
            500: 10,
        }

        const random = Math.random() * 100;

        if (random < status_wheights[200]) return { "success": "true", "Status": 200 }
        if (random < status_wheights[200] + status_wheights[429]) throw new HttpException("429 Too many requests.", HttpStatus.TOO_MANY_REQUESTS)
        throw new HttpException("500 Internal server error.", HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
