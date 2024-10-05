export class Util {
    static dateToJulianDate(date: Date): number {
        let y = date.getUTCFullYear();
        let m = date.getUTCMonth() + 1;
        let d = date.getUTCDate();
        return y;
    }
}