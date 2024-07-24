import { SetMetadata } from '@nestjs/common';

/* Ce nouveau decorateur publique permet d'eviter le guard global JwtAuthGuard,
ceci afin de permettre de rendre publique les routes d'appelle de l'api de 42 pour l'authentification.
En effet l'utilisateur n'aura pas son cookie AUTH_TOKEN avant l'appelle de l'api, le jwt ne le laisserai pas passer
si l'on ajoutait pas une exception pour ses routes.
La condition d'exception pour ce decoracteur se situe dans la classe JwtAuthGuard (etendant elle meme JwtStrategy) */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
