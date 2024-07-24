import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { RequestService } from './request.service';
import { AuthGuard } from '@nestjs/passport';

import { AvoidTwoFa } from 'src/decorators/avoidtwofa.decorator';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  //route hyper simple pour petit test avec axios

  @AvoidTwoFa()
  @Get('get_all')
  get_all(@Req() req) {

	  return req.user;
  }

  @Get('get_username')
  get_username(@Req() req) {

	  return req.user.username;
  }

  @Get('get_id')
  get_id(@Req() req) {

	  return req.user.id;
  }


}
