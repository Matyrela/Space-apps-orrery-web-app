import * as THREE from 'three';
import {Euler, FrontSide, Vector3} from 'three';
import {CelestialBodyList} from './CelestialBodyList';
import {IRing, Util} from "./Util";

export class CelestialBody {
    name: string;
    radius: number; // Radio del cuerpo celeste
    mass: number;   // Masa del cuerpo celeste
    texture: THREE.Texture;
    time: number;
    position: THREE.Vector3;  // Posición en el espacio (x, y, z)
    velocity: THREE.Vector3;  // Velocidad (puede ser opcional)
    mesh: THREE.Mesh;         // Representación visual en Three.js
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
    period: number;
    trueAnomalyS: number;
    orbitColor: THREE.ColorRepresentation;
    marker: THREE.Mesh;
    rotationBySecond: number;
    initialRotationBySecond: number;
    axisInclicnation: Euler;
    ringMesh: THREE.Mesh | undefined;


    constructor(
        name: string,
        radius: number,
        mass: number,
        texture: string | THREE.Texture,
        time: number,
        initialPosition: THREE.Vector3,
        initialVelocity: THREE.Vector3,
        a: number,
        t0: Date,
        e: number,
        longitudeOfPerihelion: number,
        longitudeOfAscendingNode: number,
        meanLongitude: number,
        inclination: number,
        orbitColor: THREE.ColorRepresentation,
        rotation: number,
        axis: Euler,
        castShadow: boolean = false,
        ring: IRing | undefined = undefined
    ) {
        this.name = name;
        this.radius = Util.KmtoAU(radius)*10000;
        this.mass = mass;
        this.time = time;
        this.position = initialPosition;
        this.velocity = initialVelocity;
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
        this.period = Math.sqrt(Math.pow(this.semiMajorAxis, 3));
        this.trueAnomalyS = 0;
        this.orbitColor = orbitColor;
        this.rotationBySecond = rotation;
        this.initialRotationBySecond = rotation;
        this.axisInclicnation = axis;

        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
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
        this.mesh.rotation.copy(this.axisInclicnation);

        const markerGeometry = new THREE.SphereGeometry(10, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: orbitColor, transparent: true, opacity: 0.5 });
        this.marker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.marker.position.copy(this.position);

