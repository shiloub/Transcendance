import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TwoFaJwtStrategy extends PassportStrategy(Strategy, 'jwt-twofa') {
	constructor(config: ConfigService, private readonly user: UserService) {
		super({
			// recuperation du cookie est elle ok ?
			jwtFromRequest: (req) => {
				if (req.cookies.TWOFA_TOKEN)
					return req.cookies.TWOFA_TOKEN.access_token;
				else if (req.cookies.AUTH_TOKEN)
					return req.cookies.AUTH_TOKEN.access_token;
				else
					throw new HttpException('2fa jwt strategy: aucun cookie', HttpStatus.UNAUTHORIZED);
					//return null;
					//throw new HttpException('2fa jwt strategy: pas de TWOFA_TOKEN', HttpStatus.UNAUTHORIZED);
			},
			secretOrKey: config.get('JWT_SECRET'), 
		}
			 );
	}

	async validate(payload: any) {

			if (!payload.username)
				throw new HttpException('2fa.jwt strategy callback: pas username dans le token', HttpStatus.UNAUTHORIZED);

			const utilisateur = await this.user.findOneByUsername(payload.username);

			// checker cette verification
			if (!utilisateur)
				throw new HttpException('2fa.jwt strategy callback: l utilisateur n existe pas dans la database.', HttpStatus.UNAUTHORIZED);
			// Remettre une bonne erreur //throw new UnauthorizedException();

			if (utilisateur.sessionId != payload.sessionId)
				throw new HttpException('2fa.jwt strategy callback: Bad sessionId', HttpStatus.UNAUTHORIZED);

			// AJOUTER twoFaEnabled dans le token pour que ca marche
			if (utilisateur.twoFaEnabled === true && (payload.cookie_type != 'twofa') )
				throw new HttpException('2fa.jwt strategy callback: l utilisateur a active la 2fa et n a pas son cookie TWOFA_TOKEN', HttpStatus.UNAUTHORIZED);

			//return true;// true ecrase les donnees utilissateur si le guard 2fa passe apres le guard auth token
			//l'ordre des guards est determine par l'ordre des useGlobalGuards dans main.ts
			return utilisateur;
	}
}
