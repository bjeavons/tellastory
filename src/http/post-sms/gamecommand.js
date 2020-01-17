class Command {

    constructor(message) {
        this.help = false;
        this.start = false;
        this.stop = false;
        this.message = '';
        if (!message[0] === '/') {
            return;
        }
        this.message = message.toLowerCase().trim().slice(1);
        switch (this.message) {
            case 'help':
                this.help = true;
                break;

            case 'start':
                this.start = true;
                break;
                
            case 'stop':
                this.stop = true;
                break;
        }
    }
}

module.exports = {
    parse: Command
}