import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class TwoFaAuthGuard extends AuthGuard('jwt-twofa') {

	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {

		//Routes ouvertes sans aucune authentification
		const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
		if (isPublic) {
			return true;
		}

		//tester ici si l utilisateur a active la 2fa ?

		//routes ouvertes pour les authentifications basiques
		const avoidTwoFa = this.reflector.get<boolean>('avoidTwoFa', context.getHandler());
		if (avoidTwoFa) {
			return true;
		}
		return (super.canActivate(context));
	}

}

