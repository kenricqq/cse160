import EventEmitter from './EventEmitter.js'

export default class Time extends EventEmitter {
	constructor() {
		super()

		// Setup
		this.start = Date.now()
		this.current = this.start
		this.elapsed = 0
		this.delta = 16
		this.running = !document.hidden

		document.addEventListener('visibilitychange', this.visibilityChangeHandler)

		this.tick()
	}

	tick() {
		if (!this.running) {
			return
		}

		const currentTime = Date.now()
		this.delta = currentTime - this.current
		this.current = currentTime
		this.elapsed = this.current - this.start

		this.trigger('tick')

		this.animationFrame = window.requestAnimationFrame(() => {
			this.tick()
		})
	}

	visibilityChangeHandler = () => {
		this.running = !document.hidden

		if (this.running) {
			this.current = Date.now()
			this.tick()
		} else if (this.animationFrame) {
			window.cancelAnimationFrame(this.animationFrame)
			this.animationFrame = null
		}
	}

	destroy() {
		document.removeEventListener('visibilitychange', this.visibilityChangeHandler)

		if (this.animationFrame) {
			window.cancelAnimationFrame(this.animationFrame)
			this.animationFrame = null
		}
	}
}
