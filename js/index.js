const ably = new Ably.Realtime(
  'ZCvnXg.VfBHog:wc_JJFI4Mymjl7-LPD_zKNNcO4D5s9QfUZ2mcWcuI6w'
);

const serverChannel = ably.channels.get('server');
const clientChannel = ably.channels.get('client');

// Ably subscriptions
serverChannel.subscribe('pong', (message) => {
  const { numPlayers } = JSON.parse(message.data);

  document.getElementById('start-player-count').textContent = `${
    numPlayers === 0 ? 'No' : numPlayers
  } player${numPlayers === 1 ? '' : 's'} currently in the room`;

  const joinButton = document.getElementById('join-button');
  joinButton.addEventListener('click', joinGame);
  joinButton.disabled = false;
});

// User actions
const pingServer = () => clientChannel.publish('ping', '');

const joinGame = (e) => {
  e.preventDefault();
}

// Game logic

const emptyTabla = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

let tabla = emptyTabla;
let playerId = 0;

let drawnCard = 0;

const cool = () => {
  document.getElementById('tabla-number').textContent = `TABLA ${playerId + 1}`;
  for (let row = 0; row < 4; row++) {
    const currentRow = document.querySelector(`.row-${row}`);
    for (let col = 0; col < 4; col++) {
      const card = getCard(tabla[row * 4 + col]);
      card.className = `col col-${col}`;
      currentRow.append(card);
    }
  }
};

const beans = () => {
  const card = getCard(drawnCard);
  card.id = 'drawn-card';
  document.getElementById('drawn').append(card);
};
