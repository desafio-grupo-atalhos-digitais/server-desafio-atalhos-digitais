import { Processor, WorkerHost } from "@nestjs/bullmq";
import { UserService } from "src/services/user/user.service";

@Processor('automationQueue')
export class AutomationProcessor extends WorkerHost {
    constructor(private readonly userService: UserService,) {
        super();
    }

    async process() {}
}