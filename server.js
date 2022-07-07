const Ably = require('ably');

const ably = new Ably.Realtime(
  'ZCvnXg.VfBHog:wc_JJFI4Mymjl7-LPD_zKNNcO4D5s9QfUZ2mcWcuI6w'
);
const serverChannel = ably.channels.get('server');
const clientChannel = ably.channels.get('client');

let playerTablas = {};
let players = [];
let drawn = [];
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

  playerTablas[guid] = { name: playerName, tabla: new Array(16).fill(false) };

  const payload = {
    playerId,
    playerName,
    isHost,
    tabla,
    guid,
    playerTablas,
  };
  // send tabla with playerId, who the host is
  serverChannel.publish('getTabla', JSON.stringify(payload));
});

clientChannel.subscribe('reset', (_) => {
  // const playerId = JSON.parse(message.data);
  // if (playerId === host) {
  players = [];
  drawn = [];
  host = null;
  playerTablas = {};
  // }
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

clientChannel.subscribe('newgame', (_) => {
  players = [];
  drawn = [];
  const guids = Object.keys(playerTablas);
  guids.forEach((currentGuid) => {
    const tabla = [];
    // generate tabla
    for (let i = 0; i < 16; i++) {
      let genCard = null;
      do {
        genCard = Math.ceil(Math.random() * 54);
      } while (tabla.includes(genCard));
      tabla[tabla.length] = genCard;
    }
    playerTablas[currentGuid].tabla = new Array(16).fill(false);
    players.push(currentGuid);

    const isCurrentPersonHost = host === currentGuid;
    const payload = {
      playerId: players.length - 1,
      playerName: playerTablas[currentGuid].name,
      isHost: isCurrentPersonHost,
      tabla,
      guid: currentGuid,
      playerTablas,
    };

    console.log(payload);

    serverChannel.publish('getTabla', JSON.stringify(payload));
  });
});

clientChannel.subscribe('update', (message) => {
  const {
    guid,
    tablaStatus: newTablaStatus,
    playerName,
  } = JSON.parse(message.data);
  console.log(JSON.parse(message.data));

  if (!playerTablas[guid]) {
    playerTablas[guid] = { name: playerName };
  }
  playerTablas[guid].tabla = newTablaStatus;
});
