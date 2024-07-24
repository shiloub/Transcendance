import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendService {
    constructor(
        private prisma : PrismaService,
        ){}
    // async sendRequest(body: any, sender: any) {
    //     const user_to_send = await this.prisma.user.findFirst({
    //         where: {
    //             login: body.login,
    //         }
    //     });
    //     if (user_to_send)
    //     {
    //         this.Gateway.sendNotification(user_to_send.socket, {
    //             sender: body.sender,
    //             object: "friend request",
    //         })//envoyer une notification en utilisant user_to_send.socket
    //     }
    //     else
    //     {
    //         return ("erreur: utilisateur introuvable");
    //     }
    // }
}
