/**
 * ==============================================================================
 * Farru - Interactive & Real-Time Presence Logic (White Neon & Glassmorphism)
 * ==============================================================================
 */

// Discord User ID for live status, avatar, and nickname sync via Lanyard
const DISCORD_USER_ID = "924238447147909172";

class DiscordPresenceManager {
  constructor(userId) {
    this.userId = userId;
    this.ws = null;
    this.heartbeatInterval = null;
    this.pollInterval = null;
    this.reconnectTimeout = null;
    this.hasLivePresence = false;
    this.storageKey = `farru_presence_v2_${userId}`;
    this.dom = {
      cardLink: document.getElementById('discordCardLink'),
      avatar: document.getElementById('discordAvatar'),
      statusDot: document.getElementById('discordStatusDot'),
      statusHole: document.getElementById('discordStatusHole'),
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

  extractPresencePayload(data) {
    if (!data) return null;
    if (data.discord_user) return data;
    if (data[this.userId] && data[this.userId].discord_user) return data[this.userId];
    if (data.data && data.data.discord_user) return data.data;
    return null;
  }

  init() {
    if (this.userId && this.dom.cardLink) {
      this.dom.cardLink.href = `https://discord.com/users/${this.userId}`;
    }

    // 1. Purge legacy template cache
    try {
      localStorage.removeItem('farru_discord_presence');
    } catch (e) {}

    // 2. Restore cached presence instantly if valid
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const validPayload = this.extractPresencePayload(parsed);
        if (validPayload && String(validPayload.discord_user.id) === String(this.userId)) {
          this.updateUI(validPayload, true);
        }
      }
    } catch (e) {}

    // 3. Fetch live presence via REST API
    this.fetchRestPresence();

    // 4. Connect WebSocket for instant real-time live presence updates
    this.connectWebSocket();

    // 5. Periodic polling fallback (every 8s until connected, then every 60s as heartbeat sync)
    this.pollInterval = setInterval(() => {
      this.fetchRestPresence();
    }, 8000);
  }

