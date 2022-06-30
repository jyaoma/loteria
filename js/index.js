const ably = new Ably.Realtime(
  'ZCvnXg.VfBHog:wc_JJFI4Mymjl7-LPD_zKNNcO4D5s9QfUZ2mcWcuI6w'
);

const serverChannel = ably.channels.get('server');
const clientChannel = ably.channels.get('client');

// variables

const emptyTabla = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let tabla = emptyTabla;
let tablaStatus = Array(16).fill(false);
let playerId = 0;

let drawnCard = 0;
let allDrawnCards = [];

const playerTablas = {};

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

  // delete this
  signInImmediatelyAsHost(numPlayers);
});

serverChannel.subscribe('getTabla', (message) => {
  console.log(JSON.parse(message.data));
  const {
    guid,
    playerId: newPlayerId,
    playerName,
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
  } else {
    playerTablas[guid] = {
      name: playerName,
      tabla: Array(16).fill(false),
    };
    renderOtherPlayers();
  }
});

serverChannel.subscribe('draw', (message) => {
  console.log(JSON.parse(message.data));
  const { currentCard, drawn } = JSON.parse(message.data);

  drawnCard = currentCard;
  allDrawnCards = drawn;
  renderDrawnCard();
  renderOverlays();
});

clientChannel.subscribe('loteria', (message) => {
  const winnerGuid = message.data;
  if (winnerGuid !== myGuid) {
    alert('Someone got Loteria!');
  } else {
    alert('You win!');
  }
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

const drawCard = () => clientChannel.publish('draw', myGuid);

const loteria = () => clientChannel.publish('loteria', myGuid);

// Game logic

const renderTabla = () => {
  document.getElementById('tabla-number').textContent = `TABLA ${playerId + 1}`;
  for (let row = 0; row < 4; row++) {
    const currentRow = document.querySelector(`.row-${row}`);
    for (let col = 0; col < 4; col++) {
      const previousCard = currentRow.querySelector(`.col-${col}`);
      if (previousCard) previousCard.remove();

      const column = document.createElement('div');
      column.className = `col col-${col}`;

      const card = getCard(tabla[row * 4 + col]);
      card.className = `col col-${col}`;
      column.append(card);

      const cardOverlay = document.createElement('div');
      cardOverlay.className = 'card-overlay card-overlay--hidden';
      column.append(cardOverlay);

      const marker = document.createElement('div');
      marker.className = 'card-marker hidden';
      column.append(marker);

      column.addEventListener('click', () => {
        if (!allDrawnCards.includes(tabla[row * 4 + col])) {
          alert("This card hasn't been drawn yet!");
          return;
        }
        const newStatus = !tablaStatus[row * 4 + col];
        tablaStatus[row * 4 + col] = newStatus;
        marker.className = `card-marker${
          newStatus ? '' : ' hidden'
        }`;
        cardOverlay.className = `card-overlay${
          newStatus && allDrawnCards.includes(tabla[row * 4 + col])
            ? ' card-overlay--hidden'
            : ''
        }`;
        checkForLoteria();
      });

      currentRow.append(column);
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

const renderOverlays = () => {
  const tablaComponent = document.getElementById('tabla');
  tabla.forEach((cardNo, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const cardOverlay = tablaComponent
      .querySelector(`.row-${row}`)
      .querySelector(`.col-${col}`)
      .querySelector('.card-overlay');

    const isPendingClick =
      allDrawnCards.includes(cardNo) && !tablaStatus[index];
    cardOverlay.className = `card-overlay${
      isPendingClick ? '' : ' card-overlay--hidden'
    }`;
  });
};

const renderOtherPlayers = () => {
  document.getElementById('opponents-grid').remove();
  const grid = document.createElement('div');
  grid.id = 'opponents-grid';

  const guids = Object.keys(playerTablas).sort();
  guids.forEach((guid) => {
    const { playerName, tabla } = playerTablas[guid];
  });

  document.getElementById('opponents').append(grid);
};

const checkIfAllChecked = (...indexes) => {
  let isComplete = true;
  indexes.forEach((index) => {
    if (!tablaStatus[index]) isComplete = false;
  });
  return isComplete;
};

const checkForLoteria = () => {
  const winFound =
    // rows
    checkIfAllChecked(0, 1, 2, 3) ||
    checkIfAllChecked(4, 5, 6, 7) ||
    checkIfAllChecked(8, 9, 10, 11) ||
    checkIfAllChecked(12, 13, 14, 15) ||
    // cols
    checkIfAllChecked(0, 4, 8, 12) ||
    checkIfAllChecked(1, 5, 9, 13) ||
    checkIfAllChecked(2, 6, 10, 14) ||
    checkIfAllChecked(3, 7, 11, 15) ||
    // squares
    checkIfAllChecked(0, 1, 4, 5) ||
    checkIfAllChecked(1, 2, 5, 6) ||
    checkIfAllChecked(2, 3, 6, 7) ||
    checkIfAllChecked(4, 5, 8, 9) ||
    checkIfAllChecked(5, 6, 9, 10) ||
    checkIfAllChecked(6, 7, 10, 11) ||
    checkIfAllChecked(8, 9, 12, 13) ||
    checkIfAllChecked(9, 10, 13, 14) ||
    checkIfAllChecked(10, 11, 14, 15) ||
    // four corners
    checkIfAllChecked(0, 3, 12, 15);
  document.getElementById('win-button').disabled = !winFound;
};

// Dev helpers
const signInImmediatelyAsHost = (numPlayers) => {
  if (numPlayers === 0) {
    const payload = {
      playerName: 'Jeremy',
      guid: myGuid,
    };
    clientChannel.publish('playerJoin', JSON.stringify(payload));
  }
};
