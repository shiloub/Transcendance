import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { send } from 'process';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService)  {}


    async findOneByUsername(username: string) {
		return this.prisma.user.findUnique({ where: { username: username } });
	}
    
    async getIdByLogin(login: string): Promise<number> {
        const user = await this.prisma.user.findFirst({
            where : {
                login,
            }
        })
        return (user.id);
    }

	async getLoginByUsername(username: string): Promise<string> {
		const user = await this.prisma.user.findFirst({
			where : {
				username,
			}
		})
		return (user.login);
	}


	async getUsernameByLogin(login: string): Promise<string> {
		const user = await this.prisma.user.findFirst({
			where : {
				login,
			}
		})
		return (user.username);
	}

	async connect(username: string) {
		try {
			const user = await this.prisma.user.update({
				where : {
					username,
				},
				data: {
					isConnected: true,
				}
			})
		}
		catch {
			//console.log("erreur connect");
		}
	}

	async setInGame(username: string) {
		try {
			const user = await this.prisma.user.update({
				where : {
					username,
				},
				data: {
					isInGame: true,
				}
			})
		}
		catch {
			//console.log("erreur connect");
		}
	}

	async setOutGame(username: string) {
		try {
			const user = await this.prisma.user.update({
				where : {
					username,
				},
				data: {
					isInGame: false,
				}
			})
		}
		catch {
			//console.log("erreur connect");
		}
	}

	
	async disconnect(username: string) {
		try {
			const user = await this.prisma.user.update({
				where : {
					username,
				},
				data: {
					isConnected: false,
				}
			})
		}
		catch {
			//console.log("erreur disconnect");
		}
	}

	async getLoginById(id: number): Promise<string> {
		const user = await this.prisma.user.findUniqueOrThrow({
			where : {
				id,
			}
		})
		return (user.login);
	}

	async getUser(login: string): Promise<User> {
		const user = await this.prisma.user.findUniqueOrThrow({
			where: {
				login: login,
			}
		})
		return (user);
	}

	async getUserByUsername(username: string): Promise<User> {
		const user = await this.prisma.user.findUniqueOrThrow({
			where: {
				username,
			}
		})
		return (user);
	}

	async getUserById(id: number): Promise<User> {
		const user = await this.prisma.user.findUniqueOrThrow({
			where: {
				id,
			}
		})
		return (user);
	}

	async addFriend(login: string, target: string): Promise<User> {
		const senderId = await this.getIdByLogin(login);
		const targetId = await this.getIdByLogin(target);

		const test = await this.prisma.userConnection.findMany({
			where : {
				targetId,
				fromId: senderId,
				followed: 1,
			}
		})

		if (test.length > 0)
			{
				//console.log("already friends: throw");
				throw new Error("Already friend");
			}

			const userco = await this.prisma.userConnection.updateMany({
				where :{
					targetId,
					fromId: senderId,
				},
				data : {
					followed: 1
				}
			})
			//console.log(userco.count);
			if (!userco.count){
				const newUserCo = await this.prisma.userConnection.create({
					data: {
						targetId,
						fromId: senderId,
						blocked: 0,
						followed: 1,
					}
				})
			}
			const added = await this.prisma.user.findUniqueOrThrow({
				where : {
					login: target,
				}
			})
			return (added)
	}


	async delFriend(login: string, target: string): Promise<User> {
		const senderId = await this.getIdByLogin(login);
		const targetId = await this.getIdByLogin(target);

		const test = await this.prisma.userConnection.findMany({
			where : {
				targetId,
				fromId: senderId,
				followed: 0,
			}
		})

		if (test.length > 0)
			{
				//console.log("already not friends: throw");
				throw new Error("Already  not friend");
			}

			const userco = await this.prisma.userConnection.updateMany({
				where :{
					targetId,
					fromId: senderId,
				},
				data : {
					followed: 0,
				}
			})
			const added = await this.prisma.user.findUniqueOrThrow({
				where : {
					login: target,
				}
			})
			return (added)
	}

	async blockUser(login: string, target: string): Promise<User> {
		const senderId = await this.getIdByLogin(login);
		const targetId = await this.getIdByLogin(target);

		const test = await this.prisma.userConnection.findMany({
			where : {
				targetId,
				fromId: senderId,
				blocked: 1,
			}
		})

		if (test.length > 0)
			{
				//console.log("already blocked: throw");
				throw new Error("Already blocked");
			}

			const userco = await this.prisma.userConnection.updateMany({
				where :{
					targetId,
					fromId: senderId,
				},
				data : {
					blocked: 1
				}
			})
			if (!userco){
				const newUserCo = await this.prisma.userConnection.create({
					data: {
						targetId,
						fromId: senderId,
						blocked: 1,
						followed: 0,
					}
				})
			}
			const blocked = await this.prisma.user.findUniqueOrThrow({
				where : {
					login: target,
				}
			})
			return (blocked)
	}
	async unblockUser(login: string, target: string): Promise<User> {
		const senderId = await this.getIdByLogin(login);
		const targetId = await this.getIdByLogin(target);

		const test = await this.prisma.userConnection.findMany({
			where : {
				targetId,
				fromId: senderId,
				blocked: 0,
			}
		})

		if (test.length > 0)
			{
				//console.log("already unblocked: throw");
				throw new Error("Already unblocked");
			}

			const userco = await this.prisma.userConnection.updateMany({
				where :{
					targetId,
					fromId: senderId,
				},
				data : {
					blocked: 0
				}
			})
			const blocked = await this.prisma.user.findUniqueOrThrow({
				where : {
					login: target,
				}
			})
			return (blocked)
	}

	async getFriends(login:string) : Promise<User[]>{
		const user = await this.prisma.user.findUniqueOrThrow({
			where : {
				login,
			},
			include: {
				userConnections :{
					where : {
						followed: 1
					},
					select : {
						targetId: true,
					}
				}
			}
		})
		const usersPromises = user.userConnections.map(async (connection) => {
			const user = await this.prisma.user.findUniqueOrThrow({where: {id: connection.targetId}});
			return user;
		});

		const users = await Promise.all(usersPromises);
		return (users);
	}

	async getMyInvite(username: string) {
		const invites = await this.prisma.invite.findMany({
			where: {
				targetUN: username
			}
		})
		return (invites);
	}

	async inviteUser(inviterUN: string, targetUN: string)
	{
		const invite = await this.prisma.invite.create({
			data: {
				inviterUN,
				targetUN,
			}
		})
	}

	async deleteInvite(inviterUN: string)
	{
		await this.prisma.invite.deleteMany({
			where: {
				inviterUN
			}
		})
	}

	async changeLogin(userId: number, newLogin: string, oldLogin: string){
		
		
		const user = await this.prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				login: newLogin,
			}
		})
		if (!user)
		throw new Error("error: user not find or login taken");
	await this.prisma.message.updateMany({
		where: {
			senderId: userId,
		},
		data: {
			senderLogin: newLogin,
		}
	})
	const games1 = await this.prisma.game.updateMany({
		where : {
			login1: oldLogin,
		},
		data : {
			login1: newLogin,
		}
	})

	const games2 = await this.prisma.game.updateMany({
		where : {
			login2: oldLogin,
		},
		data : {
			login2: newLogin,
		}
	})
	return (user);
	}

	async getAvatarPath(userId: number) :Promise<string>{

		const user = await this.prisma.user.findUniqueOrThrow({
			where : {
				id: userId
			}
		})
		return (user.avatarFileName)
	}

	async changeAvatarPath(userId: number, name: string) {
		const user = await this.prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				avatarFileName: name,
			}
		})
	}

	async getBlocked(login:string) : Promise<number[]>{
		const user = await this.prisma.user.findUniqueOrThrow({
			where : {
				login,
			},
			include: {
				userConnections :{
					where : {
						blocked: 1
					},
					select : {
						targetId: true,
					}
				}
			}
		})
		const usersPromises = user.userConnections.map((connection) => {
			const targetId = connection.targetId;
			return targetId;
		});

		const users = await Promise.all(usersPromises);
		return (users);
	}
}
