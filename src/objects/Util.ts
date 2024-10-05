export class Util {
    static dateToJulianDate(date: Date): number {
        let y = date.getUTCFullYear() + 8000;
        let m = date.getUTCMonth();
        let d = date.getUTCDate();

        if (m < 3) {
            y--;
            m += 12;
        }
        return (y * 365) + (y / 4) - (y / 100) + (y / 400) - 1200820 + (m * 153 + 3) / 5 - 92 + d - 1;
    }

    static SUNMASS = 1.989e30;
    static GRAVITATIONALCONSTANT = 6.67430e-11;
    static TOL = 1e-6;
}