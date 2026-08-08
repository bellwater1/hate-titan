import Job from './Job.js'

const TTS_ENDPOINT = 'https://www.google.com/speech-api/v1/synthesize'
const JOB_ICON_ENDPOINT = 'https://cdn.jsdelivr.net/gh/xivapi/classjob-icons@refs/heads/master/companion'
const JOB_NT = Job.NameTypes.KOREAN_SHORTEST
const PLAYBACK_MODES = ['party', 'personal']
const DEFAULT_PLAYBACK_MODE = 'personal'

export default class View {
  me = null
  app = null
  sayType = null
  playbackMode = DEFAULT_PLAYBACK_MODE
  images = {}

  constructor (app, sayType = Job.NameTypes.KOREAN_SHORT) {
    this.app = app
    this.sayType = sayType
    const savedMode = localStorage.getItem('playbackMode')
    this.playbackMode = PLAYBACK_MODES.includes(savedMode)
      ? savedMode
      : DEFAULT_PLAYBACK_MODE
    this.preloadTiles()
  }

  setPlaybackMode (mode) {
    if (!PLAYBACK_MODES.includes(mode)) return

    this.playbackMode = mode
    localStorage.setItem('playbackMode', mode)
    console.log('playback mode updated', mode)
  }

  say (opts) {
    if (typeof opts === 'string') {
      return this.say({ text: opts, lang: 'ko', speed: 0.6 })
    }

    const params = new URLSearchParams(opts)
    return new Audio(`${TTS_ENDPOINT}?${params}`).play()
  }
  
  clearTiles () {
    while (this.app.hasChildNodes()) {
      this.app.removeChild(this.app.firstChild)
    }
  }
  
  getTile (name) {
    if (name instanceof Job) {
      return this.getTile(name.getName(Job.NameTypes.XIVAPI))
    }
  
    if (this.images[name]) return this.images[name]
    const url = `${JOB_ICON_ENDPOINT}/${name}.png`
  
    return new Promise(resolve => {
      const img = document.createElement('img')
      img.setAttribute('src', url)
      img.setAttribute('width', '32')
      img.setAttribute('height', '32')
      img.addEventListener('load', () => resolve((this.images[name] = img)))
    })
  }

  async preloadTiles () {
    this.app.appendChild(await this.getTile('none'))
    await Promise.all(Job.instances.map(n => this.getTile(n)))
  }

  update ({ me, party, priority, gaols }) {
    if (me) {
      this.me = me
      console.log('player updated', me)

    }

    if (party) {
      console.log('party updated', party)
    }

    if (priority) {
      console.log('priority updated', priority)

    }

    if (gaols) {
      if (this.playbackMode === 'party') {
        this.say(gaols.map(p => p.job.getName(this.sayType)).join(' '))
      } else {
        const order = this.me
          ? 1 + gaols.findIndex(p => p.id === this.me.id)
          : 0

        this.say(order
          ? `${order}번째`
          : gaols.map(p => p.job.getName(this.sayType)).join(' '))
      }
      
      Promise.all(gaols.map(p => this.getTile(p.job)))
        .then(tiles => this.app.replaceChildren(...tiles))
        .catch(console.error)
      console.log('gaols updated', gaols)

    }
  }
}
