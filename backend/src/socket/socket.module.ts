import { Module } from '@nestjs/common';
import { ChannelService } from 'src/channel/channel.service';
import { MessageService } from 'src/message/message.service';
import { UserService } from 'src/user/user.service';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { UserModule } from 'src/user/user.module';
import { ChannelModule } from 'src/channel/channel.module';
import { MessageModule } from 'src/message/message.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { HistoryService } from 'src/history/history.service';

@Module({
    imports : [MessageModule],
    providers: [
        SocketGateway,
        SocketService,
        HistoryService,
    ],
    exports: [],
})
export class SocketModule {}
