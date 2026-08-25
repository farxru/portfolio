/**
 * ==============================================================================
 * hate.sex Aesthetic - Interactive & Real-Time Presence Logic
 * ==============================================================================
 */

// Configure your Discord User ID for live status & avatar sync via Lanyard
// To connect your real-time status:
// 1. Enter your Discord User ID below.
// 2. Make sure you have joined the Lanyard Discord server (https://discord.gg/lanyard).
const DISCORD_USER_ID = "1522216225478934598";

class DiscordPresenceManager {
  constructor(userId) {
    this.userId = userId;
    this.ws = null;
    this.heartbeatInterval = null;
    this.dom = {
      cardLink: document.getElementById('discordCardLink'),
      avatar: document.getElementById('discordAvatar'),
      statusDot: document.getElementById('discordStatusDot'),
      username: document.getElementById('discordUsername'),
      statusText: document.getElementById('discordStatusText'),
      activityIcon: document.getElementById('discordActivityIcon'),
      bgImg: document.getElementById('statusCardBg'),
      spotifyContainer: document.getElementById('spotifyContainer'),
      spotifyArt: document.getElementById('spotifyArt'),
      spotifyTitle: document.getElementById('spotifyTitle'),
      spotifyArtist: document.getElementById('spotifyArtist'),
    };
  }

  init() {
    if (this.userId && this.dom.cardLink) {
      this.dom.cardLink.href = `https://discord.com/users/${this.userId}`;
    }

    // Restore cached presence instantly for zero-flicker on refresh
    try {
      const cached = localStorage.getItem('farru_discord_presence');
      if (cached) {
        this.updateUI(JSON.parse(cached));
      }
    } catch (e) {}

    // Initial fetch via REST for instant load
    this.fetchRestPresence();
    // Connect WebSocket for real-time live presence updates
    this.connectWebSocket();
  }

