export class SimulatedTime {
    private startTime: number;
    private realStartTime: number;

    constructor() {
        this.startTime = Date.now();
        this.realStartTime = this.startTime;
    }

    getSimulatedTime(timeScale: number): Date {
        const realElapsedTime = Date.now() - this.realStartTime;
        const simulatedElapsedTime = realElapsedTime * timeScale;

        // Avoid large jumps by capping time increments
        const maxTimeStep = 100*1000 * 60 * 60 * 24; // 1 day in milliseconds
        const clampedSimulatedTime = Math.min(simulatedElapsedTime, maxTimeStep);

        return new Date(this.startTime + clampedSimulatedTime);
    }
}
