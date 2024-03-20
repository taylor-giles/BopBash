import { Readable } from "stream";
import axios from 'axios';

export default class AudioStream extends Readable {
    private buffer: Buffer;
    private offset: number;

    constructor(buffer?: Buffer) {
        super();
        this.buffer = buffer ?? Buffer.alloc(44100, 0);
        this.offset = 0;
    }

    public setSilence(){
        this.buffer = Buffer.alloc(44100, 0);
    }

    public async setMP3(url: string){
        const response = await axios.get(url, { responseType: 'arraybuffer'});
        this.buffer = Buffer.from(response.data);
    }

    _read(size: number) {
        //Loop the buffer until desired size is reached
        let bufferToAdd: Buffer = Buffer.alloc(0, 0);
        while(bufferToAdd.length < size){
            let subBuffer = this.buffer.subarray(this.offset, this.offset + size);
            this.offset = (this.offset + subBuffer.length) % this.buffer.length;

            bufferToAdd = Buffer.concat([bufferToAdd, subBuffer]);
        }
        this.push(bufferToAdd);
    }
}