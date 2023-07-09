import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';

@Injectable()
export class PixService implements OnModuleInit {
  private pix = null;
  private qrCode = null;
  private isPaid = false;
  private server: Server;
  private checkPixStatusJob = null;

  onModuleInit() {
    this.server = new Server(8081, {
      cors: {
        origin: '*',
      },
    });
    this.server.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  async generatePix() {
    if (this.checkPixStatusJob) {
      this.checkPixStatusJob.stop();
    }

    const pix = {
      id: uuidv4(),
      valor: 2.0,
      chave: 'CPF_INEXISTENTE',
      createdAt: new Date(),
    };

    this.pix = pix;
    this.isPaid = false;

    this.qrCode = await QRCode.toDataURL(JSON.stringify(this.pix));
    this.server.emit('pix', { id: this.pix.id, qrCode: this.qrCode });

    this.checkPixStatusJob = cron.schedule(
      '* * * * * *',
      () => {
        this.checkPixStatus();
      },
      {
        scheduled: false,
      },
    );

    this.checkPixStatusJob.start();

    return { id: this.pix.id, qrCode: this.qrCode };
  }

  handleConnection(socket: Socket) {
    console.log('Cliente conectado:', socket.id);

    if (this.pix) {
      socket.emit('pix', { id: this.pix.id, qrCode: this.qrCode });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    }
  }

  checkPixStatus() {
    const tenSecondsPassed =
      Date.now() - new Date(this.pix.createdAt).getTime() >= 10 * 1000;
    const twoMinutesPassed =
      Date.now() - new Date(this.pix.createdAt).getTime() >= 2 * 60 * 1000;

    if (tenSecondsPassed) {
      this.isPaid = true;
    }

    if (this.isPaid || twoMinutesPassed) {
      this.checkPixStatusJob.stop();
      this.pix = null;
      this.qrCode = null;
      this.server.emit('pixStatus', {
        isPaid: this.isPaid,
        hasExpired: twoMinutesPassed,
      });
    }
  }
}
