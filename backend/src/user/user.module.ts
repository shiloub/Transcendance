import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SocketService } from 'src/socket/socket.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import { HistoryService } from 'src/history/history.service';

@Module({
  controllers: [UserController,],
  providers: [UserService]
})
export class UserModule {}
