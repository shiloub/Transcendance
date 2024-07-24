import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
// import { FriendModule } from './friend/friend.module';
import { ChannelModule } from './channel/channel.module';
import { MessageModule } from './message/message.module';
import { SocketModule } from './socket/socket.module';
import { SocketGateway } from './socket/socket.gateway';
import { RequestModule } from './request/request.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    AuthModule,
     UserModule, 
     PrismaModule, 
     ConfigModule.forRoot({
      isGlobal: true,
     }),
     RequestModule,
    //  FriendModule, 
     ChannelModule, MessageModule, SocketModule, HistoryModule
    ],
  controllers: [],
  providers: [],
})
export class AppModule {}
