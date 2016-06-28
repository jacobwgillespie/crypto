/* eslint-disable no-console */
import random from 'secure-random';
import uuid from 'node-uuid';

const logElement = document.getElementById('log');

const skylink = window.skylink = new window.Skylink();

skylink.init('8833f5bc-aced-4342-ae3b-d334c36f3910');

skylink.joinRoom();

const originID = uuid.v4();

const seen = new Set();

const queueSlotCount = 10;
const slotFillMax = 2;
const createDelay = 200;
const messageQueue = [];
for (let i = 0; i < queueSlotCount; i++) {
  messageQueue[i] = [];
}

const messageMaxLength = 1024;
const packetSize = 2048;

let messagesPerSecond = 0;

const padding = original => {
  if (original.length > messageMaxLength) throw new Error('message is too long');
  const necessaryPadding = packetSize - original.length;
  return random.randomBuffer(necessaryPadding);
};

const buildMessage = (slot, message) => ({
  id: uuid.v4(),
  originID,
  slot,
  message: Buffer.from(message).toString('hex'),
  padding: padding(message).toString('hex'),
});

const sendQueue = [];

const messageLoop = window.messageLoop = (slot = 0) => {
  if (slot >= queueSlotCount) {
    return setTimeout(() => {
      messageLoop(0);
    }, createDelay);
  }

  // console.log('sending message to slot', slot);

  if (messageQueue[slot].length < slotFillMax) messageQueue[slot].push(buildMessage(slot, ''));
  const message = messageQueue[slot].shift() || buildMessage(slot, '');
  seen.add(message.id);
  sendQueue.push(message);

  return setTimeout(() => {
    messageLoop(slot + 1);
  }, createDelay);
};

window.sendMessage = (slot, message) => {
  if (slot < 0 && slot >= queueSlotCount) return;
  messageQueue[slot].unshift(buildMessage(slot, message));
};

skylink.on('incomingMessage', (res, peerID, peerInfo, isSelf) => {
  if (isSelf) return;

  const message = JSON.parse(res.content);

  if (seen.has(message.id)) return;

  seen.add(message.id);

  sendQueue.push(message);

  // console.log('got message', message.id, message.originID, message.message);

  if (!message.message) return;
  const text = Buffer.from(message.message, 'hex').toString();
  logElement.innerHTML = `
    <p>${Date.now()} - ${res.content.length} - ${text}</p>${logElement.innerHTML}
  `.trim();
});

const mpsElement = document.getElementById('mps');
const qsizeElement = document.getElementById('qsize');

const sendLoop = window.sendLoop = () => {
  const message = sendQueue.shift();
  if (message) {
    skylink.sendP2PMessage(JSON.stringify(message));
    messagesPerSecond += 1;
  }

  setTimeout(sendLoop, 10);
};

setInterval(() => {
  mpsElement.innerHTML = messagesPerSecond;
  qsizeElement.innerHTML = sendQueue.length;
  messagesPerSecond = 0;
}, 1000);
