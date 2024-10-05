import * as THREE from 'three';
import {FrontSide} from 'three';
import {CelestialBodyList} from './CelestialBodyList';
import {Util} from "./Util";

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
    excentricAnomalyE: number;
    perihelion: number;
    meanLongitude: number;
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
        meanLongitude: number,
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
        this.excentricAnomalyE = 0;
        this.perihelion = longitudeOfPerihelion - longitudeOfAscendingNode;
        this.meanLongitude = meanLongitude;
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

        let xOrbPlane = this.semiMajorAxis * (Math.cos(this.excentricAnomaly(date)) - this.e);
        let yOrbPlane = this.semiMajorAxis * Math.sqrt(1 - Math.pow(this.e, 2)) * Math.sin(this.excentricAnomaly(date));

        let xCart = xOrbPlane * (Math.cos(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) - Math.sin(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) * Math.cos(this.inclination))
            + yOrbPlane * (-Math.sin(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) - Math.cos(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) * Math.cos(this.inclination));

        let yCart = xOrbPlane * (Math.cos(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) + Math.sin(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) * Math.cos(this.inclination))
            + yOrbPlane * (-Math.sin(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) + Math.cos(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) * Math.cos(this.inclination));

        let zCart = xOrbPlane * (Math.sin(this.perihelion) * Math.sin(this.inclination))
            + yOrbPlane * (Math.cos(this.perihelion) * Math.sin(this.inclination));

        return new THREE.Vector3(xCart, zCart, yCart);
    }

    //T en segundos
    orbitalTime(): number {
        let t = (4 * Math.pow(Math.PI, 2)) / (Util.GRAVITATIONALCONSTANT * (Util.SUNMASS + this.mass) * Math.pow(this.semiMajorAxis, 3));
        //console.log("ORBITAL TIME: " + Math.sqrt(t));
        return Math.sqrt(t);
    }

    julianDate(date: Date): number {
        let y = date.getUTCFullYear() + 8000;
        let m = date.getUTCMonth();
        let d = date.getUTCDate();

        if (m < 3) {
            y--;
            m += 12;
        }
        let julianDate = (y * 365) + (y / 4) - (y / 100) + (y / 400) - 1200820 + (m * 153 + 3) / 5 - 92 + d - 1;
        //console.log("JULIAN DATE: " + julianDate);
        return julianDate;
    }

    getT(date: Date): number {
        let JulianDate = this.julianDate(date);
        console.log("T: " + (JulianDate - 2451545)/36525);
        return (JulianDate - 2451545)/36525;
    }

    //M en radianes
    meanAnomaly(date): number {
        let meanAnomaly = this.meanLongitude - this.longitudeOfPerihelion + Math.pow(this.getT(date), 2) * Math.cos(this.getT(date)) + Math.sin(this.getT(date));
        console.log("MEAN ANOMALY: " + meanAnomaly);
        return meanAnomaly;
    }

    //E en radianes
    excentricAnomaly(date: Date): number {
        //e0
        //console.log("ITERACION:")
        let en = this.meanAnomaly(date) + (this.ESTAR * Math.sin(this.meanAnomaly(date)));

        while (Math.abs(this.calculateSumExcentricAnomaly(date, en)) <= Util.TOL) {
            en = en + (this.calculateSumExcentricAnomaly(date, en));
        }

        console.log("EXCENTRIC ANOMALY: " + en);
        return en;
    }

    calculateElapsedTime(t0: Date) {
        let actualTime = new Date().getTime();
        let elapsedTime = actualTime - t0.getTime();
        //console.log("ELAPSED TIME: " + elapsedTime / 1000);
        return elapsedTime / 1000;
    }

    calculateSumMeanAnomaly(date: Date, En: number): number {
        let sumMeanAnomaly = this.meanAnomaly(date) - (En - (this.ESTAR * Math.sin(En)));
        //console.log("SUM MEAN ANOMALY: " + sumMeanAnomaly);
        return sumMeanAnomaly;
    }

    calculateSumExcentricAnomaly(date: Date, En: number): number {
        console.log("SUM EXCENTRIC ANOMALY: " + this.calculateSumMeanAnomaly(date, En) / (1 - (this.ESTAR * Math.cos(En))));
        return this.calculateSumMeanAnomaly(date, En) / (1 - (this.ESTAR * Math.cos(En)));
    }

    trueAnomaly(date: Date): number {
        let E = this.excentricAnomaly(date);
        let tan = Math.sqrt((1 + this.e) / (1 - this.e)) * Math.tan(E / 2);

        //console.log("TRUE ANOMALY: " + 2 * Math.atan(tan));
        return 2 * Math.atan(tan);
    }

    radialDistance(date: Date): number {
        //console.log("RADIAL DISTANCE: " + (this.semiMajorAxis * (1 - Math.pow(this.e, 2))) / (1 + this.e * Math.cos(this.trueAnomaly(date))));
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
    return this.mesh.position;
  }

  getRadius() {
    return this.radius;
  }
}
