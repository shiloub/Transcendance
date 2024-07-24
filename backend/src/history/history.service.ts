import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HistoryService {
    constructor(private prisma: PrismaService){}
    
    async getHistory(login: string) {
        const history = await this.prisma.game.findMany({
            where: {
                OR: [
                    {
                      login1: {
                        equals: login
                      }
                    },
                    {
                      login2: {
                        equals: login
                      }
                    }
                  ]
            }
        })
        return (history);
    }
    async saveGame(login1: string, login2: string, score1: number, score2: number){
        const newGame = await this.prisma.game.create({
            data: {
                login1,
                login2,
                score1,
                score2,
            }
        })
    }
}
