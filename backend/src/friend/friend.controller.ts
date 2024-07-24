// import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
// import { FriendService } from './friend.service';
// import { jwtGuard } from 'src/auth/guard';
// import { Request } from 'express';

// @Controller('friend')
// export class FriendController {
//     constructor(private friendservice: FriendService) {}
//     @UseGuards(jwtGuard)
//     @Post('request')
//     signup(@Body() body: any, @Req() request: Request){
//         return this.friendservice.sendRequest(body, request.user);
//     }
// }
