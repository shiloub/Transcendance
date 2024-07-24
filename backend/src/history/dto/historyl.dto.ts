import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Length, isNotEmpty, isNumber } from "class-validator"



export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 10)
    login: string
}