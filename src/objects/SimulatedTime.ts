export class SimulatedTime {
    private startTime: number;
    private realStartTime: number;

    constructor() {
        this.startTime = Date.now();
        this.realStartTime = this.startTime;
    }

    getSimulatedTime(timeScale: number): Date {
        let realElapsedTime = Date.now() - this.realStartTime;
        let simulatedElapsedTime = realElapsedTime * timeScale;
        return new Date(this.startTime + simulatedElapsedTime * 24 * 3600000);
    }
}