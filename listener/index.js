require('log-timestamp');
require('dotenv').config();

class Listener {
  constructor(channel, topic) {
    this.channel = channel;
    this.topic = topic;
  }

  subscribe(messageHandler) {
    const headers = {
      'destination': `/topic/${this.topic}`,
      'activemq.subscriptionName': `${process.env.NROD_CLIENT_ID}-${this.topic}`,
      'ack': 'client-individual'
    };

    this.channel.subscribe(headers, (error, message) => {
      if (error) {
        console.log(`[${this.topic}] Subscribe error: ${error.message}`);
        return;
      }

      message.readString('utf8', (error, string) => {
        if (error) {
          console.log(`[${this.topic}] Read message error: ${error.message}`);
          this.channel.nack(message);
          return;
        }

        let data = {};

        try {
          data = JSON.parse(string);
        } catch(error) {
          console.log(`[${this.topic}] JSON parse error: ${error}`);
          this.channel.nack(message);
          return;
        }

        this.channel.ack(message);
        messageHandler(data);
      });
    })
  }
}

module.exports = Listener;
