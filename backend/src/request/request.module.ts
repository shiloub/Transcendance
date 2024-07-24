import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
	imports: [AuthModule],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
