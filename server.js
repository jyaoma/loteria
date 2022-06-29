const Ably = require('ably');

const ably = new Ably.Realtime(
  'ZCvnXg.VfBHog:wc_JJFI4Mymjl7-LPD_zKNNcO4D5s9QfUZ2mcWcuI6w'
);
const serverChannel = ably.channels.get('server');
const clientChannel = ably.channels.get('client');

const players = [];
const drawn = [];
let host;

clientChannel.subscribe('ping', () => {
  const payload = {
    isHosted: !!host,
    numPlayers: players.length,
  };

  serverChannel.publish('pong', JSON.stringify(payload));
});

clientChannel.subscribe('playerJoin', (message) => {
  const { playerName, guid } = JSON.parse(message.data);
  const playerId = players.length;
  players.push({
    id: players.length,
    name: playerName,
  });

  const tabla = [];
  // generate tabla
  for (let i = 0; i < 16; i++) {
    let genCard = null;
    do {
      genCard = Math.ceil(Math.random() * 54);
    } while (tabla.includes(genCard));
    tabla[tabla.length] = genCard;
  }

  let isHost = false;
  if (!host && host !== 0) {
    host = guid;
    isHost = true;
  }

  const payload = {
    playerId,
    playerName,
    isHost,
    tabla,
    guid,
  };
  // send tabla with playerId, who the host is
  serverChannel.publish('getTabla', JSON.stringify(payload));
});

clientChannel.subscribe('reset', (message) => {
  const playerId = JSON.parse(message.data);
  if (playerId === host) {
    isStarted = false;
    drawn = [];
  }
});

clientChannel.subscribe('draw', (message) => {
  const guid = message.data;
  if (guid === host) {
    console.log('Drawing next card');
    let currentCard = null;
    do {
      currentCard = Math.ceil(Math.random() * 54);
    } while (drawn.includes(currentCard));
    drawn.push(currentCard);

    const payload = {
      currentCard,
      drawn,
    };
    serverChannel.publish('draw', JSON.stringify(payload));
  }
});
