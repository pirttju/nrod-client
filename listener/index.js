const dotenv = require('dotenv').config();

// Calculates message latency
class Listener {
  constructor(client, topic) {
    this.client = client;
    this.topic = topic;
  }

  subscribe(messageHandler) {
    const headers = {
      'destination': `/topic/${this.topic}`,
      'activemq.subscriptionName': `${process.env.NROD_CLIENT_ID}-${this.topic}`,
      'ack': 'client-individual'
    };

    this.client.subscribe(headers, (error, message) => {
      if (error) {
        console.log(`[${this.topic}] Subscribe error: ${error.message}`);
        return;
      }

      message.readString('utf8', (error, string) => {
        if (error) {
          console.log(`[${this.topic}] Read message error: ${error.message}`);
          // Send NACK
          this.client.nack(message);
          return;
        }

        let data = {};

        try {
          data = JSON.parse(string);
        } catch(error) {
          console.log(`[${this.topic}] JSON parse error: ${error}`);
          // Send NACK
          this.client.nack(message);
          return;
        }

        // Send ACK
        this.client.ack(message);

        messageHandler(data);
      });
    })
  }
}

module.exports = Listener;
