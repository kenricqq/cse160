declare module 'stats.js' {
	export default class Stats {
		dom: HTMLElement
		showPanel(n: number): void
		begin(): void
		end(): void
	}
}
