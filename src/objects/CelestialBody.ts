import * as THREE from 'three';
import { CelestialBodyList } from './CelestialBodyList';
import {Util} from "./Util";
import {FrontSide} from "three";

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
    semiMajorAxis: number;

    constructor(
        name: string,
        radius: number,
        mass: number,
        texture: string | THREE.Texture,
        time: number,
        initialPosition: THREE.Vector3,
        initialVelocity: THREE.Vector3,
        orbitCenter: CelestialBody | undefined,
        a : number,
        castShadow: boolean = false,
        emissive: number = 0x000000)
     {
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
        this.semiMajorAxis = a;

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        if (typeof texture === 'string') {
            this.texture = new THREE.TextureLoader().load(texture);
        }else{
            this.texture = texture;
        }

        let material;

        if (castShadow) {
            material = new THREE.MeshLambertMaterial({
                map: this.texture,
                side: FrontSide,
                emissive: emissive,
                emissiveIntensity: 0.2
            });
        } else {
            material = new THREE.MeshBasicMaterial({
                map: this.texture,
                side: FrontSide,
            });
        }
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        CelestialBodyList.getInstance().addCelestialBody(this);
    }

    // Función de actualización del cuerpo celeste, a invocar cada frame
    update(date: Date) {
        // Aquí iría la actualización de la posición basándose en las ecuaciones de Kepler
        const newPosition = this.calculateOrbitPosition(date);
        this.position.copy(newPosition);
        this.mesh.position.copy(this.position);
    }

    // Función de placeholder para las ecuaciones de Kepler
    calculateOrbitPosition(date: Date): THREE.Vector3 {
        let jd = Util.dateToJulianDate(date)
        // Aquí se implementarán las ecuaciones de Kepler.

        // Parámetros necesarios podrían ser (solo ejemplos):
        // semiMajorAxis: distancia al centro de la órbita (eje mayor)
        // eccentricity: excentricidad de la órbita
        // inclination: inclinación de la órbita
        // trueAnomaly: ángulo que indica la posición del planeta en la órbita

        // Retornamos un vector 3D que representará la nueva posición
        return new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    }

    orbitalTime() : number {
        let t = (4 * Math.pow(Math.PI, 2)) / (Util.GRAVITATIONALCONSTANT * (Util.SUNMASS + this.mass) * Math.pow(this.semiMajorAxis, 3));
        return Math.sqrt(t);
    }

    meanAnomaly(date : Date) : number {
        let jd = Util.dateToJulianDate(date);
        return (jd - this.time) * (2 * Math.PI) / this.orbitalTime();
    }


    // Método para actualizar el mesh visual
    updateMesh() {
        this.mesh.position.copy(this.position);
    }

  getName() {
    return this.name;
  }

  getPosition() {
    return this.position;
  }

  getRadius() {
    return this.radius;
  }
}