        if (ring !== undefined) {
            let ringGeometry = new THREE.RingGeometry(this.radius * ring.innerRadiusMult, this.radius * ring.outerRadiusMult, 32);
            let ringMaterial = new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader().load(ring.ringTexture),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            let ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.position.copy(this.position);

            ringMesh.castShadow = true;
            ringMesh.receiveShadow = true;

            this.ringMesh = ringMesh;
            ringMesh.receiveShadow = true;

            this.mesh.children.push(ringMesh);
        }
    }

    // Función de actualización del cuerpo celeste, a invocar cada frame
    update(date: Date, simSpeed : number, distanceFromCamera : number) {
        
        let vector = this.calculateOrbitPosition(date, simSpeed);

         // Tamaño base del marcador
        const baseSize = 1;

        // Calcular el tamaño del marcador en función de la distancia
        const scaleFactor = baseSize * (distanceFromCamera / 3000);
        this.marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        this.mesh.rotation.copy(new Euler(this.mesh.rotation.x, this.mesh.rotation.y + this.rotationBySecond , this.mesh.rotation.z, "XZY"))

        if (this.name === "Sun") {
            this.marker.scale.set(scaleFactor, scaleFactor, scaleFactor);
            this.marker.position.set(0,0,0);
            return;
        }

        this.marker.position.copy(vector);
        this.mesh.position.copy(vector);
        if (this.ringMesh !== undefined){
            this.mesh.children[0].position.copy( new Vector3(vector.x, vector.y, vector.z));

        }
    }
    // Función de placeholder para las ecuaciones de Kepler
    calculateOrbitPosition(date: Date , simSpeed : number): THREE.Vector3 {

        /* const trueAnomaly = this.trueAnomaly(date);
        const r = this.radialDistance(date);

        let xOrbPlane = r * Math.cos(trueAnomaly); // x in orbital plane
        let yOrbPlane = r * Math.sin(trueAnomaly); // y in orbital plane
        //let xOrbPlane = this.semiMajorAxis * (Math.cos(this.excentricAnomaly(date)) - this.e);
        //let yOrbPlane = this.semiMajorAxis * Math.sqrt(1 - Math.pow(this.e, 2)) * Math.sin(this.excentricAnomaly(date));

        let xCart = xOrbPlane * (Math.cos(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) - Math.sin(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) * Math.cos(this.inclination))
            + yOrbPlane * (-Math.sin(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) - Math.cos(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) * Math.cos(this.inclination));

        let yCart = xOrbPlane * (Math.cos(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) + Math.sin(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) * Math.cos(this.inclination))
            + yOrbPlane * (-Math.sin(this.perihelion) * Math.sin(this.longitudeOfAscendingNode) + Math.cos(this.perihelion) * Math.cos(this.longitudeOfAscendingNode) * Math.cos(this.inclination));

        let zCart = xOrbPlane * (Math.sin(this.perihelion) * Math.sin(this.inclination))
            + yOrbPlane * (Math.cos(this.perihelion) * Math.sin(this.inclination)); */
            var pos = this.propagate(this.trueAnomalyS)
            //console.log(this.trueAnomalyS);

            var currentPosition = [] ;
            var deltaTime = 0 ;

           // Calculate mean motion n:
               var n = (2 * Math.PI) / (this.period * 365.25) ;   // radians per day

           // Calculate Eccentric Anomaly E based on the orbital eccentricity and previous true anomaly:
              var e = this.e ;
              var f = this.trueAnomalyS;
              var eA = this.trueToEccentricAnomaly(e,f)            // convert from true anomaly to eccentric anomaly

           // Calculate current Mean Anomaly
              var m0 = eA - e * Math.sin(eA);

              deltaTime = simSpeed * n

           // Update Mean anomaly by adding the Mean Anomaly at Epoch to the mean motion * delaTime
               var mA = deltaTime + m0

              this.time = this.time +  deltaTime // increment timer

              eA = this.eccentricAnomaly (e, mA)
              var trueAnomaly = this.eccentricToTrueAnomaly(e, eA)
              this.trueAnomalyS = trueAnomaly

              var xCart = pos[0]*Util.SIZE_SCALER;
              var yCart = pos[1]*Util.SIZE_SCALER;
              var zCart = pos[2]*Util.SIZE_SCALER;
              return new THREE.Vector3(yCart, zCart, xCart);
            }

        


    propagate(uA){
        // Purpose: Determine a position on an orbital trajectory based on a true anomoly.
        // Used by the traceOrbits function to draw the orbits.
        var pos = [] ;
        var xdot; var ydot; var zdot;            // velocity coordinates
        var theta = uA;                          // Update true anomaly.
        var smA = this.semiMajorAxis;                      // Semi-major Axis
        var oI =  this.inclination * 0.01745329 ;                      // Orbital Inclination
        var aP = this.longitudeOfPerihelion * 0.01745329 ;                       // Get the object's orbital elements.
        var oE = this.e;                        // Orbital eccentricity
        var aN = this.longitudeOfAscendingNode ;                       // ascending Node
        var sLR = smA * (1 - oE^2) ;             // Compute Semi-Latus Rectum.
        var r = sLR/(1 + oE * Math.cos(theta));  // Compute radial distance.

        // Compute position coordinates pos[0] is x, pos[1] is y, pos[2] is z
        pos[0] = r * (Math.cos(aP + theta) * Math.cos(aN) - Math.cos(oI) * Math.sin(aP + theta) * Math.sin(aN)) ;
        pos[1] = r * (Math.cos(aP + theta) * Math.sin(aN) + Math.cos(oI) * Math.sin(aP + theta) * Math.cos(aN)) ;
        pos[2] = r * (Math.sin(aP + theta) * Math.sin(oI)) ;
        //let xOrbPlane = r * Math.cos(this.trueAnomalyS); // x in orbital plane
        //let yOrbPlane = r * Math.sin(this.trueAnomalyS); // y in orbital plane
        //pos[0] = xOrbPlane * (Math.sin(this.perihelion) * Math.sin(this.inclination))
        //+ yOrbPlane * (Math.cos(this.perihelion) * Math.sin(this.inclination));

        return pos ;
        }
    
        traceOrbits() {
            // Generate line segments from points around the trajectory of the orbiting objects.
            // Use BufferGeometry for creating the line geometry
            const geometry = new THREE.BufferGeometry(); // BufferGeometry instead of Geometry
            const material = new THREE.LineBasicMaterial({ color: this.orbitColor });
            const orbPos = [];
            let i = 0.0;
        
            // Loop to propagate the orbit positions
            while (i <= Math.PI * 2.001) {
                const pos = this.propagate(i);  // Propagate the orbit to get the position
        
                orbPos.push(new THREE.Vector3(pos[1]*Util.SIZE_SCALER, pos[2]*Util.SIZE_SCALER, pos[0]*Util.SIZE_SCALER));
        
                i += 0.001;  // Increment the orbit angle
            }
            
           
            // Set the vertices array to the BufferGeometry
            geometry.setFromPoints(orbPos);
        
            // Create the line object for the orbit trace
            const line = new THREE.Line(geometry, material);
        
            const orbitName = this.name + "_trace";
            line.name = orbitName;
        
            return line;  // Return the line if you want to add it to the scene later
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
        return julianDate;
    }

    getT(date: Date): number {
        let JulianDate = this.julianDate(date);
        return (JulianDate - 2451545)/36525;
    }

    //M en radianes
    meanAnomaly(date: Date): number {
        let meanA = this.meanLongitude - this.longitudeOfPerihelion + Math.pow(this.getT(date), 2) + Math.cos(this.getT(date)) + Math.sin(this.getT(date));
        return meanA;
        //const elapsedSeconds = (date.getTime() - this.t0.getTime()) / 1000;
        //const n = Math.sqrt(Util.GRAVITATIONALCONSTANT * (Util.SUNMASS + this.mass) / Math.pow(this.semiMajorAxis, 3)); // mean motion
        //const M = n * elapsedSeconds; // M = n * (t - t0)
        //console.log("Mean Anomaly: "+ M%(2*Math.PI));
        //return M % (2 * Math.PI); // Keep it in the range [0, 2π]
    }

    //E en radianes
    eccentricAnomaly(e : number, M : number): number {
        //const M = this.meanAnomaly(date);
        //let E = M; // initial guess
        //let delta = 1;
        //while (Math.abs(delta) > 1e-6) {  // tolerance
        //    delta = (E - this.e * Math.sin(E) - M) / (1 - this.e * Math.cos(E)); // Newton's iteration
        //    E -= delta;
        //}
        //return E;
        var eccentricAnomaly = 0;
        var tol = 0.0001;  // tolerance
        var eAo = M;       // initialize eccentric anomaly with mean anomaly
        var ratio = 1;     // set ratio higher than the tolerance
        while (Math.abs(ratio) > tol) {
            var f_E = eAo - e * Math.sin(eAo) - M;
            var f_Eprime = 1 - e * Math.cos(eAo);
            ratio = f_E / f_Eprime;
            if (Math.abs(ratio) > tol) {
                eAo = eAo - ratio;
            // console.log ("ratio  " + ratio) ;
            }
            else
                eccentricAnomaly = eAo;
        }
        return eccentricAnomaly;
        }

    trueToEccentricAnomaly(e,f) {
        // http://mmae.iit.edu/~mpeet/Classes/MMAE441/Spacecraft/441Lecture19.pdf slide 7 
        var eccentricAnomaly = 2* Math.atan(Math.sqrt((1-e)/(1+e))* Math.tan(f/2));

        return eccentricAnomaly ;
    }

    eccentricToTrueAnomaly(e, E) {
    // http://mmae.iit.edu/~mpeet/Classes/MMAE441/Spacecraft/441Lecture19.pdf slide 8
        var trueAnomaly = 2 * Math.atan(Math.sqrt((1+e)/(1-e))* Math.tan(E/2));
        return trueAnomaly
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
        //console.log("SUM EXCENTRIC ANOMALY: " + this.calculateSumMeanAnomaly(date, En) / (1 - (this.ESTAR * Math.cos(En))));
        return this.calculateSumMeanAnomaly(date, En) / (1 - (this.ESTAR * Math.cos(En)));
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

    getRotationSpeed() {
        return this.rotationBySecond;
    }

    setRotationSpeed(number: number) {
        console.log("rotation aaaaaaaa", number)
        this.rotationBySecond = number;
    }
}
