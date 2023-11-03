import { proportionalParentCoverResize } from 'book-of-spells';

import { SuperVideoBackground } from './super-video-background.js';

export class YoutubeBackground extends SuperVideoBackground {
  constructor(elem, params, id, uid) {
    super(elem, params, id, uid, 'youtube');

    if (!id) return;
    this.injectScript();

    this.ytid = id;
    this.player = null;

    this.injectPlayer();
  }

  initYTPlayer() {
    if (window.hasOwnProperty('YT') && this.player === null) {
      this.player = new YT.Player(this.uid, {
        events: {
          'onReady': this.onVideoPlayerReady.bind(this),
          'onStateChange': this.onVideoStateChange.bind(this)
        }
      });
    }
  }

  injectScript() {
    if (window.hasOwnProperty('YT') || document.querySelector('script[src="https://www.youtube.com/player_api"]')) return
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/player_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  seekTo(seconds, allowSeekAhead = true) {
    this.player.seekTo(seconds, allowSeekAhead);
  }

  onVideoPlayerReady(event) {
    this.seekTo(this.params['start-at']);
  
    if (this.params.autoplay && (this.params['always-play'] || this.isIntersecting)) {
      this.player.playVideo();
      this.element.dispatchEvent(new CustomEvent('video-background-play', { bubbles: true, detail: this }));
    }
  
    this.iframe.style.opacity = 1;
  }

  onVideoStateChange(event) {
    if (event.data === 0 && this.params.loop) {
      this.seekTo(this.params['start-at']);
      this.player.playVideo();
    }
  
    if (event.data === -1 && this.params.autoplay) {
      this.seekTo(this.params['start-at']);
      this.player.playVideo();
      this.element.dispatchEvent(new CustomEvent('video-background-play', { bubbles: true, detail: this }));
    }
  
    this.params["onStatusChange"](event);
  }

  injectPlayer() {
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('frameborder', 0);
    this.iframe.setAttribute('allow', 'autoplay; mute');
    let site = 'https://www.youtube.com/embed/';
    if (this.params['no-cookie']) {
      site = 'https://www.youtube-nocookie.com/embed/';
    }
    let src = `${site}${this.ytid}?&enablejsapi=1&disablekb=1&controls=0&rel=0&iv_load_policy=3&cc_load_policy=0&playsinline=1&showinfo=0&modestbranding=1&fs=0`;
  
    if (this.params.muted) {
      src += '&mute=1';
    }
  
    if (this.params.autoplay && this.params['always-play']) {
      src += '&autoplay=1';
    }
  
    if (this.params.loop) {
      src += '&loop=1';
    }
  
    if (this.params['end-at'] > 0) {
      src += `&end=${this.params['end-at']}`;
    }
  
    this.iframe.src = src;
  
    if (this.uid) {
      this.iframe.id = this.uid;
    }
  
    if (this.params['inline-styles']) {
      this.iframe.style.top = '50%';
      this.iframe.style.left = '50%';
      this.iframe.style.transform = 'translateX(-50%) translateY(-50%)';
      this.iframe.style.position = 'absolute';
      this.iframe.style.opacity = 0;
    }
  
    this.element.appendChild(this.iframe);
  
    if (this.params['fit-box']) {
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
    } else {
      this.resize();
    }
  }

  resize() {
    if (this.params['fit-box']) return;
    proportionalParentCoverResize(this.iframe, this.params.resolution_mod, this.params.offset);
  }

  softPause() {
    if (!this.state.playing || !this.player) return;
    this.player.pauseVideo();
    this.element.dispatchEvent(new CustomEvent('video-background-pause', { bubbles: true, detail: this }));
  }

  softPlay() {
    if (!this.state.playing || !this.player) return;
    this.player.playVideo();
    this.element.dispatchEvent(new CustomEvent('video-background-play', { bubbles: true, detail: this }));
  }

  play() {
    if (!this.player) return;
    this.state.playing = true;
  
    if (this.params['start-at'] && this.player.getCurrentTime() < this.params['start-at'] ) {
      this.seekTo(this.params['start-at']);
    }
    this.player.playVideo();
    this.element.dispatchEvent(new CustomEvent('video-background-play', { bubbles: true, detail: this }));
  }

  pause() {
    this.state.playing = false;
  
    this.player.pauseVideo();
    this.element.dispatchEvent(new CustomEvent('video-background-pause', { bubbles: true, detail: this }));
  }

  unmute() {
    if (!this.player) return;
    this.state.muted = false;
  
    if (!this.state.volume_once) {
      this.state.volume_once = true;
      this.setVolume(this.params.volume);
    }
    this.player.unMute();
    this.element.dispatchEvent(new CustomEvent('video-background-unmute', { bubbles: true, detail: this }));
  }

  mute() {
    if (!this.player) return;
    this.state.muted = true;
  
    this.player.mute();
    this.element.dispatchEvent(new CustomEvent('video-background-mute', { bubbles: true, detail: this }));
  }

  setVolume(volume) {
    if (!this.player) return;
    
    this.player.setVolume(volume * 100);
    this.element.dispatchEvent(new CustomEvent('video-background-volume-change', { bubbles: true, detail: this }));
  }
}
