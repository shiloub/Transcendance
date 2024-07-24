import { IsAlpha, IsAlphanumeric, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Length, isNotEmpty, isNumber } from "class-validator"

enum ChannelType {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
    DIRECT = 'DIRECT',
}

export class AddFriendDto {
    @IsNotEmpty()
    @Length(1, 10)
    @IsString()
    login: string;

    @Length(1, 10)
    @IsString()
    @IsNotEmpty()
    target: string;
}

export class ChangeLoginDto {
    @Length(1, 10)
    @IsString()
    @IsAlphanumeric()
    @IsNotEmpty()
    newLogin: string;
}