import { Controller, Post, Body, UseGuards, Get, Query, Req } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChangePasswordDto, ChannelCreaDto, ChannelJoinDto, DirectCreaDto, NameDto, SetAdminDto, UserloginDto, idDto } from './dto/channel.dto';
import { UserService } from 'src/user/user.service';
import { ChannelType } from '@prisma/client';
import { SocketGateway } from 'src/socket/socket.gateway';
import { ModuleRef } from '@nestjs/core';
import { SocketService } from 'src/socket/socket.service';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService,
    private userService: UserService,
    private socketRef: ModuleRef) {}

  @Post('create')
  async createChannel(@Body() channelcreaDto: ChannelCreaDto) {
    try {
      const creatorId = await this.userService.getIdByLogin(channelcreaDto.creatorLogin);
      const channel = await this.channelService.createChannel(channelcreaDto.name, channelcreaDto.password, channelcreaDto.type, creatorId);
      return { channel };
    } catch (error) {
      return { error: `server cant create the channel`};
    }
  }

  @Post('createDirect')
  async createDirect(@Body() directcreaDto: DirectCreaDto) {
    try {
      const starter = await this.userService.getUser(directcreaDto.starterLogin);
      const target = await this.userService.getUser(directcreaDto.targetLogin);
      const channelName = (starter.username > target.username)? (starter.username + "-" + target.username) : (target.username + "-" + starter.username)
      if (starter.id === target.id)
        throw new Error;
      const channel = await this.channelService.createChannel(channelName, "", directcreaDto.type, starter.id);
      await this.channelService.joinChannel(channelName, target.id, "");
      return { channel };
    } catch (error) {
      return { error: "server cant create direct chat"};
    }
  }

  @Post('setPassword')
  async setPassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    const channelId = await this.channelService.getIdByName(dto.name);
    try {
      const isAdmin = await this.channelService.isAdmin(req.user.id, channelId);
      const isOwner = await this.channelService.isOwner(req.user.id, channelId);
      if (!isOwner)
        throw new Error();
      await this.channelService.setPassword(channelId, dto.password);
    }
    catch{
      return ({error: "server cant change password"});
    }
  }

  @Post('join')
  async joinChannel(@Body() channeljoinDto: ChannelJoinDto) {
    try {
      const joinerId = await this.userService.getIdByLogin(channeljoinDto.login);
      const channel = await this.channelService.joinChannel(channeljoinDto.name, joinerId, channeljoinDto.password);
      return { channel };
    } catch (error) {
      return { error: `you cant join this channel`};
    }
  }

  @Post('leave')
  async leaveChannel(@Body() channelLeaveDto: ChannelJoinDto) {
    try {
      const leaverId = await this.userService.getIdByLogin(channelLeaveDto.login);
      const channelId = await this.channelService.getIdByName(channelLeaveDto.name);
      await this.channelService.leaveChan(leaverId, channelId, channelLeaveDto.login);
    } catch (error) {
      return { error: `you cant leave this channel`};
    }
  }

  @Post('kick')
  async kickUser(@Body() channelLeaveDto: ChannelJoinDto, @Req() req: any) {
    try {
      const channelId = await this.channelService.getIdByName(channelLeaveDto.name);
      const isAdmin = await this.channelService.isAdmin(req.user.id, channelId);
      const isOwner = await this.channelService.isOwner(req.user.id, channelId);
      if (!isAdmin && !isOwner)
        throw new Error();
      const leaverId = await this.userService.getIdByLogin(channelLeaveDto.login);
      const leaverUsername = await this.userService.getUsernameByLogin(channelLeaveDto.login);
      await this.channelService.leaveChan(leaverId, channelId, channelLeaveDto.login);
      const username = await this.userService.getUsernameByLogin(channelLeaveDto.login);
      const socketService = this.socketRef.get(SocketGateway, { strict: false });
      socketService.sendEvent(leaverUsername, "kicked", null);
    } catch (error) {
      return { error: `you cant kicked this user`};
    }
  }

  @Post('ban')
  async banUser(@Body() channelLeaveDto: ChannelJoinDto, @Req() req: any) {
    try {
      const leaverId = await this.userService.getIdByLogin(channelLeaveDto.login);
      const channelId = await this.channelService.getIdByName(channelLeaveDto.name);
      const isAdmin = await this.channelService.isAdmin(req.user.id, channelId);
      const isOwner = await this.channelService.isOwner(req.user.id, channelId);
      if (!isAdmin && !isOwner)
        throw new Error();
      const leaverUsername = await this.userService.getUsernameByLogin(channelLeaveDto.login);
      await this.channelService.leaveChan(leaverId, channelId, channelLeaveDto.login);
      await this.channelService.banUser(channelId, leaverId)
      const socketService = this.socketRef.get(SocketGateway, { strict: false })
      socketService.sendEvent(leaverUsername, "kicked", null);// changer
    } catch (error) {
      return { error: `you cant kicked this user`};
    }
  }

  @Post('invite')
  async inviteUser(@Body() inviteDto: ChannelJoinDto) {
    try {
      const invitedId = await this.userService.getIdByLogin(inviteDto.login);
      const channelId = await this.channelService.getIdByName(inviteDto.name);
      await this.channelService.inviteUser(channelId, invitedId)
      // const socketService = this.socketRef.get(SocketGateway, { strict: false })
      // socketService.sendEvent(channelLeaveDto.login, "kicked", null);
    } catch (error) {
      return { error: `you cant invite this user`};
    }
  }

  @Post('mute')
  async MuteUser(@Body() channelLeaveDto: ChannelJoinDto, @Req() req: any) {
    try {
      const leaverId = await this.userService.getIdByLogin(channelLeaveDto.login);
      const channelId = await this.channelService.getIdByName(channelLeaveDto.name);
      const isAdmin = await this.channelService.isAdmin(req.user.id, channelId);
      const isOwner = await this.channelService.isOwner(req.user.id, channelId);
      if (!isAdmin && !isOwner)
        throw new Error();
      await this.channelService.muteUser(leaverId, channelId);
    } catch (error) {
      return { error: `you cant kicked this user`};
    }
  }

  @Post('setAdmin')
  async setAdmin(@Body() dto: SetAdminDto, @Req() req: any) {
    try {
      const userId = await this.userService.getIdByLogin(dto.login);
      const channelId = await this.channelService.getIdByName(dto.name);
      const isAdmin = await this.channelService.isAdmin(req.user.id, channelId);
      const isOwner = await this.channelService.isOwner(req.user.id, channelId);
      if (!isOwner && !isAdmin)
        throw new Error();
      await this.channelService.setNewAdmin(userId, channelId);
    } catch (error) {
      return { error: `you cant set this user as admin`};
    }
  }


  @Post('delete')
  async deleteChannel(@Body() nameDto: NameDto, @Req() req: any) {
    try {
      const channelId = await this.channelService.getIdByName(nameDto.name);
      const isAdmin = await this.channelService.isAdmin(req.user.id, channelId);
      const isOwner = await this.channelService.isOwner(req.user.id, channelId);
      if (!isAdmin && !isOwner)
        throw new Error();
      await this.channelService.deleteChan(channelId);
    } catch (error) {
      return { error: `cant destroy this channel`};
    }
  }

  @Get()
  async getChannels () {
    try {
      const channels = await this.channelService.getChannels();
      return {channels} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des channels: ${error}`};
    }
  }

  @Get('directChatPrintableName')
  async  getDirectChatPrintableName(@Query('name') name: string, @Req() req: any) {
    try {
      const channelId = await this.channelService.getIdByName(name);
      const chanUsers = await this.channelService.getChannelUsers(channelId);
      const chanLogins = chanUsers.map((user) => {
        if (user.id != req.user.id)
          return (user.login);
        else
          return (null);
      })
      const otherLogin = chanLogins[0] ? chanLogins[0] : chanLogins[1];
      return ({otherLogin})
    }
    catch{
      return {error: "erreur lors de la recup du name"};
    }
  }

  @Get('mine')
  async getUserChannels (@Query('login') userlogin: string) {
    try {
      const userId = await this.userService.getIdByLogin(userlogin);
      const channels = await this.channelService.getUserChannels(userId);
      return {channels} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des channels: ${error}`};
    }
  }

  @Get('users')
  async getchannelUser (@Query('name') name: string) {
    try {
      const channelId = await this.channelService.getIdByName(name);
      const users = await this.channelService.getChannelUsers(channelId);
      const sanitizedUsers = users.map(user => {
        const { avatarFileName, sessionId, twoFaEnabled, twoFaSecret, ...sanitizedUser } = user;
        return sanitizedUser;
      });
      return {users: sanitizedUsers} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des users`};
    }
  }

  @Get('default')
  async getchanneldefault (@Query('name') name: string) {
    try {
      const channelId = await this.channelService.getIdByName(name);
      const users = await this.channelService.getChannelDefaultUsers(channelId);
      const sanitizedUsers = users.map(user => {
        const { avatarFileName, sessionId, twoFaEnabled, twoFaSecret, ...sanitizedUser } = user;
        return sanitizedUser;
      });
      return {users: sanitizedUsers} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des users`};
    }
  }

  @Get('all')
  async getchanneldefaultadmin (@Query('name') name: string) {
    try {
      const channelId = await this.channelService.getIdByName(name);
      const users = await this.channelService.getChannelDefaultAdminUsers(channelId);
      const sanitizedUsers = users.map(user => {
        const { avatarFileName, sessionId, twoFaEnabled, twoFaSecret, ...sanitizedUser } = user;
        return sanitizedUser;
      });
      return {users: sanitizedUsers} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des users`};
    }
  }



  @Get('direct')
  async getUserDirect (@Req() req: any) {
    try {
      const channels = await this.channelService.getUserDirect(req.user.id);
      return {channels} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des directs: ${error}`};
    }
  }


  @Get('messages')
  async getChannelMessage (@Query('name') channelName: string) {
    try {
      const channelId = await this.channelService.getIdByName(channelName);
      const messages = await this.channelService.getChannelMessages(channelId);
      return {messages} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des messages: ${error}`};
    }
  }


  @Get('role')
  async getRole (@Query('name') channelName: string, @Query('login') login: string) {
    try {
      const channelId = await this.channelService.getIdByName(channelName);
      const userId = await this.userService.getIdByLogin(login);
      const role = await this.channelService.getChanRole(userId, channelId);
      return {role} ;

    }
    catch (error) {
      return { error: `Une erreur s\'est produite lors de la recupération des messages: ${error}`};
    }
  }
}