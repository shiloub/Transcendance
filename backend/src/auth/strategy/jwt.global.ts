
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

/*
	La creation de la classe JwtAuthGuard a pour seul but de pouvoir utiliser
	le AuthGuard jwt de maniere globale (voir main.ts)
	en effet pour des raisons obscures il est impossible de passer directement
	AuthGuard('jwt') a app.useGlobalGuards.
	De plus la surcharge de canActive permet en plus d'ajouter une exception pour les
	routes publiques (les fonctions d'authentification pour l'api de 42.)
	*/
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {

		const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
		if (isPublic) {
			return true;
		}

		return (super.canActivate(context));
	}
}
