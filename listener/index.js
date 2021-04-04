const dotenv = require('dotenv').config();
const io = require('@pm2/io');

// Calculates message latency
function calculateLatency(ts) {
  const now = new Date();
  const dt = new Date(parseInt(ts));
  const d = (now-dt);

  return d;
}

class Listener {
  constructor(client, topic) {
    this.client = client;
    this.topic = topic;

    // Latency meter
    this.histogram = io.histogram({
      name: `${this.topic} Latency`,
      measurement: 'mean'
    });

    // Message rate meter
    this.meter = io.meter({
      name: `${this.topic} msg/min`,
      type: 'meter',
      samples: 60,
      timeframe: 60
    });
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

      // Update metrics
      const latency = calculateLatency(message.headers.timestamp);
      this.histogram.update(latency);
      this.meter.mark();

      message.readString('utf8', (error, string) => {
        if (error) {
          console.log(`[${this.topic}] Read message error: ${error.message}`);
          this.client.nack(message); // NACK
          return;
        }

        let data = {};

        try {
          data = JSON.parse(string);
        } catch(error) {
          console.log(`[${this.topic}] JSON parse error: ${error}`);
          this.client.nack(message); // NACK
          return;
        }

        this.client.ack(message); // ACK

        messageHandler(data);
      });
    })
  }
}

module.exports = Listener;
