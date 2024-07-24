import { NestFactory, Reflector} from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { JwtAuthGuard } from './auth/strategy/jwt.global';
import { TwoFaAuthGuard } from './auth/strategy/2fa.global';

import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  let current_host = config.get('CURRENT_HOST');
  if (current_host === undefined)
	  return;
  let origin_url : string = 'http://' + current_host + ':3000';
  
  app.enableCors({
    origin : origin_url,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

	app.use(cookieParser());

  const reflect = app.get(Reflector);

	app.useGlobalGuards(new JwtAuthGuard(reflect));
	app.useGlobalGuards(new TwoFaAuthGuard(reflect));

  await app.listen(3001);
}
bootstrap();
