import { Controller, Get, Req, UseGuards, Res, HttpStatus, HttpException, Post, Body, HttpCode } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from '@nestjs/passport';
import { Public } from "src/decorators/public.decorator";

import { toDataURL } from "qrcode";
import { PrismaService } from "src/prisma/prisma.service";
import { AvoidTwoFa } from "src/decorators/avoidtwofa.decorator";

import { ConfigService } from '@nestjs/config';


@Controller('auth')
export class AuthController{
	constructor(private authService: AuthService, private prisma: PrismaService, private config: ConfigService) {}

	//////////////// ROUTES AUTHENTIFICATION API 42 ////////////////
	// ces routes permettent de declencher l authentification basique a l aide de l api de 42

	@Get ('check_authorized')
	check_authorized() {
	}

	@Public()
	@Get('delete_all_cookies')
	deleteCookie(@Res() res) {
		res.cookie('AUTH_TOKEN', '', { expires: new Date(0) });
		res.cookie('TWOFA_TOKEN', '', { expires: new Date(0) });
		res.send();
	}

	@Public()
	@Get('delete_2FA_cookie')
	deleteTwoFaCookie(@Res() res) {
		res.cookie('TWOFA_TOKEN', '', { expires: new Date(0) });
		res.send();
	}
	/* CALL API Le decorateur Public est necessaire pour que la route puisse etre accessible sans passer par le guard jwt puisque l'utilisateur n'est pas encore authentifie */
		@Public()
	@UseGuards(AuthGuard('42strat'))
	@Get('login42')
	shouldnt_be_called() {
		throw new HttpException('[auth.controller] [login42]: le handler de la route login42 ne devrait pas etre appelle', HttpStatus.INTERNAL_SERVER_ERROR);
	}

	// CALLBACK API
	@Public()
	@UseGuards(AuthGuard('42strat'))
	@Get('42/callback')
	async bar(@Req() req, @Res() response) {

		// creation du tokenJWT avec le username, est ce une bonne pratique ?
		const token = await this.authService.generateJwt(req.user, 'basic_auth');
		response.cookie('AUTH_TOKEN', token, { httpOnly: false });
		//return response.send();//options?

		response.redirect('http://' + this.config.get('CURRENT_HOST') + ':3000/bonus');

	}

		//////////////// ROUTES AUTHENTIFICATION 2FA ////////////////

		//@AvoidTwoFa() //normalement twoFaEnabled est a false a ce stade donc le guard 2fa ne devrait pas etre un soucis
		//ici le twoFaSecret du user est change donc il ne faut lancer la route que a l activation
		@Get('2fa_getqr')
		async getqr(@Res() response, @Req() request) {

			const { otpAuthUrl, secret } = await this.authService.launchTwoFa(request.user);
			const result = await toDataURL(otpAuthUrl);

			//changement du secret
			const updatedUser = await this.prisma.user.update({
				where: { username: request.user.username },
				data: { twoFaSecret: secret }
			});

			return (response.json(result));
		}

		//@AvoidTwoFa()
		@Post('2fa_activate') 
		async turnOnTwoFactorAuthentication(@Req() request, @Body() body, @Res() response) {

			//Attention changement de nom twoFaActivate
			const isCodeValid =
				await this.authService.twoFaActivate(
					request.user,
					body.twoFactorCode,
			);

			if (!isCodeValid) {
				throw new HttpException('[auth.controller] [2fa activate]: mauvais code', HttpStatus.UNAUTHORIZED);
			}

			await this.prisma.user.update({
				where: { username: request.user.username },
				data: { twoFaEnabled: true }
			});

			const token = await this.authService.generateJwt(request.user, 'twofa');

			response.cookie('TWOFA_TOKEN', token, { httpOnly: false });
			//response.redirect('http:// CURRENT HOST :3000/login');
			response.send(); //code http ? options ?
				//le @HttpCode(200) enverra la reponse correcte
		}


			//to get the TWOFA_TOKEN cookie quand la 2fa a deja ete activee sur le compte et que l utilisateur se reconnecte
			@AvoidTwoFa()
			@Post('2fa_authenticate') 
			async twoFaAuthentication(@Req() request, @Body() body, @Res() response) {

				const isCodeValid =
					await this.authService.twoFaAuthenticate(
						request.user,
						body.twoFactorCode,
				);

				if (!isCodeValid) {
					throw new HttpException('[auth.controller] [2fa activate]: mauvais code', HttpStatus.UNAUTHORIZED);
				}

				const token = await this.authService.generateJwt(request.user, 'twofa');

				response.cookie('TWOFA_TOKEN', token, { httpOnly: false });
				//response.redirect('http:// CURRENT HOST :3000/login');
				response.send(); //code http ? options ?
					//le @HttpCode(200) enverra la reponse correcte
			}

				@Get('2fa_remove') 
				async remove_2fa(@Req() request, @Res() res) {

					//Attention changement de nom twoFaActivate

					await this.prisma.user.update({
						where: { username: request.user.username },
						data: { twoFaEnabled: false }
					});

					res.cookie('TWOFA_TOKEN', '', { expires: new Date(0) });
					res.send();

					//response.redirect('http:// CURRENT HOST :3000/login');
					//response.send(); //code http ? options ?
						//le @HttpCode(200) enverra la reponse correcte
				}
				////////////////	ROUTES USED BY RouteProtection in REACT ////////////////
				//(protection des routes du front)

				// cette route permet a RouteProtection de react de verifier si l utilisateur a bien son cookie jwt apour proteger les routes
				@AvoidTwoFa()
				@Get('check_auth_cookie')
				check1() {
					//return 'success';
				}

				@Get ('check_2fa_cookie')
				check3(@Req() req) {
					//inutile, maintenant le guard 2fa se lance quand meme avec le cookie AUTH_TOKEN si le 2fa est absent comme ca il peut verifier dans sa methode validate si l utilisateur est valide en fonction de si il a active la verification 2fa ou non (//if (!req.cookies.TWOFA_TOKEN)//	throw new HttpException('[auth.controller] [check_2fa_cookie]: pas de TWOFA cookie', HttpStatus.UNAUTHORIZED);)
				}


			////////////////	ROUTES FOR REACT CHECK ////////////////
			// ( servent a afficher l etat d authentification dans le front)

			@Get ('simple_test')
			just_a_simple_test() {
			}

			// route pour React pour l affichage de l etat de l activation 2FA
			@AvoidTwoFa()
			@Get('check_2fa_activation')
			//@HttpCode(200) // est ce ok comme ca
			async check_2fa_activation(@Req() request) {

				const currentUser = await this.prisma.user.findUnique({
					where: { username: request.user.username },
				});

				if (!currentUser.twoFaEnabled)
					throw new HttpException('[auth.controller] [check_2fa_validation]: 2FA INACTIF', HttpStatus.UNAUTHORIZED);
			}

			//check for basic auth
			@AvoidTwoFa()
		@Get('check_is_signed')
		@HttpCode(200)
		checkIsSigned() {
		}

}
