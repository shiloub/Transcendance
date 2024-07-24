import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Channel, Message, User } from '@prisma/client';
import { idDto } from './dto';
import { error } from 'console';
import { Socket } from 'socket.io';
import { SocketService } from 'src/socket/socket.service';
import { timestamp } from 'rxjs';

enum ChannelRole {
    DEFAULT = 'DEFAULT',
    ADMIN = 'ADMIN',
    OWNER = 'OWNER'
}

enum ChannelType {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
    DIRECT = 'DIRECT',
}

@Injectable()
export class ChannelService {
    constructor(private prisma: PrismaService) {}

    async createChannel(name: string, password: string, type: ChannelType, creatorId: number): Promise<Channel> {
        const createdChannel =  await this.prisma.channel.create({
                data : {
                    name,
                    password,
                    type,
                },
            });

        this.createChannelco(creatorId, createdChannel.id, ChannelRole.OWNER);
        return (createdChannel);
    }

    async isAdmin(userId: number, channelId: number) {
        const usercos = await this.prisma.channelConnection.findMany({
            where: {
                userId,
                channelId,
                role: "ADMIN"
            }
        })
        if (usercos.length > 0)
            return (true)
        return (false);
    }

    async isOwner(userId: number, channelId: number) {
        const usercos = await this.prisma.channelConnection.findMany({
            where: {
                userId,
                channelId,
                role: "OWNER"
            }
        })
        if (usercos.length > 0)
            return (true)
        return (false);
    }


    async joinChannel(name: string, joinerId: number, password: string): Promise<Channel> {
        const channel = await this.prisma.channel.findUnique({
            where: {
                name,
            }
        })
        if (!channel)
        {
            //console.log(`channel ${name} introuvable`);
            throw new error("cant find channel");
        }

        if (channel.banned.includes(joinerId))
            throw new error("User banned");

        if (channel.type === 'PRIVATE' && !channel.invited.includes(joinerId))
            throw new error("User not invited");


        const chanco = await this.prisma.channelConnection.findFirst({
            where :{
                channelId: channel.id,
                userId: joinerId,
            }
        })
        if (chanco)
            throw new error("already in chan");

        if (channel.password && channel.password !== "" && channel.password !== password)
            throw new error("wrong password");

        this.createChannelco(joinerId, channel.id, ChannelRole.DEFAULT)
        return (channel);
    }

    async setNewAdmin (userId: number, channelId: number) {
        try {
            const chanco = await this.prisma.channelConnection.updateMany({
                where : {
                    userId,
                    channelId,
                },
                data : {
                    role: ChannelRole.ADMIN
                }
            })
        }
        catch{
            throw ({error: "cant set this user as Administrator"});
        }
    }

    async createChannelco(userId: number, channelId: number, role: ChannelRole) {
        try {
            const newChanCo = await this.prisma.channelConnection.create({
                data : {
                    userId,
                    channelId,
                    role,
                    muted: 0,
                }
            })
        }
        catch(error)
        {
            //console.log(`error dans createchannelco: ${error}`);
        }


    }

    async getIdByName(name: string): Promise<number> {
        const user = await this.prisma.channel.findFirst({
            where : {
                name,
            }
        })
        return (user.id);
    }

    async getChannels() : Promise<Channel[]> {
        return this.prisma.channel.findMany({
            where : {},
        });
    }