  async fetchRestPresence() {
    if (!this.userId) return;
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${this.userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.updateUI(json.data);
      }
    } catch (e) {
      console.log('Lanyard REST fallback initialized:', e.message);
    }
  }

  connectWebSocket() {
    if (!this.userId) return;

    try {
      this.ws = new WebSocket('wss://api.lanyard.rest/socket');

      this.ws.onopen = () => {
        // Socket connection opened
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { op, t, d } = payload;

          if (op === 1) {
            // Hello opcode -> setup heartbeat and send subscribe
            const interval = d.heartbeat_interval;
            this.startHeartbeat(interval);

            this.ws.send(JSON.stringify({
              op: 2,
              d: {
                subscribe_to_id: this.userId
              }
            }));
          } else if (op === 0) {
            // Event opcode
            if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
              this.updateUI(d);
            }
          }
        } catch (err) {
          console.error('Error handling Lanyard payload', err);
        }
      };

      this.ws.onclose = () => {
        clearInterval(this.heartbeatInterval);
        // Reconnect with exponential backoff after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch (err) {
      console.log('Lanyard socket connection skipped:', err);
    }
  }

  startHeartbeat(interval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: 3 }));
      }
    }, interval);
  }

  updateUI(data) {
    if (!data) return;

    try {
      localStorage.setItem('farru_discord_presence', JSON.stringify(data));
    } catch (e) {}

    const { discord_user, discord_status, activities, spotify } = data;

    // 1. Update Avatar
    if (discord_user && discord_user.avatar) {
      const isGif = discord_user.avatar.startsWith('a_');
      const ext = isGif ? 'gif' : 'png';
      const avatarUrl = `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.${ext}?size=128`;
      if (this.dom.avatar) {
        this.dom.avatar.src = avatarUrl;
      }
    }

    // 2. Update Status Indicator Dot
    const statusHole = document.getElementById('discordStatusHole');
    if (this.dom.statusDot && discord_status) {
      const colorMap = {
        online: 'bg-[#23a55a]',
        idle: 'bg-[#f0b232]',
        dnd: 'bg-[#f23f43]',
        offline: 'bg-[#80848e]'
      };

      // Base classes
      this.dom.statusDot.className = `absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2px] border-[#120a0f] shadow-sm ${colorMap[discord_status] || 'bg-[#80848e]'}`;

      if (statusHole) {
        statusHole.style.display = (discord_status === 'offline') ? 'block' : 'none';
      }
    }

    // 3. Update Username
    if (this.dom.username && discord_user) {
      const displayName = discord_user.global_name || discord_user.username || 'farru';
      this.dom.username.textContent = displayName;
    }

    // 4. Update Activity / Custom Status Text & Emoji
    if (this.dom.statusText) {
      let statusText = 'building scalable systems & bots';
      let iconHtml = `
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="h-2.5 w-2.5 text-pink-300" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
        </svg>`;

      if (activities && activities.length > 0) {
        // Find custom status (type 4) or game/music/streaming
        const customStatus = activities.find(a => a.type === 4);
        const gameStatus = activities.find(a => a.type === 0 || a.type === 1 || a.type === 3);

        if (customStatus) {
          statusText = customStatus.state || 'chilling';
          if (customStatus.emoji) {
            if (customStatus.emoji.id) {
              const isGif = customStatus.emoji.animated;
              const ext = isGif ? 'gif' : 'png';
              const emojiUrl = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${ext}?size=48&quality=lossless`;
              iconHtml = `<img src="${emojiUrl}" alt="${customStatus.emoji.name || 'emoji'}" class="h-3.5 w-3.5 object-contain select-none" loading="eager" />`;
            } else if (customStatus.emoji.name) {
              iconHtml = `<span class="text-xs leading-none select-none">${customStatus.emoji.name}</span>`;
            }
          }
        } else if (gameStatus && gameStatus.name) {
          statusText = `Playing ${gameStatus.name}`;
          iconHtml = `<span class="text-xs leading-none select-none">🎮</span>`;
        }
      }

      this.dom.statusText.textContent = statusText;
      if (this.dom.activityIcon) {
        this.dom.activityIcon.innerHTML = iconHtml;
      }
    }

    // 5. Update Spotify Tracker
    if (this.dom.spotifyContainer) {
      if (spotify && spotify.song) {
        this.dom.spotifyContainer.style.display = 'flex';
        if (this.dom.spotifyTitle) this.dom.spotifyTitle.textContent = spotify.song;
        if (this.dom.spotifyArtist) this.dom.spotifyArtist.textContent = spotify.artist || 'Spotify';
        if (this.dom.spotifyArt && spotify.album_art_url) {
          this.dom.spotifyArt.src = spotify.album_art_url;
        }
      } else {
        this.dom.spotifyContainer.style.display = 'none';
      }
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const presence = new DiscordPresenceManager(DISCORD_USER_ID);
  presence.init();

  // Subtle interactive parallax for project cards & glass pills
  const cards = document.querySelectorAll('.project-card, .status-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Expandable Xieron Card logic (1st click: expand, 2nd click: redirect)
  const xieronCard = document.getElementById('xieronCard');
  const xieronActionCue = document.getElementById('xieronActionCue');
  if (xieronCard) {
    let isExpanded = false;
    xieronCard.addEventListener('click', (e) => {
      if (!isExpanded) {
        e.preventDefault();
        isExpanded = true;
        xieronCard.classList.add('is-expanded');
        if (xieronActionCue) {
          xieronActionCue.textContent = 'visit xieron.com ↗';
          xieronActionCue.className = 'transition-colors text-pink-300 font-semibold';
        }
      }
      // If already expanded, default anchor link opens https://xieron.com/
    });
  }

  // Global ambient background spotlight tracking
  window.addEventListener('mousemove', (e) => {
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round((e.clientY / window.innerHeight) * 100);
    document.documentElement.style.setProperty('--bg-mouse-x', `${x}%`);
    document.documentElement.style.setProperty('--bg-mouse-y', `${y}%`);
  }, { passive: true });
});
