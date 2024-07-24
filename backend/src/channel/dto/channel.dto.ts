import { IsAlpha, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Length, isNotEmpty, isNumber } from "class-validator"

enum ChannelType {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
    DIRECT = 'DIRECT',
}

export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 10)
    name: string;

    @IsString()
    @Length(0, 10)
    password: string;
}

export class SetAdminDto {
    @IsNotEmpty()
    @Length(1, 10)
    @IsString()
    name: string;

    @IsNotEmpty()
    @Length(1, 10)
    @IsString()
    login: string;
}

export class ChannelCreaDto {
   @IsNotEmpty()
    @Length(1, 10)
    @IsAlpha()
    @IsString()
   name: string;

   @IsEnum(ChannelType)
   type: ChannelType;

   @IsOptional()
    @Length(0, 10)
    @IsString()
   password: string;

   @IsString()
    @Length(1, 10)
    @IsNotEmpty()
   creatorLogin: string;
}

export class NameDto {
    @IsNotEmpty()
    @Length(1, 10)
    @IsString()
    name: string;
}

export class ChannelJoinDto {
    @IsNotEmpty()
    @Length(1, 10)
    @IsString()
    name: string;

    @IsNotEmpty()
    @Length(1, 10)
    @IsString()
    login: string;

    @IsOptional()
    @Length(0, 10)
    @IsString()
    password: string;

}

export class UserloginDto {
    @Length(1, 10)
    @IsString()
    @IsNotEmpty()
    login: string;
}

export class DirectCreaDto {
    @IsString()
    @Length(1, 10)
    @IsNotEmpty()
    starterLogin: string;

    @IsString()
    @Length(1, 10)
    @IsNotEmpty()
    targetLogin: string;

    @IsEnum(ChannelType)
    type: ChannelType;
}

export class idDto {
    @IsNumber()
    id: number;
}