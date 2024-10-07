import { CelestialBody } from './CelestialBody';
import * as THREE from 'three';

export class CelestialBodyList {
    private static instance: CelestialBodyList;
    private celestialBodies: CelestialBody[] = [];

    private constructor() {
    }

    public static getInstance(): CelestialBodyList {
        if (!CelestialBodyList.instance) {
            CelestialBodyList.instance = new CelestialBodyList();
        }

        return CelestialBodyList.instance;
    }

    public addCelestialBody(celestialBody: CelestialBody): void {
        this.celestialBodies.push(celestialBody);
    }

    public getCelestialBody(name: string): CelestialBody | null {
        for (const celestialBody of this.celestialBodies) {
            if (celestialBody.name.toLowerCase() === name.toLowerCase()) {
                return celestialBody;
            }
        }
        return null;  // Si no se encuentra el cuerpo celeste
    }

    public getCelestialBodies(): CelestialBody[] {
        return this.celestialBodies;
    }

    public getMeshes(): THREE.Mesh[] {
        return this.celestialBodies.map(celestialBody => celestialBody.mesh);
    }


}