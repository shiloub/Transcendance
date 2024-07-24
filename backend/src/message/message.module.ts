import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { ChannelService } from 'src/channel/channel.service';
import { UserService } from 'src/user/user.service';
// import { MessageController } from './message.controller';

@Module({
  providers: [MessageService, ChannelService, UserService],
  controllers: []
  // controllers: [MessageController]
})
export class MessageModule {}
