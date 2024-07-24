
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
//import { AuthService } from './auth.service';  // service qui gère l'authentification/logique métier
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42strat') {

	constructor(config: ConfigService, private prisma: PrismaService) {

	let constructed_url: string = 'http://' + config.get('CURRENT_HOST') + ':3001/auth/42/callback';

		super({
			clientID: config.get('UID'),
			clientSecret: config.get('SECRET'),
			callbackURL: constructed_url
		});
	}

	//Passport va automatiquement prendre le retour renvoye par validate et creer un champs user : ... dans le @Req du handler contenant quelque retour que ce soit
	async validate(accessToken: string, refreshToken: string, profile, cb: Function) {

		const user = await this.prisma.user.findUnique( { where: { username: profile.username } });

		if (!user) {
			//console.log('the user ', profile.username, ' dont exist');
			//console.log(' ----- user creation in process -----');

			const user = await this.prisma.user.create({
				data: {
					login: profile.username,
					sessionId: getRandomSessionId(),
					username: profile.username,
				},
			});
			//console.log(' ------ user successfully created -----');

			return user;
		}
		else {
			//console.log(' the user ', profile.username, ' already exist :');
			//console.dir(user, { depth: null })

			const updatedUser = await this.prisma.user.update({

				where: { username: profile.username },

				data: { sessionId: getRandomSessionId() }
			});

			return updatedUser;
		}

	}
}

function getRandomSessionId() {
	let result = '';
	const chain = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const chainLength = chain.length;
	for (let counter = 0; counter < 16; counter++)
	result += chain.charAt(Math.floor(Math.random() * chainLength));
	return result;
}

