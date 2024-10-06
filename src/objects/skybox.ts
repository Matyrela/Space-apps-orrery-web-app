import * as THREE from 'three'
import {Vector3} from "three";

export class Skybox {
    private skyboxGeometry: THREE.SphereGeometry
    private skyboxMaterial: THREE.MeshBasicMaterial
    private skyboxMesh: THREE.Mesh

    private galaxyGeometry: THREE.PlaneGeometry
    private galaxyMaterial: THREE.MeshBasicMaterial
    private galaxyMesh: THREE.Mesh

    private camera: THREE.Camera

    private swapDistance: number;

    constructor(
        x: number=0,
        y: number=0,
        z: number=0,
        radius: number=100,
        camera: THREE.Camera,
    ) {
        this.skyboxGeometry = new THREE.SphereGeometry(radius, 32, 32)
        this.skyboxMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load("skybox.png"),
            side: THREE.BackSide,
            transparent: false,
        })
        this.skyboxMesh = new THREE.Mesh(this.skyboxGeometry, this.skyboxMaterial)
        this.skyboxMesh.position.set(x, y, z)


        this.galaxyGeometry = new THREE.PlaneGeometry(radius*8, radius*8)
        this.galaxyMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load("galaxy.png"),
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1,
        })
        this.galaxyMesh = new THREE.Mesh(this.galaxyGeometry, this.galaxyMaterial)
        this.galaxyMesh.position.set(x, y + 75000, z)

        this.camera = camera

        this.swapDistance = radius * 0.9;
        this.update();
    }

    getMesh(): THREE.Mesh[] {
        return [this.skyboxMesh, this.galaxyMesh]
    }

    update() {
        let distance = this.camera.position.distanceTo(new Vector3(0, 0, 0))
        if (distance < this.swapDistance) {
            this.skyboxMesh.visible = true
            this.galaxyMesh.visible = false
        } else {
            this.skyboxMesh.visible = false
            this.galaxyMesh.visible = true
        }
    }
}
