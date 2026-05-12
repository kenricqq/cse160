// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars

class Camera {
	fov
	eye
	at
	up
	viewMatrix
	projectionMatrix

	constructor(aspectRatio: number, near: number, far: number) {
		this.fov = 60
		this.eye = new Vector3([0, 0, -2])
		// let eye = new Vector3([0, 0, 0])
		this.at = new Vector3([0, 0, 0])
		// let at = new Vector3([0, 0, -1])
		this.up = new Vector3([0, 1, 0])

		this.viewMatrix = new Matrix4() // scene

		this.updateView()

		this.projectionMatrix = new Matrix4()
		this.projectionMatrix.setPerspective(this.fov, aspectRatio, near, far)
	}

	moveForward() {
		// Compute forward vector f = at - eye.
		// Create a new vector f: let f = new Vector3();
		// Set f to be equal to at: f.set(at);
		// Subtract eye from f: f.sub(eye);
		// Normalize f using f.normalize();
		// Scale f by a desired "speed" value: f.mul(speed)
		// Add forward vector to both eye and center: eye += f; at += f;
		console.log('hi')
	}

	moveBackwards() {
		// Same idea as moveForward, but compute backward  vector b = eye - at instead of forward.
	}

	moveLeft() {
		// Compute forward vector f = at - eye.
		// Compute side vector s = up x f (cross product between up and forward vectors).
		//  Normalize s using s.normalize();
		// Scale s by a desired "speed" value:  s.mul(speed)
		// Add side vector to both eye and center: eye += s; at += s;
	}

	moveRight() {
		// Same idea as moveLeft, but compute the opposite side vector s = f x up.
	}

	panLeft() {
		// Compute the forward vector  f = at - eye;
		// Rotate the vector f by alpha (decide a value) degrees around the up vector.
		// Create a rotation matrix: rotationMatrix.setRotate(alpha, up.x, up.y, up.z).
		// Multiply this matrix by f to compute f_prime = rotationMatrix.multiplyVector3(f);
		// Update the "at"vector to be at = eye + f_prime;
	}

	panRight() {
		// Same idea as panLeft, but rotate u by -alpha degrees around the up vector.
	}

	updateView() {
		this.viewMatrix.setLookAt(
			this.eye.elements[0],
			this.eye.elements[1],
			this.eye.elements[2],
			this.at.elements[0],
			this.at.elements[1],
			this.at.elements[2],
			this.up.elements[0],
			this.up.elements[1],
			this.up.elements[2],
		)
	}
}