  async fetchRestPresence() {
    if (!this.userId) return;
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${this.userId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        const payload = this.extractPresencePayload(json.data);
        if (payload) {
          this.hasLivePresence = true;
          this.updateUI(payload);
        }
      }
    } catch (e) {
      // Silently retry on next tick
    }
  }

  connectWebSocket() {
    if (!this.userId) return;

    try {
      if (this.ws) {
        try { this.ws.close(); } catch (e) {}
      }

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
            const interval = d.heartbeat_interval || 30000;
            this.startHeartbeat(interval);

            this.ws.send(JSON.stringify({
              op: 2,
              d: {
                subscribe_to_id: this.userId
              }
            }));
          } else if (op === 0) {
            // Presence event opcode
            if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
              const userPayload = this.extractPresencePayload(d);
              if (userPayload) {
                this.hasLivePresence = true;
                this.updateUI(userPayload);
              }
            }
          }
        } catch (err) {
          console.error('Error handling Lanyard payload', err);
        }
      };

      this.ws.onclose = () => {
        clearInterval(this.heartbeatInterval);
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connectWebSocket(), 4000);
      };

      this.ws.onerror = () => {
        if (this.ws) {
          try { this.ws.close(); } catch (e) {}
        }
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

  updateUI(data, isFromCache = false) {
    if (!data || !data.discord_user) return;

    if (!isFromCache) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (e) {}
    }

    const { discord_user, discord_status, activities, spotify } = data;

    // 1. Update Avatar / PFP live
    if (discord_user) {
      let avatarUrl = '';
      if (discord_user.avatar) {
        const isGif = discord_user.avatar.startsWith('a_');
        const ext = isGif ? 'gif' : 'webp';
        avatarUrl = `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.${ext}?size=256`;
      } else {
        const disc = (discord_user.discriminator && discord_user.discriminator !== '0')
          ? (Number(discord_user.discriminator) % 5)
          : ((BigInt(discord_user.id) >> 22n) % 6n);
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${disc}.png`;
      }

      if (this.dom.avatar && avatarUrl && this.dom.avatar.src !== avatarUrl) {
        this.dom.avatar.src = avatarUrl;
        this.dom.avatar.onerror = () => {
          this.dom.avatar.src = 'profile.jpg';
        };
      }
    }

    // 2. Update Status Indicator Dot & Offline Ring
    if (this.dom.statusDot && discord_status) {
      const colorMap = {
        online: 'bg-[#23a55a]',
        idle: 'bg-[#f0b232]',
        dnd: 'bg-[#f23f43]',
        offline: 'bg-[#80848e]'
      };

      this.dom.statusDot.className = `absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2px] border-[#0a0a0e] shadow-sm ${colorMap[discord_status] || 'bg-[#80848e]'}`;
      this.dom.statusDot.setAttribute('title', `Discord: ${discord_status.toUpperCase()}`);

      if (this.dom.statusHole) {
        this.dom.statusHole.style.display = (discord_status === 'offline') ? 'block' : 'none';
      }
    }

    // 3. Update Username / Nickname live
    if (this.dom.username && discord_user) {
      const displayName = discord_user.global_name || discord_user.display_name || discord_user.username || 'Farru';
      this.dom.username.textContent = displayName;
    }

    // 4. Update Activity / Custom Status Text & Emoji
    if (this.dom.statusText) {
      let statusText = 'building scalable systems & bots';
      let iconHtml = `
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="h-2.5 w-2.5 text-white" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path>
        </svg>`;

      if (spotify && spotify.song) {
        statusText = `${spotify.song} — ${spotify.artist || 'Spotify'}`;
        iconHtml = `
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" class="h-2.5 w-2.5 text-[#1ed760]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"></path>
          </svg>`;
      } else if (activities && activities.length > 0) {
        const customStatus = activities.find(a => a.type === 4);
        const gameStatus = activities.find(a => a.type === 0 || a.type === 1 || a.type === 2 || a.type === 3);

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
          const prefixMap = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching' };
          statusText = `${prefixMap[gameStatus.type] || 'Playing'} ${gameStatus.name}`;
          iconHtml = `<span class="text-xs leading-none select-none">🎮</span>`;
        }
      }

      this.dom.statusText.textContent = statusText;
      if (this.dom.activityIcon) {
        this.dom.activityIcon.innerHTML = iconHtml;
      }
    }

    // 5. Update Spotify Tracker Container (if present)
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

  // Throttled interactive parallax and spotlights for cards (prevents lagging low-end devices)
  const cards = document.querySelectorAll('.project-card, .status-card');
  let cardRaf = null;

  const updateCardSpotlight = (card, clientX, clientY) => {
    if (cardRaf) return;
    cardRaf = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      cardRaf = null;
    });
  };

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => updateCardSpotlight(card, e.clientX, e.clientY), { passive: true });
    card.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) updateCardSpotlight(card, e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
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
          xieronActionCue.className = 'transition-colors text-white font-semibold shadow-[0_0_12px_rgba(255,255,255,0.45)]';
        }
      }
      // If already expanded, default anchor link opens https://xieron.com/
    });
  }

  // Throttled global ambient background spotlight tracking (mouse + touch)
  let bgSpotlightRaf = null;
  const updateBgSpotlight = (clientX, clientY) => {
    if (bgSpotlightRaf) return;
    bgSpotlightRaf = requestAnimationFrame(() => {
      const x = Math.round((clientX / window.innerWidth) * 100);
      const y = Math.round((clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty('--bg-mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--bg-mouse-y', `${y}%`);
      bgSpotlightRaf = null;
    });
  };

  window.addEventListener('mousemove', (e) => updateBgSpotlight(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) updateBgSpotlight(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
});
