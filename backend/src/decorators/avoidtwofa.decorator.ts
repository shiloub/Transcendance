
import { SetMetadata } from '@nestjs/common';

export const IS_AVOIDTWOFA_KEY = 'avoidTwoFa';
export const AvoidTwoFa = () => SetMetadata(IS_AVOIDTWOFA_KEY, true);
