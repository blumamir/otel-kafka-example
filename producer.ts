import { SimpleSpanProcessor, InMemorySpanExporter } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { KafkaJsInstrumentation } from 'opentelemetry-instrumentation-kafkajs';

const tracerProvider = new NodeTracerProvider();
const exporter = new InMemorySpanExporter();
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(exporter));
registerInstrumentations({
  tracerProvider,
  instrumentations: [
    new KafkaJsInstrumentation(),
  ]
})
tracerProvider.register();

import { Kafka } from "kafkajs";

const configuration = {
  topic: "test",
  kafkaHost: "localhost:9092",
};

const kafka = new Kafka({
  clientId: "open-telemetry-demo",
  brokers: [configuration.kafkaHost],
});

export const sendMessage = async (message: any) => {
  const kafkaProducer = kafka.producer();
  await kafkaProducer.connect();

  try {
    await kafkaProducer.send({
      topic: configuration.topic,
      messages: [
        {
          value: JSON.stringify({
            ...message,
          }),
        },
        {
          value: JSON.stringify({
            ...message,
          }),
        },
      ],
    });
    console.log("sent message to kafka");
  } catch (error) {
    console.log(error);
  }
  kafkaProducer.disconnect();

  const generatedSpans = exporter.getFinishedSpans();
  if(generatedSpans.length !== 2) {
    throw new Error('no spans exporter for kafkajs send operation');
  }
  console.log(`got ${generatedSpans.length} spans from kafkajs instrumentation`);
};

sendMessage({ hello: "world2" });
