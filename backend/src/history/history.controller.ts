import { Body, Controller, Get, Query, Req } from '@nestjs/common';
import { HistoryService } from './history.service';
import { LoginDto } from './dto';

@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService){}
     @Get()
     async getHistory (@Query('login') login: string){
        try {
            const history = await this.historyService.getHistory(login);
            return ({history});
        }
        catch {
            return ({error: "impossible de recup l'history"});
        }
    }
}
