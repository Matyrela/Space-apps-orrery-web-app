import * as THREE from 'three';
import { CelestialBodyList } from './CelestialBodyList';
import {Util} from "./Util";
import {FrontSide} from "three";

export class CelestialBody {
    name: string;
    radius: number; // Radio del cuerpo celeste
    mass: number;   // Masa del cuerpo celeste
    texture: THREE.Texture;
    time: number;
    position: THREE.Vector3;  // Posición en el espacio (x, y, z)
    velocity: THREE.Vector3;  // Velocidad (puede ser opcional)
    mesh: THREE.Mesh;         // Representación visual en Three.js
    orbitCenter: CelestialBody | null;  // Centro alrededor del cual orbita, si aplica
    semiMajorAxis: number;
    t0: Date;
    e: number;
    ESTAR: number;
    longitudeOfPerihelion: number;
    longitudeOfAscendingNode: number;
    inclination: number;

    constructor(
        name: string,
        radius: number,
        mass: number,
        texture: string | THREE.Texture,
        time: number,
        initialPosition: THREE.Vector3,
        initialVelocity: THREE.Vector3,
        orbitCenter: CelestialBody | undefined,
        a: number,
        t0: Date,
        e: number,
        longitudeOfPerihelion: number,
        longitudeOfAscendingNode: number,
        inclination: number,
        castShadow: boolean = false,
        emissive: number = 0x000000
        ) {
        this.name = name;
        this.radius = radius;
        this.mass = mass;
        this.time = time;
        this.position = initialPosition;
        this.velocity = initialVelocity;
        if (orbitCenter === undefined) {
            this.orbitCenter = null;
        } else {
            this.orbitCenter = orbitCenter;
        }
        this.semiMajorAxis = a;
        this.t0 = t0;
        this.e = e;
        this.ESTAR = 57.29577951308232 * e;
        this.longitudeOfPerihelion = longitudeOfPerihelion;
        this.longitudeOfAscendingNode = longitudeOfAscendingNode;
        this.inclination = inclination;

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        if (typeof texture === 'string') {
            this.texture = new THREE.TextureLoader().load(texture);
        } else {
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
        let vector = this.calculateOrbitPosition(date);
        console.log(vector);

        this.mesh.position.copy(vector);
    }

    // Función de placeholder para las ecuaciones de Kepler
    calculateOrbitPosition(date: Date): THREE.Vector3 {
        let x = this.radialDistance(date) * (Math.cos(this.longitudeOfAscendingNode)
            * Math.cos(this.longitudeOfPerihelion + this.trueAnomaly(date)) - Math.sin(this.longitudeOfAscendingNode)
            * Math.sin(this.longitudeOfPerihelion + this.trueAnomaly(date)) * Math.cos(this.inclination));

        let y = this.radialDistance(date) * (this.longitudeOfAscendingNode * Math.cos(this.longitudeOfPerihelion + this.trueAnomaly(date))
            + Math.cos(this.longitudeOfAscendingNode) * Math.sin(this.longitudeOfPerihelion + this.trueAnomaly(date)) * Math.cos(this.inclination));

        let z = this.radialDistance(date) * (Math.sin(this.longitudeOfPerihelion + this.trueAnomaly(date)) * Math.sin(this.inclination));

        return new THREE.Vector3(x, y, z);
    }

    //T en segundos
    orbitalTime(): number {
        let t = (4 * Math.pow(Math.PI, 2)) / (Util.GRAVITATIONALCONSTANT * (Util.SUNMASS + this.mass) * Math.pow(this.semiMajorAxis, 3));
        return Math.sqrt(t);
    }

    //M en radianes
    meanAnomaly(date: Date): number {
        let meanAnomaly = (2 * Math.PI * this.calculateElapsedTime(this.t0)) / this.orbitalTime();
        return meanAnomaly;
    }

    //E en radianes
    excentricAnomaly(date: Date): number {
        //e0
        let en = this.meanAnomaly(date) + (this.ESTAR * Math.sin(this.meanAnomaly(date)));
        while (Math.abs(this.calculateSumMeanAnomaly(date, en)) <= Util.TOL) {
            en = en + (this.calculateSumExcentricAnomaly(date, en));
        }
        return en;
    }

    calculateElapsedTime(t0: Date) {
        let actualTime = new Date().getTime();
        let elapsedTime = actualTime - t0.getTime();
        return elapsedTime / 1000;
    }

    calculateSumMeanAnomaly(date: Date, En): number {
        return this.meanAnomaly(date) - (En - (this.ESTAR * Math.sin(En)));
    }

    calculateSumExcentricAnomaly(date: Date, En): number {
        return this.calculateSumMeanAnomaly(date, En) / (1 - (this.ESTAR * Math.cos(En)));
    }

    trueAnomaly(date : Date): number {
        let tan = Math.sqrt((1 + this.e) / (1 - this.e)) * Math.tan(this.excentricAnomaly(date) / 2);
        return 2 * Math.atan(tan);
    }

    radialDistance(date : Date): number {
        return (this.semiMajorAxis * (1 - Math.pow(this.e, 2))) / (1 + this.e * Math.cos(this.trueAnomaly(date)));
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
