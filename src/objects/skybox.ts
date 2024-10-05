import * as THREE from 'three'

export class Skybox {
    private geometry: THREE.SphereGeometry
    private material: THREE.MeshBasicMaterial
    private mesh: THREE.Mesh

    constructor(x: number=0, y: number=0, z: number=0) {
        this.geometry = new THREE.SphereGeometry(100, 32, 32)
        this.material = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            map: new THREE.TextureLoader().load('/assets/space.jpg')
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.set(x, y, z)
    }

    getMesh() {
        return this.mesh
    }
}
