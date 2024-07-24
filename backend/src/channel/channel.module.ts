import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { UserService } from 'src/user/user.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { SocketModule } from 'src/socket/socket.module';
import { MessageService } from 'src/message/message.service';
import { SocketService } from 'src/socket/socket.service';

@Module({
    imports : [SocketModule],
  providers: [
    ChannelService,
    UserService,
  ],
  controllers: [ChannelController]
})
export class ChannelModule {}
