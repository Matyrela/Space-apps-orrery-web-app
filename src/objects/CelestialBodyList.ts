import { CelestialBody } from './CelestialBody';

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

    public getCelestialBodies(): CelestialBody[] {
        return this.celestialBodies;
    }
}