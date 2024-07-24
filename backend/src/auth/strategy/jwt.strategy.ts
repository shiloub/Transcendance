import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(config: ConfigService, private readonly user: UserService) {
		super({
			// recuperation du cookie est elle ok ?
			jwtFromRequest: (req) => {
				if (req.cookies.AUTH_TOKEN)
					return req.cookies.AUTH_TOKEN.access_token;
				else
					throw new HttpException('jwt strategy: pas de AUTH_TOKEN', HttpStatus.UNAUTHORIZED);
			},
			secretOrKey: config.get('JWT_SECRET'), 
		}
			 );
	}

	async validate(payload: any) {

		if (!payload.username)
					throw new HttpException('jwt strategy callback: pas username dans le token', HttpStatus.UNAUTHORIZED);

		const utilisateur = await this.user.findOneByUsername(payload.username);

		// checker cette verification
		if (!utilisateur)
					throw new HttpException('jwt strategy callback: l utilisateur n existe pas dans la database.', HttpStatus.UNAUTHORIZED);
			// Remettre une bonne erreur //throw new UnauthorizedException();
		
		if (utilisateur.sessionId != payload.sessionId)
					throw new HttpException('jwt strategy callback: Bad sessionId', HttpStatus.UNAUTHORIZED);

		return utilisateur;
	}
}
