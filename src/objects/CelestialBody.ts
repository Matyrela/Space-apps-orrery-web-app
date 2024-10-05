import * as THREE from 'three';

export class CelestialBody {
    name: string;
    radius: number; // Radio del cuerpo celeste
    mass: number;   // Masa del cuerpo celeste
    texture : THREE.Texture;
    time : number;
    position: THREE.Vector3;  // Posición en el espacio (x, y, z)
    velocity: THREE.Vector3;  // Velocidad (puede ser opcional)
    mesh: THREE.Mesh;         // Representación visual en Three.js
    orbitCenter: CelestialBody | null;  // Centro alrededor del cual orbita, si aplica

    constructor(
        name: string,
        radius: number,
        mass: number,
        textuePath: string,
        time: number,
        initialPosition: THREE.Vector3,
        initialVelocity: THREE.Vector3,
        orbitCenter: CelestialBody | undefined
    ) {
        this.name = name;
        this.radius = radius;
        this.mass = mass;
        this.time = time;
        this.position = initialPosition;
        this.velocity = initialVelocity;
        if (orbitCenter === undefined) {
            this.orbitCenter = null;
        }else {
            this.orbitCenter = orbitCenter;
        }
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        this.texture = new THREE.TextureLoader().load(textuePath);
        const material = new THREE.MeshBasicMaterial({map:this.texture, side: THREE.FrontSide}); // Color amarillo por defecto
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }

    // Función de actualización del cuerpo celeste, a invocar cada frame
    update(deltaTime: number) {
        // Aquí iría la actualización de la posición basándose en las ecuaciones de Kepler
        const newPosition = this.calculateOrbitPosition(deltaTime);
        this.position.copy(newPosition);
        this.mesh.position.copy(this.position);
    }

    // Función de placeholder para las ecuaciones de Kepler
    calculateOrbitPosition(deltaTime: number): THREE.Vector3 {
        let dt = deltaTime;
        // Parche temporal que devuelve la posición actual.
        // Aquí se implementarán las ecuaciones de Kepler.

        // Parámetros necesarios podrían ser (solo ejemplos):
        // semiMajorAxis: distancia al centro de la órbita (eje mayor)
        // eccentricity: excentricidad de la órbita
        // inclination: inclinación de la órbita
        // trueAnomaly: ángulo que indica la posición del planeta en la órbita

        // Retornamos un vector 3D que representará la nueva posición
        return new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    }

    // Método para actualizar el mesh visual
    updateMesh() {
        this.mesh.position.copy(this.position);
    }
}
