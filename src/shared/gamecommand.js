class Command {

    constructor(message) {
        this.isCommand = false;
        this.help = false;
        this.start = false;
        this.stop = false;
        this.intro = false;
        this.demo = false;
        this.admin = false;
        this.message = '';
        if (!message[0] === '/') {
            return;
        }
        this.isCommand = true;
        this.message = message.toLowerCase().trim().slice(1);
        switch (this.message.split(' ')[0]) {
            case 'help':
                this.help = true;
                break;

            case 'start':
                this.start = true;
                break;

            case 'leave':
            case 'end':
            case 'stop':
                this.stop = true;
                break;

            case 'intro':
                this.intro = true;
                break;

            case 'demo':
                this.demo = true;
                break;

            case 'admin':
                if (this.message.split(' ').length > 1) {
                    this.admin = true;
                    this.message = message.trim().split(' ')[1];
                }
                break;
        }
    }
}

module.exports = {
    parse: Command
}