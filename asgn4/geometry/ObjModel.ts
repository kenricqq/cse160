// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class ObjModel extends Geometry {
	vertices

	constructor(objSource: string, color = [0.85, 0.7, 0.48]) {
		super()

		this.positionSize = 3
		this.colorSize = 3
		this.floatsPerVertex = 11
		this.texColorWeight = 0
		this.vertices = new Float32Array(this.parseObj(objSource, color))
	}

	parseObj(objSource: string, color: number[]) {
		let positions: number[][] = []
		let texCoords: number[][] = []
		let normals: number[][] = []
		let data: number[] = []
		let min = [Infinity, Infinity, Infinity]
		let max = [-Infinity, -Infinity, -Infinity]

		for (let rawLine of objSource.split('\n')) {
			let line = rawLine.trim()
			if (!line || line.startsWith('#')) continue

			let [kind, ...parts] = line.split(/\s+/)
			if (kind !== 'v') continue

			let position = parts.slice(0, 3).map(Number)
			positions.push(position)
			for (let i = 0; i < 3; i++) {
				min[i] = Math.min(min[i], position[i])
				max[i] = Math.max(max[i], position[i])
			}
		}

		let center = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2]

		function resolveIndex(rawIndex: string, length: number) {
			let index = Number(rawIndex)
			return index < 0 ? length + index : index - 1
		}

		function centeredPosition(position: number[]) {
			return [position[0] - center[0], position[1] - center[1], position[2] - center[2]]
		}

		function normalFromTriangle(a: number[], b: number[], c: number[]) {
			let edgeA = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
			let edgeB = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
			let normal = [
				edgeA[1] * edgeB[2] - edgeA[2] * edgeB[1],
				edgeA[2] * edgeB[0] - edgeA[0] * edgeB[2],
				edgeA[0] * edgeB[1] - edgeA[1] * edgeB[0],
			]
			let length = Math.hypot(normal[0], normal[1], normal[2])
			if (length === 0) return [0, 1, 0]
			return [normal[0] / length, normal[1] / length, normal[2] / length]
		}

		function parseVertex(token: string) {
			let [positionIndex, texCoordIndex, normalIndex] = token.split('/')
			let position = centeredPosition(positions[resolveIndex(positionIndex, positions.length)])
			let texCoord = texCoordIndex ? texCoords[resolveIndex(texCoordIndex, texCoords.length)] : [0, 0]
			let normal = normalIndex ? normals[resolveIndex(normalIndex, normals.length)] : null
			return { position, texCoord, normal }
		}

		function addVertex(vertex: { position: number[]; texCoord: number[]; normal: number[] | null }, fallbackNormal: number[]) {
			let normal = vertex.normal ?? fallbackNormal
			data.push(
				...vertex.position,
				...color,
				vertex.texCoord[0] ?? 0,
				vertex.texCoord[1] ?? 0,
				...normal,
			)
		}

		for (let rawLine of objSource.split('\n')) {
			let line = rawLine.trim()
			if (!line || line.startsWith('#')) continue

			let [kind, ...parts] = line.split(/\s+/)
			if (kind === 'vt') {
				texCoords.push(parts.slice(0, 2).map(Number))
			} else if (kind === 'vn') {
				normals.push(parts.slice(0, 3).map(Number))
			} else if (kind === 'f') {
				let face = parts.map(parseVertex)
				for (let i = 1; i < face.length - 1; i++) {
					let a = face[0]
					let b = face[i]
					let c = face[i + 1]
					let fallbackNormal = normalFromTriangle(a.position, b.position, c.position)
					addVertex(a, fallbackNormal)
					addVertex(b, fallbackNormal)
					addVertex(c, fallbackNormal)
				}
			}
		}

		return data
	}
}
