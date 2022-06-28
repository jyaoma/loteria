const Ably = require('ably');

const ably = new Ably.Realtime(
  'ZCvnXg.VfBHog:wc_JJFI4Mymjl7-LPD_zKNNcO4D5s9QfUZ2mcWcuI6w'
);
const serverChannel = ably.channels.get('server');
const clientChannel = ably.channels.get('client');

const players = [];
const drawn = [];
let host = true;
let isStarted = false;

clientChannel.subscribe('ping', () => {
  const payload = {
    isHosted: !!host,
    numPlayers: players.length,
  };

  serverChannel.publish('pong', JSON.stringify(payload));
});

clientChannel.subscribe('playerJoin', (playerName) => {
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

  // send tabla with playerId, who the host is
  serverChannel(
    'getTabla',
    JSON.stringify({
      playerId,
      isHost: !!host,
      tabla,
    })
  );
});

clientChannel.subscribe('host', (playerId) => {
  if (host === null) host = playerId;
});

clientChannel.subscribe('start', (playerId) => {
  if (playerId === host) {
    isStarted = true;
  }
});

clientChannel.subscribe('reset', (playerId) => {
  if (playerId === host) {
    isStarted = false;
    drawn = [];
  }
});

clientChannel.subscribe('draw', (playerId) => {
  if (playerId === host) {
    let currentCard = null;
    do {
      currentCard = Math.floor(Math.random() * 54);
    } while (drawn.includes(currentCard));

    serverChannel.publish('draw', currentCard);
  }
});