    async getChannelMessages(channelId: number) : Promise<Message[]> {
        try {
            const channel = await this.prisma.channel.findUnique({
                where : {
                    id: channelId,
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc',
                        }
                    }
                },
            });
            return (
                channel.messages
            );
        }
        catch(error){
            throw new Error(`Error fetching channel_message: ${error.message}`);
        }
        finally {
            await this.prisma.$disconnect();
        }

    }

    async getChannelUsers(channelId: number) : Promise<User[]> {
        try {
            const channel = await this.prisma.channel.findUnique({
                where: {
                    id: channelId,
                },
                include: {
                    channelConnections: {
                        select: {
                            user: true,
                        }
                    },
                },
            });
               const users = channel.channelConnections.map((connection) => connection.user)
               return (users);
        }
        catch(error){
            throw new Error(`Error fetching user channels: ${error.message}`);
        }
        finally {
            await this.prisma.$disconnect();
        }
    }

    async banUser(channelId: number, userId: number) {
        try {
            const channel = await this.prisma.channel.findUnique({
                where : {
                    id: channelId,
                },
            })
            const temp = channel.banned;
            temp.push(userId);
            const updatechan = await this.prisma.channel.update({
                where : {
                    id: channelId,
                },
                data: {
                    banned: temp,
                },
            })
        }
        catch (error){
            throw new Error(`Error banning user: ${error.message}`);
        }
    }

    async inviteUser(channelId: number, userId: number) {
        try {
            const channel = await this.prisma.channel.findUnique({
                where : {
                    id: channelId,
                },
            })
            const temp = channel.invited;
            temp.push(userId);
            const updatechan = await this.prisma.channel.update({
                where : {
                    id: channelId,
                },
                data: {
                    invited: temp,
                },
            })
        }
        catch (error){
            throw new Error(`Error inviting user: ${error.message}`);
        }

    }

    async muteUser(userId: number, channelId: number){
        try {
            const chanco = await this.prisma.channelConnection.updateMany({
                where: {
                    userId,
                    channelId,
                },
                data : {
                    muted: (Math.floor(new Date().getTime() / 1000)) + 300
                }
            })

        }
        catch(error){
            throw error;
        }
    }


    async getChannelDefaultUsers(channelId: number) : Promise<User[]> {
        try {
            const channel = await this.prisma.channel.findUnique({
                where: {
                    id: channelId,
                },
                include: {
                    channelConnections: {
                        where: {
                            role: 'DEFAULT'
                        },
                        select: {
                            user: true,
                        }
                    },
                },
            });
               const users = channel.channelConnections.map((connection) => connection.user)
               return (users);
        }
        catch(error){
            throw new Error(`Error fetching user channels: ${error.message}`);
        }
        finally {
            await this.prisma.$disconnect();
        }
    }

    async getChannelDefaultAdminUsers(channelId: number) : Promise<User[]> {
        try {
            const channel = await this.prisma.channel.findUnique({
                where: {
                    id: channelId,
                },
                include: {
                    channelConnections: {
                        where: {
                            OR: [
                                { role: 'DEFAULT' },
                                { role: 'ADMIN' },
                            ],
                        },
                        select: {
                            user: true,
                        }
                    },
                },
            });
               const users = channel.channelConnections.map((connection) => connection.user)
               return (users);
        }
        catch(error){
            throw new Error(`Error fetching user channels: ${error.message}`);
        }
        finally {
            await this.prisma.$disconnect();
        }
    }

    async getUserChannels(userId: number) : Promise<Channel[]> {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    channelConnections: {
                        select: {
                            channel: true,
                        }
                    },
                },
            });

            const filteredChannels = user.channelConnections
            .map((connection) => connection.channel)
            .filter((channel) => channel.type !== 'DIRECT');
            return (filteredChannels);
        }
        catch(error){
            throw new Error(`Error fetching user channels: ${error.message}`);
        }
        finally {
            await this.prisma.$disconnect();
        }
    }

    async getUserDirect(userId: number) : Promise<Channel[]> {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    channelConnections: {
                        select: {
                            channel: true,
                        }
                    },
                },
            });

            const filteredChannels = user.channelConnections
            .map((connection) => connection.channel)
            .filter((channel) => channel.type === 'DIRECT');
            return (filteredChannels);
        }
        catch(error){
            throw new Error(`Error fetching user channels: ${error.message}`);
        }
        finally {
            await this.prisma.$disconnect();
        }
    }

    async getChanRole(userId: number, channelId: number) {
        try {
            const chanco = await this.prisma.channelConnection.findFirst({
                where: {
                    userId,
                    channelId,
                }
            })
            return (chanco.role);
        }
        catch {
            return ({error: "erreur lors de la recup du chanco"});
        }

    }

    async leaveChan(userId: number, channelId: number, userLogin: string) {
        try {
            const deletedChannelConnection = await this.prisma.channelConnection.deleteMany({
                where: {
                        userId: userId,
                        channelId: channelId,
                    },
            });
    
            //if (deletedChannelConnection) {
            //    // this.socketService.sendEvent(userLogin, "kicked", null);
            //    console.log(`Le lien entre l'utilisateur ${userId} et le canal ${channelId} a été supprimé.`);
            //} else {
            //    console.log(`Aucun lien trouvé entre l'utilisateur ${userId} et le canal ${channelId}.`);
            //}
        } catch (error) {
            //console.error(`Une erreur s'est produite lors de la suppression du lien : ${error}`);
        }
    }

    async setPassword(channelId: number, password: string) {
        try {
            const channel = await this.prisma.channel.update({
                where: {
                    id: channelId,
                },
                data: {
                    password: password,
                }
            })
            //console.log(`mot de passe du channel changé: '${channel.password}'`);
        }
        catch {
            //console.log("erreur lors du changement de password");
        }
    }

    async deleteChan(channelId: number) {
        try {
            await this.prisma.channel.delete({
                where : {
                    id: channelId,
                }
            })
        }
        catch {
            console.error("erreur lors de la suppression d'un channel");
        }
    }

    async getChannel(dto: idDto) : Promise<Channel> {
        return this.prisma.channel.findUnique({
            where: {
                id: dto.id,
            },
        })
    }
}
