const ably = new Ably.Realtime(
  'ZCvnXg.VfBHog:wc_JJFI4Mymjl7-LPD_zKNNcO4D5s9QfUZ2mcWcuI6w'
);

const serverChannel = ably.channels.get('server');
const clientChannel = ably.channels.get('client');

// variables

const emptyTabla = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let tabla = emptyTabla;
let playerId = 0;

let drawnCard = 0;

const myGuid = `${new Date().getTime()}-${Math.floor(Math.random() * 9999)}`;

// Ably subscriptions
serverChannel.subscribe('pong', (message) => {
  console.log(JSON.parse(message.data));
  const { numPlayers } = JSON.parse(message.data);

  document.getElementById('start-player-count').textContent = `${
    numPlayers === 0 ? 'No' : numPlayers
  } player${numPlayers === 1 ? '' : 's'} currently in the room`;

  const joinButton = document.getElementById('join-button');
  joinButton.addEventListener('click', joinGame);
  joinButton.disabled = false;
});

serverChannel.subscribe('getTabla', (message) => {
  console.log(JSON.parse(message.data));
  const {
    guid,
    playerId: newPlayerId,
    isHost,
    tabla: newTabla,
  } = JSON.parse(message.data);

  if (guid === myGuid) {
    if (isHost) {
      document.getElementById('controls').className = '';
      const drawButton = document.getElementById('draw-button');
      drawButton.addEventListener('click', drawCard);
    }

    document.getElementById('lightbox').className = 'hidden';

    playerId = newPlayerId;
    document.getElementById('tabla-number').textContent = `TABLA ${
      playerId + 1
    }`;

    tabla = newTabla;
    renderTabla();
  }
});

serverChannel.subscribe('draw', (message) => {
  console.log(JSON.parse(message.data));
  const { currentCard, drawn } = JSON.parse(message.data);

  drawnCard = currentCard;
  renderDrawnCard();
});

// User actions
const pingServer = () => clientChannel.publish('ping', '');

const joinGame = (e) => {
  e.preventDefault();

  const playerName = document.getElementById('name-field').value;
  const payload = {
    playerName,
    guid: myGuid,
  };
  clientChannel.publish('playerJoin', JSON.stringify(payload));
};

const drawCard = () => clientChannel.publish('draw', playerId.toString());

// Game logic

const renderTabla = () => {
  document.getElementById('tabla-number').textContent = `TABLA ${playerId + 1}`;
  for (let row = 0; row < 4; row++) {
    const currentRow = document.querySelector(`.row-${row}`);
    for (let col = 0; col < 4; col++) {
      const previousCard = currentRow.querySelector(`.col-${col}`);
      if (previousCard) previousCard.remove();
      const card = getCard(tabla[row * 4 + col]);
      card.className = `col col-${col}`;
      currentRow.append(card);
    }
  }
};

const renderDrawnCard = () => {
  const card = getCard(drawnCard);
  card.id = 'drawn-card';

  const container = document.getElementById('drawn');
  container.lastChild.remove();
  container.append(card);
};
