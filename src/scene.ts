import GUI from 'lil-gui'
import CameraControls from 'camera-controls';
import * as THREE from 'three';
import {
  AmbientLight,
  AxesHelper,
  Clock,
  LoadingManager,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  PointLightHelper,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import Stats from 'three/examples/jsm/libs/stats.module'
import {toggleFullScreen} from './helpers/fullscreen'
import {resizeRendererToDisplaySize} from './helpers/responsiveness'
import './style-map.css'
import {Skybox} from "./objects/skybox";
import {CelestialBodyList} from "./objects/CelestialBodyList";
import {CelestialBody} from "./objects/CelestialBody";
import {SimulatedTime} from "./objects/SimulatedTime";
import {BehaviorSubject} from 'rxjs'
import { Util } from './objects/Util';

CameraControls.install({THREE: THREE});

const CANVAS_ID = 'scene'

const renderSize = 100000 * 256

let canvas: HTMLElement
let renderer: WebGLRenderer
let scene: Scene
let loadingManager: LoadingManager
let ambientLight: AmbientLight
let pointLight: PointLight
let camera: PerspectiveCamera
let cameraControls: CameraControls;
let axesHelper: AxesHelper
let pointLightHelper: PointLightHelper
let clock: Clock
let stats: Stats
let gui: GUI

let selectedBody: BehaviorSubject<CelestialBody | null> = new BehaviorSubject(null);
let selectedBodyFullyTransitioned: boolean = false;

let orbitLines = []

let searchBar: HTMLInputElement
let similaritiesList: HTMLDivElement
let similaritiesListObjects: HTMLDivElement

let skybox: Skybox
let celestialBodyList: CelestialBodyList

let simulatedTime = new SimulatedTime();
let date = new Date(Date.UTC(2000, 0, 3, 0, 0, 0));
let newDate = new Date();
//Global Variables
let epoch = new Date(Date.now());  // start the calendar 
let simSpeed = 1 ;
let distanceFromCamera = 0;

//a revisar
const animation = { enabled: true, play: true }

init()
animate()
traceOrbits()

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!
    renderer = new WebGLRenderer({canvas, antialias: true, alpha: true})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    scene = new Scene();

    searchBar = document.querySelector('input#body-search')!;
    similaritiesList = document.querySelector('div#similarities')!;
    similaritiesListObjects = document.querySelector('div#similarities-object')!;

    similaritiesList.style.display = 'none';

    function listAll() {
      similaritiesList.style.display = 'block';
      celestialBodyList.getCelestialBodies().forEach((body) => {
        generateElements(body);
      });
    }

    function generateElements(body: CelestialBody) {
      let bodyElement = document.createElement('a');
      bodyElement.classList.add('dropdown-item');
      bodyElement.innerHTML = body.getName();
      if (bodyElement.innerHTML === selectedBody.getValue()?.getName()) {
        bodyElement.classList.add('selected');
      }
      bodyElement.addEventListener('click', () => {
        selectedBody.next(body);
        similaritiesListObjects.innerHTML = '';
        similaritiesList.style.display = 'none';
      });
      similaritiesListObjects.appendChild(bodyElement);
    }

    searchBar.addEventListener('focusout', () => {
      setTimeout(() => {
        similaritiesList.style.display = 'none';
        similaritiesListObjects.innerHTML = '';
      }, 250);
    })

    searchBar.addEventListener('focus', () => {
      listAll();
    });

    searchBar.addEventListener('input', () => {
      let query = searchBar.value;
      if (query.length === 0) {
        similaritiesListObjects.innerHTML = '';
        listAll()
        return
      }

      similaritiesList.style.display = 'block';
      similaritiesListObjects.innerHTML = '';
      celestialBodyList.getCelestialBodies().forEach((body) => {
        if (body.getName().toLowerCase().includes(query.toLowerCase())) {
          generateElements(body);
        }
      });
    });
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new LoadingManager()

    loadingManager.onStart = () => {
      console.log('loading started')
    }
    loadingManager.onProgress = (url, loaded, total) => {
      console.log('loading in progress:')
      console.log(`${url} -> ${loaded} / ${total}`)
    }
    loadingManager.onLoad = () => {
      console.log('loaded!')
    }
    loadingManager.onError = () => {
      console.log('❌ error while loading')
    }
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight('white', 0.05)
    pointLight = new PointLight('white', 2.5, renderSize * 8)
    pointLight.position.set(0, 0, 0)
    pointLight.castShadow = true
    pointLight.shadow.radius = 4
    pointLight.shadow.camera.near = 0.5
    pointLight.shadow.camera.far = 4000
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048
    pointLight.decay = 0;
    scene.add(ambientLight)
    scene.add(pointLight)
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, renderSize * 8)
    camera.position.set(2*Util.SIZE_SCALER, 2*Util.SIZE_SCALER, 5*Util.SIZE_SCALER)

    cameraControls = new CameraControls(camera, renderer.domElement);
    cameraControls.dampingFactor = 0.1;
    cameraControls.draggingDampingFactor = 0.3;
    cameraControls.verticalDragToForward = true;

  }

  // ===== 📦 OBJECTS =====
  {
    skybox = new Skybox(0, 0, 0, renderSize / 1.5, camera);
    scene.add(...skybox.getMesh());

    skybox.galaxyVisible.subscribe((bool) => {
      celestialBodyList.getCelestialBodies().forEach((body) => {
        body.mesh.visible = !bool;
        body.traceOrbits()
      })

      if (bool) {
        orbitLines.forEach((line) => {
          scene.remove(line);
        });
      }else{
        orbitLines.forEach((line) => {
          scene.add(line);
        });
      }
    });

    celestialBodyList = CelestialBodyList.getInstance();

    let sun = new CelestialBody(
        "Sun",
        696340,
        1.989e30,
        'sun.jpg',
        1,
        new Vector3(1, 1, 1),
        new Vector3(0, 0, 0),
        null,
        0,
        new Date(Date.UTC(2000, 0, 1, 0, 0, 0)),
        0,
        0,
        0,
        0,
        0,
        0xFDB813,
        false
    );

    let earth = new CelestialBody(
        "Earth",
        6378,
        5.972e24,
        "earthMap.png",
        1,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        null,
        1.00000018,
        new Date(Date.UTC(2024, 1, 4, 0, 0, 0)),
        0.01673163,
        102.93005885,
        -5.11260389,
        100.46691572,
        -0.00054346,
        0x22ABDF,
        true
    )

    let mars = new CelestialBody(
      "Mars",
      3389.5,
      6.39e23,
      "marsMap.jpg",
      1,
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      null,
      1.52371034,
      new Date(Date.UTC(2000, 0, 1, 0, 0 ,0)),
      0.09339410,
      -23.94362959,
      49.55953891,
      -4.55343205,
      1.84969142,
      0xFF5E33,
      true
    )

    let jupiter = new CelestialBody(
      "Jupiter",
      69911,
      1.898e27,
      "JupiterMap.jpg",
      1,
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      null,
      5.20288700,
      new Date(Date.UTC(1999, 4, 20, 0, 0, 0)),
      0.04838624,
      14.72847983,
      100.47390909,
      34.39644051,
      1.30439695,
      0xA2440A,
      true
    );

    let venus = new CelestialBody(
      "Venus",
      6051.8,
      4.867e24,
      "venusMap.jpg",
      1,
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      null,
      0.72332102,
      new Date(Date.UTC(2014, 8, 5, 0, 0, 0)),
      0.00676399,
      131.76755713,
      76.67261496,
      181.97970850,
      3.39777545,
      0xD8B712,
      true
    );

    let saturn = new CelestialBody(
        "Saturn",
        58232,
        5.683e26,
        "saturnMap.jpg",
        1,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        null,
        9.53667594,
        new Date(Date.UTC(1944, 8, 7, 0, 0, 0)),
        0.05386179,
        92.59887831,
        113.66242448,
        49.95424423,
        2.48599187,
        0xF6D624,
        true
        );

    let mercury = new CelestialBody(
        "Mercury",
        2440,
        3.285e23,
        "mercuryMap.jpg",
        1,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        null,
        0.38709927,
        new Date(Date.UTC(2021, 3, 27, 0, 0, 0)),
        0.20563593,
        77.45779628,
        48.33076593,
        252.25032350,
        7.00497902,
        0xA195A8,
        true
    );

    let uranus = new CelestialBody(
        "Uranus",
        25362,
        8.681e25,
        "uranusMap.jpg",
        1,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        null,
        19.18916464,
        new Date(Date.UTC(1966, 5, 2, 0, 0, 0)),
        0.04725744,
        170.95427630,
        74.01692503,
        313.23810451,
        0.77263783,
        0x949AFF,
        true
    );

    let neptune = new CelestialBody(
        "Neptune",
        24622,
        1.024e26,
        "neptuneMap.jpg",
        1,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        null,
        30.06992276,
        new Date(Date.UTC(2042, 8, 15, 0, 0, 0)),
        0.00859048,
        44.96476227,
        131.78422574,
        -55.12002969,
        1.77004347,
        0x3339FF,
        true
    );

    let asteroids = Util.CSVToArray("data/dataset.csv");

    asteroids.forEach((asteroid) => {
      let asteroidBody = new CelestialBody(
          asteroid.name,
          asteroid.diameter / 2,
          asteroid.gm / Util.GRAVITATIONALCONSTANT,
          "lunasGenericasMap.jpg",
          1,
          new Vector3(0, 0, 0),
          new Vector3(0, 0, 0),
          null,
          asteroid.a,
          new Date(Date.UTC((asteroid.tp))),
          asteroid.e,
          asteroid.q,
          asteroid.om,
          asteroid.w,
          asteroid.ma,
          0x3339FF,
          true
      );
    })

    scene.add(...celestialBodyList.getMeshes());
    let bodyList = celestialBodyList.getCelestialBodies();
    for (let body of bodyList) {
      // Asegúrate de que 'marker' es una propiedad del objeto 'body'
      if (body.marker) {
        scene.add(body.marker);
      }
    }
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls.addEventListener('update', () => {
      let distance = camera.position.distanceTo(new Vector3(0, 0, 0))
      if (distance < renderSize * 0.9) {
        skybox.showGalaxy(false)
      } else {
        skybox.showGalaxy(true)
      }
    })

    selectedBody.subscribe(async (body) => {
      selectedBodyFullyTransitioned = false;

      if (!body) return;

      cameraControls.setPosition(
          body.getPosition().x,
          body.getPosition().y,
          body.getPosition().z,
          true
      )

      selectedBodyFullyTransitioned = true;
    });

    // Full screen
    window.addEventListener('dblclick', (event) => {
      if (event.target === canvas) {
        toggleFullScreen(canvas)
      }
    })
  }

  // ===== 🪄 HELPERS =====
  {
    axesHelper = new AxesHelper(4)
    axesHelper.visible = false
    scene.add(axesHelper)

    pointLightHelper = new PointLightHelper(pointLight, undefined, 'orange')
    pointLightHelper.visible = false
    scene.add(pointLightHelper)
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new Clock()
    stats = new Stats()
    document.body.appendChild(stats.dom)
  }

  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({
      title: '🐞 Debug GUI', width: 300,
      autoPlace: false,
    });
    document.getElementById('gui-container')!.appendChild(gui.domElement);

    const lightsFolder = gui.addFolder('Lights')
    lightsFolder.add(pointLight, 'visible').name('point light')
    lightsFolder.add(ambientLight, 'visible').name('ambient light')

    const helpersFolder = gui.addFolder('Helpers')
    helpersFolder.add(axesHelper, 'visible').name('axes')
    helpersFolder.add(pointLightHelper, 'visible').name('pointLight')

    const cameraFolder = gui.addFolder('Camera')
    cameraFolder.add(cameraControls, 'autoRotate')

    // persist GUI state in local storage on changes
    gui.onFinishChange(() => {
      const guiState = gui.save()
      localStorage.setItem('guiState', JSON.stringify(guiState))
    })

    // load GUI state if available in local storage
    const guiState = localStorage.getItem('guiState')
    if (guiState) gui.load(JSON.parse(guiState))

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem('guiState')
      gui.reset()
    }
    gui.add({resetGui}, 'resetGui').name('RESET')

    gui.close()
  }
}

