import { Howl } from 'howler'

export default class Sound {
	constructor() {
		this.sound = new Howl({
			src: ['fire.wav'],
			loop: true,
		})

		this.play()
	}

	play() {
		this.sound.play()
	}

	destroy() {
		this.sound.unload()
	}
}
