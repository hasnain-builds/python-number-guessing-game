const CONFIG = {
  easy: { min: 1, max: 50, attempts: 4, label: 'Easy' },
  medium: { min: 1, max: 100, attempts: 5, label: 'Medium' },
  hard: { min: 1, max: 500, attempts: 8, label: 'Hard' },
};

const STORAGE_KEYS = {
  settings: 'neon-oracle-settings',
  stats: 'neon-oracle-stats',
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  soundOn: true,
  difficulty: 'medium',
};

const DEFAULT_STATS = {
  gamesPlayed: 0,
  wins: 0,
  bestScore: null,
  luckyGuesses: 0,
  winsByDifficulty: {
    easy: 0,
    medium: 0,
    hard: 0,
  },
  achievements: {
    firstWin: false,
    luckyGuess: false,
    easyConqueror: false,
    mediumMaster: false,
    guessmasterLegend: false,
  },
};

const SOCIAL_LINKS = {
  github: 'https://github.com/hasnain-builds',
  linkedin: 'https://www.linkedin.com/in/hasnainbuilds/',
  instagram: 'https://www.instagram.com/hasnain.learn/',
};

const dom = {
  body: document.body,
  loadingScreen: document.getElementById('loading-screen'),
  difficultyScreen: document.getElementById('difficulty-screen'),
  gameScreen: document.getElementById('game-screen'),
  particleField: document.getElementById('particle-field'),
  openAbout: document.getElementById('open-about'),
  difficultyStartButtons: Array.from(document.querySelectorAll('[data-difficulty-start]')),
  continueButton: document.getElementById('continue-button'),
  guessForm: document.getElementById('guess-form'),
  guessInput: document.getElementById('guess-input'),
  submitGuess: document.getElementById('submit-guess'),
  resultMessage: document.getElementById('result-message'),
  guessFeedback: document.getElementById('guess-feedback'),
  attemptsRemaining: document.getElementById('attempts-remaining'),
  attemptsBar: document.getElementById('attempts-bar'),
  progressText: document.getElementById('progress-text'),
  rangeText: document.getElementById('range-text'),
  modeText: document.getElementById('mode-text'),
  gamesPlayed: document.getElementById('games-played'),
  winsCount: document.getElementById('wins-count'),
  winPercent: document.getElementById('win-percent'),
  bestScore: document.getElementById('best-score'),
  easyWins: document.getElementById('easy-wins'),
  mediumWins: document.getElementById('medium-wins'),
  hardWins: document.getElementById('hard-wins'),
  activeDifficultyBadge: document.getElementById('active-difficulty-badge'),
  guessCount: document.getElementById('guess-count'),
  guessHistory: document.getElementById('guess-history'),
  badgeList: document.getElementById('badge-list'),
  statusPanel: document.getElementById('status-panel'),
  modal: document.getElementById('modal'),
  modalKicker: document.getElementById('modal-kicker'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalActions: document.getElementById('modal-actions'),
  modalClose: document.getElementById('modal-close'),
  aboutModal: document.getElementById('about-modal'),
  aboutClose: document.getElementById('about-close'),
  victoryScreen: document.getElementById('victory-screen'),
  victoryTitle: document.getElementById('victory-title'),
  victoryMeta: document.getElementById('victory-meta'),
  victoryCopy: document.getElementById('victory-copy'),
  victoryPlayAgain: document.getElementById('victory-play-again'),
  victoryClose: document.getElementById('victory-close'),
  soundToggle: document.getElementById('sound-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  restartGame: document.getElementById('restart-game'),
  resetStats: document.getElementById('reset-stats'),
  backDifficulty: document.getElementById('back-difficulty'),
  openHelp: document.getElementById('open-help'),
  difficultyButtons: Array.from(document.querySelectorAll('[data-difficulty]')),
  guessTemplate: document.getElementById('guess-template'),
  socialButtons: Array.from(document.querySelectorAll('[data-social]')),
  menuToggle: document.getElementById('menu-toggle'),
  mobileMenu: document.getElementById('mobile-menu'),
  mobileOpenAbout: document.getElementById('mobile-open-about'),
  mobileThemeToggle: document.getElementById('mobile-theme-toggle'),
  mobileSoundToggle: document.getElementById('mobile-sound-toggle'),
};

const soundContext = window.AudioContext ? new AudioContext() : null;

const appState = {
  settings: loadJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  stats: loadJSON(STORAGE_KEYS.stats, DEFAULT_STATS),
  difficulty: 'medium',
  selectedDifficulty: null,
  min: CONFIG.medium.min,
  max: CONFIG.medium.max,
  maxAttempts: CONFIG.medium.attempts,
  secretNumber: 0,
  attemptsLeft: CONFIG.medium.attempts,
  guessHistory: [],
  roundOver: false,
  locked: false,
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...JSON.parse(raw) };
  } catch {
    return structuredClone(fallback);
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function syncSettings() {
  saveJSON(STORAGE_KEYS.settings, appState.settings);
}

function syncStats() {
  saveJSON(STORAGE_KEYS.stats, appState.stats);
}

function setTheme(theme) {
  appState.settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  if (dom.themeToggle) dom.themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  if (dom.mobileThemeToggle) dom.mobileThemeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  syncSettings();
}

function setSound(enabled) {
  appState.settings.soundOn = enabled;
  if (dom.soundToggle) dom.soundToggle.setAttribute('aria-pressed', String(enabled));
  if (dom.mobileSoundToggle) dom.mobileSoundToggle.setAttribute('aria-pressed', String(enabled));
  syncSettings();
}

function applyDifficulty(difficulty) {
  const nextMode = CONFIG[difficulty];
  appState.difficulty = difficulty;
  appState.min = nextMode.min;
  appState.max = nextMode.max;
  appState.maxAttempts = nextMode.attempts;
  appState.settings.difficulty = difficulty;
  appState.attemptsLeft = nextMode.attempts;
  syncSettings();
  document.documentElement.dataset.difficulty = difficulty;
  updateActiveDifficultyBadge();

  dom.difficultyButtons.forEach((button) => {
    const active = button.dataset.difficulty === difficulty;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  dom.difficultyStartButtons.forEach((button) => {
    button.classList.toggle('selected', button.dataset.difficultyStart === difficulty);
  });

  updateModeText();
  updateProgress();
  dom.guessInput.placeholder = `Type a number ${appState.min}-${appState.max}`;
}

function setSelectedDifficulty(difficulty) {
  appState.selectedDifficulty = difficulty;
  dom.continueButton.disabled = false;

  dom.difficultyStartButtons.forEach((button) => {
    const active = button.dataset.difficultyStart === difficulty;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });

  dom.difficultyButtons.forEach((button) => {
    const active = button.dataset.difficulty === difficulty;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  document.documentElement.dataset.difficulty = difficulty;
}

function updateDifficultyStats() {
  dom.easyWins.textContent = String(appState.stats.winsByDifficulty.easy);
  dom.mediumWins.textContent = String(appState.stats.winsByDifficulty.medium);
  dom.hardWins.textContent = String(appState.stats.winsByDifficulty.hard);
}

function updateActiveDifficultyBadge() {
  const current = CONFIG[appState.difficulty];
  dom.activeDifficultyBadge.textContent = current.label;
  dom.activeDifficultyBadge.dataset.difficulty = appState.difficulty;
}

function updateModeText() {
  const current = CONFIG[appState.difficulty];
  dom.modeText.textContent = `${current.label} · ${current.min} to ${current.max} · ${current.attempts} attempts`;
  dom.rangeText.textContent = `Guess a number between ${current.min} and ${current.max}`;
}

function updateStats() {
  const { gamesPlayed, wins, bestScore } = appState.stats;
  const winPercent = gamesPlayed ? (wins / gamesPlayed) * 100 : 0;

  dom.gamesPlayed.textContent = String(gamesPlayed);
  dom.winsCount.textContent = String(wins);
  dom.winPercent.textContent = formatPercent(winPercent);
  dom.bestScore.textContent = bestScore === null ? '—' : String(bestScore);

  updateDifficultyStats();
  updateBadges();
  syncStats();
}

function updateBadges() {
  const { achievements, luckyGuesses, winsByDifficulty } = appState.stats;
  const states = {
    'first-win': achievements.firstWin,
    'lucky-guess': achievements.luckyGuess,
    'easy-conqueror': achievements.easyConqueror || winsByDifficulty.easy >= 5,
    'medium-master': achievements.mediumMaster || winsByDifficulty.medium >= 5,
    'guessmaster-legend': achievements.guessmasterLegend || winsByDifficulty.hard >= 5,
  };

  dom.badgeList.querySelectorAll('.badge').forEach((badge) => {
    const unlocked = states[badge.dataset.badge] || (badge.dataset.badge === 'lucky-guess' && luckyGuesses > 0);
    badge.classList.toggle('unlocked', Boolean(unlocked));
    badge.classList.toggle('locked', !unlocked);
  });
}

function updateProgress() {
  const ratio = appState.attemptsLeft / appState.maxAttempts;
  const percent = Math.max(ratio * 100, 0);
  dom.attemptsBar.style.width = `${percent}%`;
  dom.attemptsRemaining.textContent = String(appState.attemptsLeft);
  dom.progressText.textContent = `${appState.attemptsLeft} / ${appState.maxAttempts} attempts left`;
  dom.attemptsBar.style.background = getProgressGradient(ratio);
  dom.attemptsBar.parentElement.style.boxShadow = ratio < 0.3 ? '0 0 0 1px rgba(255, 107, 139, 0.2), 0 0 24px rgba(255, 107, 139, 0.2)' : 'none';
}

function getProgressGradient(ratio) {
  if (ratio <= 0.2) return 'linear-gradient(90deg, #ff6b8b, #f7b267)';
  if (ratio <= 0.45) return 'linear-gradient(90deg, #ffd166, #ff8f70)';
  return 'linear-gradient(90deg, #58e39f, #38d7c8)';
}

function clearFeedback() {
  dom.resultMessage.textContent = '';
  dom.resultMessage.classList.remove('visible');
  dom.guessFeedback.innerHTML = '';
  dom.statusPanel.hidden = true;
  dom.statusPanel.classList.remove('pulse');
}

function showMessage(text, tone) {
  dom.statusPanel.hidden = false;
  dom.resultMessage.textContent = text;
  dom.resultMessage.style.color = tone === 'danger' ? 'var(--danger)' : tone === 'success' ? 'var(--success)' : 'var(--text)';
  dom.resultMessage.classList.remove('visible');
  void dom.resultMessage.offsetWidth;
  dom.resultMessage.classList.add('visible');
}

function addFeedbackChip(text, tone) {
  const chip = document.createElement('span');
  chip.className = `feedback-chip ${tone}`;
  chip.textContent = text;
  dom.guessFeedback.prepend(chip);
  while (dom.guessFeedback.children.length > 4) {
    dom.guessFeedback.removeChild(dom.guessFeedback.lastElementChild);
  }
}

function renderGuessHistory() {
  dom.guessHistory.innerHTML = '';
  dom.guessCount.textContent = `${appState.guessHistory.length} guess${appState.guessHistory.length === 1 ? '' : 'es'}`;
  if (!appState.guessHistory.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'guess-item';
    emptyState.innerHTML = '<span class="guess-number">No guesses yet</span><span class="guess-result">Start the round</span>';
    dom.guessHistory.append(emptyState);
    return;
  }

  appState.guessHistory.slice(0, 6).forEach((entry) => {
    const node = dom.guessTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.state = entry.state;
    node.querySelector('.guess-number').textContent = `#${entry.value}`;
    node.querySelector('.guess-result').textContent = entry.label;
    dom.guessHistory.appendChild(node);
  });
}

function setGuessingEnabled(enabled) {
  appState.locked = !enabled;
  dom.guessInput.disabled = !enabled;
  dom.submitGuess.disabled = !enabled;
}

function playSound(type) {
  if (!appState.settings.soundOn || !soundContext) return;

  const now = soundContext.currentTime;
  const oscillator = soundContext.createOscillator();
  const gainNode = soundContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(soundContext.destination);

  const presets = {
    click: { frequency: 260, end: 0.07, type: 'sine', gain: 0.035 },
    wrong: { frequency: 170, end: 0.22, type: 'triangle', gain: 0.08 },
    correct: { frequency: 520, end: 0.4, type: 'sine', gain: 0.09 },
    gameover: { frequency: 110, end: 0.65, type: 'sawtooth', gain: 0.11 },
  };

  const preset = presets[type] || presets.click;
  oscillator.type = preset.type;
  oscillator.frequency.setValueAtTime(preset.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(preset.frequency * 1.9, now + preset.end * 0.55);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(preset.gain, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + preset.end);

  oscillator.start(now);
  oscillator.stop(now + preset.end + 0.03);
}

function ensureAudioReady() {
  if (soundContext && soundContext.state === 'suspended') {
    soundContext.resume().catch(() => {});
  }
}

function spawnParticles() {
  const count = 24;
  dom.particleField.innerHTML = '';

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'particle';
    const size = randomNumber(4, 10);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${randomNumber(0, 100)}%`;
    particle.style.top = `${randomNumber(0, 100)}%`;
    particle.style.animationDuration = `${randomNumber(12, 24)}s`;
    particle.style.animationDelay = `${randomNumber(0, 8)}s`;
    particle.style.opacity = `${Math.random() * 0.5 + 0.15}`;
    dom.particleField.appendChild(particle);
  }
}

function spawnConfetti() {
  const colors = ['#7c8cff', '#38d7c8', '#58e39f', '#f7b267', '#ffd166', '#ff6b8b'];
  const pieces = 90;

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.background = colors[index % colors.length];
    piece.style.left = `${50 + randomNumber(-10, 10)}%`;
    piece.style.top = `${40 + randomNumber(-8, 8)}%`;
    piece.style.transform = `translate(-50%, -50%) rotate(${randomNumber(0, 360)}deg)`;
    piece.style.width = `${randomNumber(8, 14)}px`;
    piece.style.height = `${randomNumber(10, 18)}px`;

    const animation = piece.animate(
      [
        { transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(-50%, -50%) translate(${randomNumber(-320, 320)}px, ${randomNumber(-420, -180)}px) rotate(${randomNumber(360, 1080)}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: randomNumber(850, 1500),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        delay: randomNumber(0, 150),
        fill: 'forwards',
      }
    );

    document.body.appendChild(piece);
    animation.onfinish = () => piece.remove();
  }
}

function showModal({ kicker, title, body, actions }) {
  dom.modalKicker.textContent = kicker;
  dom.modalTitle.textContent = title;
  dom.modalBody.textContent = body;
  dom.modalActions.innerHTML = '';

  actions.forEach(({ label, variant, handler }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = variant === 'primary' ? 'primary-button' : 'ghost-button';
    button.textContent = label;
    button.addEventListener('click', handler);
    dom.modalActions.appendChild(button);
  });

  dom.modal.hidden = false;
  dom.modal.setAttribute('aria-hidden', 'false');
  setGuessingEnabled(false);
  playSound('gameover');
}

function showAboutModal() {
  dom.aboutModal.hidden = false;
  dom.aboutModal.setAttribute('aria-hidden', 'false');
  dom.openAbout.setAttribute('aria-expanded', 'true');
  dom.aboutClose.focus();
}

function hideAboutModal() {
  dom.aboutModal.hidden = true;
  dom.aboutModal.setAttribute('aria-hidden', 'true');
  dom.openAbout.setAttribute('aria-expanded', 'false');
  dom.openAbout.focus();
}

function openSocialLink(network) {
  const url = SOCIAL_LINKS[network];
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function hideModal() {
  dom.modal.hidden = true;
  dom.modal.setAttribute('aria-hidden', 'true');
  setGuessingEnabled(true);
}

function showVictoryScreen({ guess, attemptsUsed }) {
  dom.victoryMeta.innerHTML = '';
  dom.victoryTitle.textContent = '🎯 GuessMaster Champion!';

  const entries = [
    ['Secret Number', guess],
    ['Attempts Used', attemptsUsed],
    ['Difficulty', CONFIG[appState.difficulty].label],
    ['Best Score', appState.stats.bestScore ?? guess],
  ];

  entries.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'meta-card';
    card.innerHTML = `<span class="stat-label">${label}</span><strong>${value}</strong>`;
    dom.victoryMeta.appendChild(card);
  });

  dom.victoryCopy.textContent = `You solved it with ${attemptsUsed} guess${attemptsUsed === 1 ? '' : 'es'} remaining in ${CONFIG[appState.difficulty].label} mode.`;
  dom.victoryScreen.hidden = false;
  dom.victoryScreen.setAttribute('aria-hidden', 'false');
  setGuessingEnabled(false);
  spawnConfetti();
  playSound('correct');
  dom.victoryPlayAgain.focus();
}

function hideVictoryScreen() {
  dom.victoryScreen.hidden = true;
  dom.victoryScreen.setAttribute('aria-hidden', 'true');
  setGuessingEnabled(true);
}

function recordStatsOnWin(attemptsUsed) {
  appState.stats.gamesPlayed += 1;
  appState.stats.wins += 1;
  appState.stats.winsByDifficulty[appState.difficulty] += 1;
  if (appState.stats.bestScore === null || attemptsUsed < appState.stats.bestScore) {
    appState.stats.bestScore = attemptsUsed;
  }
  appState.stats.achievements.firstWin = true;
  appState.stats.achievements.easyConqueror = appState.stats.winsByDifficulty.easy >= 5;
  appState.stats.achievements.mediumMaster = appState.stats.winsByDifficulty.medium >= 5;
  appState.stats.achievements.guessmasterLegend = appState.stats.winsByDifficulty.hard >= 5;
  updateStats();
}

function recordStatsOnLoss() {
  appState.stats.gamesPlayed += 1;
  updateStats();
}

function unlockLuckyGuess() {
  if (!appState.stats.achievements.luckyGuess) {
    appState.stats.achievements.luckyGuess = true;
  }
  appState.stats.luckyGuesses += 1;
}

function handleGuessSubmission(event) {
  event.preventDefault();
  ensureAudioReady();

  if (appState.roundOver) return;

  const rawValue = dom.guessInput.value.trim();
  if (!/^[0-9]+$/.test(rawValue)) {
    showMessage('⚠ Enter a valid number', 'danger');
    addFeedbackChip('Numeric input required', 'high');
    shakeCard();
    playSound('wrong');
    return;
  }

  const guess = Number(rawValue);
  if (guess < appState.min || guess > appState.max) {
    showMessage('⚠ Number must be within the selected range', 'danger');
    addFeedbackChip(`Range ${appState.min}-${appState.max}`, 'high');
    shakeCard();
    playSound('wrong');
    return;
  }

  dom.guessInput.value = '';
  appState.guessHistory.unshift({ value: guess, state: 'pending', label: 'Checking...' });
  renderGuessHistory();

  if (guess === appState.secretNumber) {
    appState.roundOver = true;
    appState.guessHistory[0].state = 'correct';
    appState.guessHistory[0].label = '🎉 Correct!';
    renderGuessHistory();
    showMessage('🎉 Correct!', 'success');
    dom.statusPanel.classList.remove('pulse');
    void dom.statusPanel.offsetWidth;
    dom.statusPanel.classList.add('pulse');
    unlockLuckyGuess();
    const attemptsUsed = appState.maxAttempts - appState.attemptsLeft + 1;
    recordStatsOnWin(attemptsUsed);
    syncStats();
    updateProgress();
    showVictoryScreen({ guess, attemptsUsed });
    return;
  }

  appState.attemptsLeft -= 1;
  const isHigh = guess > appState.secretNumber;
  const state = isHigh ? 'high' : 'low';
  const label = isHigh ? '⬇ Lower' : '⬆ Higher';
  appState.guessHistory[0].state = state;
  appState.guessHistory[0].label = label;
  renderGuessHistory();

  showMessage(`You guessed: ${guess}\n\n${label}`, 'danger');
  addFeedbackChip(`${guess} → ${label}`, state);
  shakeCard();
  playSound('wrong');
  updateProgress();

  if (appState.attemptsLeft <= 0) {
    appState.roundOver = true;
    recordStatsOnLoss();
    showMessage(`❌ Game Over!\n\nThe number was: ${appState.secretNumber}`, 'danger');
    showGameOver();
  }
}

function shakeCard() {
  const card = document.querySelector('.game-card');
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
}

function showGameOver() {
  showModal({
    kicker: 'GuessMaster',
    title: 'Game Over',
    body: `The secret number was ${appState.secretNumber}. Reset the round and challenge the board again.`,
    actions: [
      {
        label: 'Play Again',
        variant: 'primary',
        handler: () => {
          hideModal();
          resetRound({ preserveHistory: false });
        },
      },
      {
        label: 'Close',
        variant: 'ghost',
        handler: hideModal,
      },
    ],
  });
}

function resetRound({ preserveHistory }) {
  appState.secretNumber = randomNumber(appState.min, appState.max);
  appState.attemptsLeft = appState.maxAttempts;
  appState.roundOver = false;
  if (!preserveHistory) {
    appState.guessHistory = [];
  }
  updateModeText();
  updateProgress();
  renderGuessHistory();
  clearFeedback();
  dom.guessInput.value = '';
  dom.guessInput.disabled = false;
  dom.submitGuess.disabled = false;
  dom.guessInput.placeholder = `Type a number ${appState.min}-${appState.max}`;
  setGuessingEnabled(true);
}

function resetStatistics() {
  appState.stats = structuredClone(DEFAULT_STATS);
  syncStats();
  updateStats();
  showMessage('Statistics were reset.', '');
}

function showDifficultySelection() {
  dom.difficultyScreen.hidden = false;
  document.body.classList.add('pre-start');
  dom.continueButton.disabled = !appState.selectedDifficulty;
}

function hideDifficultySelection() {
  dom.difficultyScreen.hidden = true;
  document.body.classList.remove('pre-start');
}

function showGameScreen() {
  dom.gameScreen.hidden = false;
  dom.gameScreen.classList.remove('is-visible');
  void dom.gameScreen.offsetWidth;
  dom.gameScreen.classList.add('is-visible');
}

function hideGameScreen() {
  dom.gameScreen.classList.remove('is-visible');
  dom.gameScreen.hidden = true;
}

function startGameWithDifficulty(difficulty) {
  applyDifficulty(difficulty);
  appState.settings.difficulty = difficulty;
  syncSettings();
  hideDifficultySelection();
  showGameScreen();
  dom.difficultyButtons.forEach((button) => {
    button.disabled = true;
  });
  resetRound({ preserveHistory: false });
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function returnToDifficultySelection() {
  appState.roundOver = false;
  appState.guessHistory = [];
  clearFeedback();
  renderGuessHistory();
  dom.guessInput.value = '';
  dom.continueButton.disabled = !appState.selectedDifficulty;
  hideGameScreen();
  showDifficultySelection();
  dom.difficultyButtons.forEach((button) => {
    button.disabled = false;
  });
}

function openHelpModal() {
  showModal({
    kicker: 'How to Play',
    title: 'Guess the hidden number in the current range.',
    body: 'Select a difficulty, type a number, and press Enter or Submit Guess. The game tracks attempts, stats, badges, sound, and theme locally in your browser.',
    actions: [
      {
        label: 'Got it',
        variant: 'primary',
        handler: hideModal,
      },
    ],
  });
}

function wireEvents() {
  dom.guessForm.addEventListener('submit', handleGuessSubmission);
  dom.openAbout.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    if (dom.aboutModal.hidden) {
      showAboutModal();
    } else {
      hideAboutModal();
    }
  });
  dom.restartGame.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    resetRound({ preserveHistory: false });
  });
  dom.resetStats.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    resetStatistics();
  });
  dom.openHelp.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    openHelpModal();
  });
  dom.aboutClose.addEventListener('click', hideAboutModal);

  dom.socialButtons.forEach((button) => {
    button.addEventListener('click', () => {
      ensureAudioReady();
      playSound('click');
      openSocialLink(button.dataset.social);
    });
  });
  const toggleMenu = (expanded) => {
    const isExpanded = expanded !== undefined ? expanded : dom.menuToggle.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;
    dom.menuToggle.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      dom.mobileMenu.hidden = false;
      void dom.mobileMenu.offsetWidth;
      dom.mobileMenu.classList.add('is-active');
    } else {
      dom.mobileMenu.classList.remove('is-active');
      const transitionHandler = () => {
        if (!dom.mobileMenu.classList.contains('is-active')) {
          dom.mobileMenu.hidden = true;
        }
        dom.mobileMenu.removeEventListener('transitionend', transitionHandler);
      };
      dom.mobileMenu.addEventListener('transitionend', transitionHandler);
    }
  };

  if (dom.menuToggle) {
    dom.menuToggle.addEventListener('click', () => {
      ensureAudioReady();
      playSound('click');
      toggleMenu();
    });
  }

  if (dom.mobileOpenAbout) {
    dom.mobileOpenAbout.addEventListener('click', () => {
      ensureAudioReady();
      playSound('click');
      toggleMenu(true);
      showAboutModal();
    });
  }

  if (dom.mobileThemeToggle) {
    dom.mobileThemeToggle.addEventListener('click', () => {
      ensureAudioReady();
      playSound('click');
      setTheme(appState.settings.theme === 'dark' ? 'light' : 'dark');
      toggleMenu(true);
    });
  }

  if (dom.mobileSoundToggle) {
    dom.mobileSoundToggle.addEventListener('click', () => {
      ensureAudioReady();
      playSound('click');
      setSound(!appState.settings.soundOn);
      toggleMenu(true);
    });
  }

  dom.soundToggle.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    setSound(!appState.settings.soundOn);
  });
  dom.themeToggle.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    setTheme(appState.settings.theme === 'dark' ? 'light' : 'dark');
  });
  dom.difficultyStartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      ensureAudioReady();
      playSound('click');
      setSelectedDifficulty(button.dataset.difficultyStart);
    });
  });
  dom.continueButton.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    startGameWithDifficulty(appState.selectedDifficulty || 'medium');
  });
  dom.backDifficulty.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    returnToDifficultySelection();
  });
  dom.modalClose.addEventListener('click', hideModal);
  dom.modal.addEventListener('click', (event) => {
    if (event.target === dom.modal.querySelector('.modal-backdrop')) {
      hideModal();
    }
  });
  dom.victoryPlayAgain.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    hideVictoryScreen();
    resetRound({ preserveHistory: false });
  });
  dom.victoryClose.addEventListener('click', () => {
    ensureAudioReady();
    playSound('click');
    hideVictoryScreen();
  });

  dom.difficultyButtons.forEach((button) => {
    button.disabled = true;
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!dom.aboutModal.hidden) {
        hideAboutModal();
        return;
      }
      if (!dom.modal.hidden) hideModal();
      if (!dom.victoryScreen.hidden) hideVictoryScreen();
    }
  });
}

function init() {
  document.documentElement.dataset.theme = appState.settings.theme;
  setSound(Boolean(appState.settings.soundOn));
  setTheme(appState.settings.theme || 'dark');
  appState.selectedDifficulty = appState.settings.difficulty && CONFIG[appState.settings.difficulty] ? appState.settings.difficulty : 'medium';
  setSelectedDifficulty(appState.selectedDifficulty);
  syncSettings();
  updateStats();
  spawnParticles();
  wireEvents();
  setGuessingEnabled(false);
  dom.openAbout.setAttribute('aria-expanded', 'false');
  showDifficultySelection();
  hideGameScreen();

  window.setTimeout(() => {
    dom.loadingScreen.classList.add('is-hidden');
    window.setTimeout(() => {
      dom.loadingScreen.hidden = true;
      document.body.classList.remove('is-loading');
      dom.difficultyScreen.hidden = false;
    }, 450);
  }, 1100);
}

document.body.classList.add('is-loading');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}