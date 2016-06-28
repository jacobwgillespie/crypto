/* eslint-disable no-console */
import random from 'secure-random';

const logElement = document.getElementById('log');

const skylink = window.skylink = new window.Skylink();

skylink.init('8833f5bc-aced-4342-ae3b-d334c36f3910');

skylink.joinRoom();

skylink.on('incomingMessage', (res, peerID, peerInfo, isSelf) => {
  if (isSelf) return;

  const message = JSON.parse(res.content);
  if (!message.message) return;
  console.log('got message', message);
  const text = Buffer.from(message.message, 'hex').toString();
  logElement.innerHTML = `${logElement.innerHTML}<p>${res.content.length} - ${text}</p>`;
});

const queueSlotCount = 100;
const sendDelay = 0;
const messageQueue = [];
for (let i = 0; i < queueSlotCount; i++) {
  messageQueue[i] = [];
}

const messageMaxLength = 1024;
const packetSize = 2048;

const padding = original => {
  if (original.length > messageMaxLength) throw new Error('message is too long');
  const necessaryPadding = packetSize - original.length;
  return random.randomBuffer(necessaryPadding);
};

const buildMessage = message => ({
  message: Buffer.from(message).toString('hex'),
  padding: padding(message).toString('hex'),
});

const messageLoop = window.messageLoop = (slot = 0) => {
  if (slot >= queueSlotCount) {
    return setTimeout(() => {
      messageLoop(0);
    }, sendDelay);
  }

  // console.log('sending message to slot', slot);

  const message = messageQueue[slot].pop();

  skylink.sendP2PMessage(JSON.stringify(buildMessage(message || '')));

  return setTimeout(() => {
    messageLoop(slot + 1);
  }, sendDelay);
};

window.sendMessage = (slot, message) => {
  if (slot >= 0 && slot <= queueSlotCount) {
    messageQueue[slot].push(message);
  }
};
