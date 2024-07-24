import { Injectable } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketService {
    constructor(private socketGateway: SocketGateway){}

    sendEvent(username: string, eventName: string, data: any){
        return (this.socketGateway.sendEvent(username, eventName, data));
    }
}
