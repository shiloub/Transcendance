import { Body, Controller, Get, HttpStatus, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { AddFriendDto, ChangeLoginDto } from './dto/user.dto';
import * as path from 'path';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import * as imageSize from 'image-size';
import * as fs from 'fs';
import { SocketService } from 'src/socket/socket.service';
import { ModuleRef } from '@nestjs/core';
import { SocketGateway } from 'src/socket/socket.gateway';

@Controller('users')
export class UserController {
    constructor(private userService: UserService, private moduleref: ModuleRef){}
    @Get('me')
    getme(@Req() req: Request) {
        return (req.user);
    }

    @Get('getLogin')
    getLogin (@Req() req) {
        return (req.user.login);
    }

    @Get(':id/avatar')
    async getUserAvatar(@Param('id') userId: string, @Res() res: Response) {
        const fileName = await this.userService.getAvatarPath(parseInt(userId));
        const avatarPath = path.join(__dirname, '..', '..', 'images', fileName);
        res.sendFile(avatarPath);
    }

    @Get('other')
    async getuser(@Query('login') login: string)
    {
        try {
            const user = await this.userService.getUser(login);
            delete(user.avatarFileName);
            delete(user.sessionId);
            delete(user.twoFaSecret);
            delete(user.twoFaEnabled);
            return ({user});
        }
        catch {
            return {error: "404 User not found"}
        }
    }

    @Get('otherByUsername')
    async getuserByUsername(@Query('username') username: string)
    {
        try {
            const user = await this.userService.getUserByUsername(username);
            delete(user.avatarFileName);
            delete(user.sessionId);
            delete(user.twoFaSecret);
            delete(user.twoFaEnabled);
            return ({user});
        }
        catch {
            return {error: "404 User not found"}
        }
    }


    @Get('invite')
    async getInvite(@Req() req: any)
    {
        const invites = await this.userService.getMyInvite(req.user.username);

        const invitersPromises = invites.map(async (invite) => {
            const inviter = await this.userService.getUserByUsername(invite.inviterUN);
            delete inviter.avatarFileName;
            delete inviter.sessionId;
            delete inviter.twoFaSecret;
            delete inviter.twoFaEnabled;
            return inviter;
        });
        const inviters = await Promise.all(invitersPromises);
        //console.log("inviters : ", inviters);
        return { inviters };
    }

    @Get('redirection')
    redirectToGame(@Res() res: Response): void {
      res.redirect('/game');
    }

    @Get('otherById')
    async getUserById(@Query('id') id: string)
    {
        try {
            const user = await this.userService.getUserById(parseInt(id));
            delete(user.avatarFileName);
            delete(user.sessionId);
            delete(user.twoFaSecret);
            delete(user.twoFaEnabled);
            return ({user});
        }
        catch {
            //console.log("oups");
            return {error: "404 User not found"}
        }
    }

    @Get('friends')
    async getFriends(@Req() req:any)
    {
        try {
            const users = await this.userService.getFriends(req.user.login);
            const sanitizedUsers = users.map(user => {
                const { avatarFileName, sessionId, twoFaEnabled, twoFaSecret, ...sanitizedUser } = user;
                return sanitizedUser;
              });
              return {users: sanitizedUsers} ;
        }
        catch {
            return {error: "404 User not found"}
        }
    }

    @Get('blocked')
    async getBlocked(@Req() req: any)
    {
        try {
            const usersIds = await this.userService.getBlocked(req.user.login);
            return ({usersIds});
        }
        catch {
            return {error: "404 User not found"}
        }
    }


    @Post('uploadAvatar')
    @UseInterceptors(FileInterceptor('avatar', {dest: './temp',}))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        try {
            const allowedTypes = ["image/jpeg", "image/gif", "image/png"];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('Le fichier n\'est pas une image valide.');
            }
            const newFileName = `${req.user.id}_avatar${path.extname(file.originalname)}`;
            const avatarPath = path.join(__dirname, '..', '..', 'images', newFileName);
            fs.copyFileSync(file.path, avatarPath);
            fs.unlinkSync(file.path);
            await this.userService.changeAvatarPath(req.user.id, newFileName);
            return (true);
        }
        catch {
            return ({error: "erreur durant l'upload"});
        }
    }

    @Post('cancelInvite')
    async cancel(@Body() dto: ChangeLoginDto) {
        await this.userService.deleteInvite(dto.newLogin);
    }

    @Post('addFriend')
    async addFriend(@Body() dto: AddFriendDto) {
        try {
          const added = await this.userService.addFriend(dto.login, dto.target);
            delete(added.avatarFileName);
            delete(added.sessionId);
            delete(added.twoFaSecret);
            delete(added.twoFaEnabled);
          return ({added})
        } 
        catch (error) {
          return { error: `you cant add this user`};
        }
    }

    @Post('delFriend')
    async delFriend(@Body() dto: AddFriendDto) {
        try {
          const deleted = await this.userService.delFriend(dto.login, dto.target);
            delete(deleted.avatarFileName);
            delete(deleted.sessionId);
            delete(deleted.twoFaSecret);
            delete(deleted.twoFaEnabled);
          return ({deleted})
        } 
        catch (error) {
          return { error: `you cant add this user`};
        }
    }

    @Post('blockUser')
    async blockUser(@Body() dto: AddFriendDto) {
        try {
         const blocked = await this.userService.blockUser(dto.login, dto.target);
         delete(blocked.avatarFileName);
         delete(blocked.sessionId);
         delete(blocked.twoFaSecret);
         delete(blocked.twoFaEnabled);
         return ({blocked});
        } 
        catch (error) {
          return { error: `you cant block this user`};
        }
    }

    @Post('unblockUser')
    async unblockUser(@Body() dto: AddFriendDto) {
        try {
         const unblocked = await this.userService.unblockUser(dto.login, dto.target);
         delete(unblocked.avatarFileName);
         delete(unblocked.sessionId);
         delete(unblocked.twoFaSecret);
         delete(unblocked.twoFaEnabled);
         return ({unblocked});
        } 
        catch (error) {
          return { error: `you cant block this user`};
        }
    }
    @Post('changeLogin')
    async changeLogin(@Req() req: any, @Body() dto: ChangeLoginDto ){
        try {
            const user = await this.userService.changeLogin(req.user.id, dto.newLogin, req.user.login);
            const socketService = this.moduleref.get(SocketGateway, { strict: false })
            socketService.sendEvent(user.username, "newLogin", null);
            delete(user.avatarFileName);
            delete(user.sessionId);
            delete(user.twoFaSecret);
            delete(user.twoFaEnabled);
            return ({user});
           } 
           catch (error) {
             return { error: `you cant change login`};
           }
    }
}