function traceOrbits() {
  CelestialBodyList.getInstance().getCelestialBodies().forEach(celestialBody => {
    let line = celestialBody.traceOrbits();
    orbitLines.push(line);
  })
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  stats.update();

  date = simulatedTime.getSimulatedTime(500000);

  // Actualizar los cuerpos celestes
  CelestialBodyList.getInstance().getCelestialBodies().forEach(celestialBody => {
    distanceFromCamera = camera.position.distanceTo(celestialBody.marker.position);
    celestialBody.update(epoch, simSpeed, distanceFromCamera);
  })
  updateTheDate();

  if (selectedBody.getValue() !== null && selectedBodyFullyTransitioned) {
    cameraControls.moveTo(
        selectedBody.getValue().getPosition().x,
        selectedBody.getValue().getPosition().y,
        selectedBody.getValue().getPosition().z,
        false
    )
    cameraControls.setTarget(
          selectedBody.getValue().getPosition().x,
          selectedBody.getValue().getPosition().y,
          selectedBody.getValue().getPosition().z,
          false
      )

  }


    
  cameraControls.update(delta);

  // Redimensionar si es necesario
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // Renderizar la escena
  renderer.render(scene, camera);
}

function updateTheDate() {
  if (simSpeed == 1) {
    epoch = new Date(Date.now());            // At maximum speed, increment calendar by a day for each clock-cycle.
  } else if (0 > simSpeed) {
      epoch.setDate(epoch.getDate() - simSpeed * 24 * 3600000)
  } else if (simSpeed == 0){
      epoch.setDate(Date.now());
  } else {  epoch.setTime(epoch.getTime() + simSpeed * 24 * 3600000) ; }  // 24 hours * milliseconds in an hour * simSpeed 
    
  }

