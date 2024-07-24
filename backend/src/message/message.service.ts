import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { ChannelService } from 'src/channel/channel.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MessageService {
    constructor(private prisma: PrismaService, private channelService: ChannelService, private userService: UserService) {}

    async createMessage(content: string, senderLogin: string, channelName: string) : Promise<Message> {
        const senderId = await this.userService.getIdByLogin(senderLogin);
        const channelId = await this.channelService.getIdByName(channelName);
        const newMessage = await this.prisma.message.create({
            data: {
                content,
                senderId,
                channelId,
                senderLogin,
            }
        });
        return (newMessage);
    }
}
