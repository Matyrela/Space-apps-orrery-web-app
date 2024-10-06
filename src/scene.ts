import GUI from 'lil-gui'
import {
  AmbientLight,
  AxesHelper,
  GridHelper,
  LoadingManager,
  Mesh,
  MeshLambertMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import {toggleFullScreen} from './helpers/fullscreen'
import {resizeRendererToDisplaySize} from './helpers/responsiveness'
import './style-map.css'
import {Skybox} from "./objects/skybox";
import {CelestialBodyList} from "./objects/CelestialBodyList";
import {CelestialBody} from "./objects/CelestialBody";
import {SimulatedTime} from "./objects/SimulatedTime";
import { BehaviorSubject } from 'rxjs'
import {Easing, Group, Tween} from '@tweenjs/tween.js'
const baseUrl = import.meta.env.MODE === 'production'
    ? '/Space-apps-orrery-web-app/'
    : '/';

const CANVAS_ID = 'scene'

const renderSize = 100000

let canvas: HTMLElement
let renderer: WebGLRenderer
let scene: Scene
let loadingManager: LoadingManager
let ambientLight: AmbientLight
let pointLight: PointLight
let camera: PerspectiveCamera
let cameraControls: OrbitControls
let axesHelper: AxesHelper
let pointLightHelper: PointLightHelper
//let clock: Clock
let stats: Stats
let gui: GUI

//TweenGroup
const group = new Group();

let selectedBody: BehaviorSubject<CelestialBody | null> = new BehaviorSubject(null);

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

const animation = { enabled: true, play: true }

init()
animate()

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    scene = new Scene();

    searchBar = document.querySelector('input#body-search')!;
    similaritiesList = document.querySelector('div#similarities')!;
    similaritiesListObjects = document.querySelector('div#similarities-object')!;

    similaritiesList.style.display = 'none';

    function listAll(){
      similaritiesList.style.display = 'block';
      celestialBodyList.getCelestialBodies().forEach((body) => {
        generateElements(body);
      });
    }

    function generateElements(body: CelestialBody){
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
      // setTimeout(() => {
      //   similaritiesList.style.display = 'none';
      //   similaritiesListObjects.innerHTML = '';
      // }, 250);
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
    ambientLight = new AmbientLight('white', 0.4)
    pointLight = new PointLight('white', 20, 100)
    pointLight.position.set(-2, 2, 2)
    pointLight.castShadow = true
    pointLight.shadow.radius = 4
    pointLight.shadow.camera.near = 0.5
    pointLight.shadow.camera.far = 4000
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048
    scene.add(ambientLight)
    scene.add(pointLight)
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, renderSize * 8)
    camera.position.set(2, 2, 5)
  }

  // ===== 📦 OBJECTS =====
  {
    const planeGeometry = new PlaneGeometry(3, 3)
    const planeMaterial = new MeshLambertMaterial({
      color: 'gray',
      emissive: 'teal',
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4,
    })
    const plane = new Mesh(planeGeometry, planeMaterial)
    plane.rotateX(Math.PI / 2)
    plane.receiveShadow = true
    scene.add(plane)


    skybox = new Skybox(0,0,0, renderSize/2, camera);
    scene.add(...skybox.getMesh());

    celestialBodyList = CelestialBodyList.getInstance();

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
        new Date(Date.UTC(2000, 0, 3, 0, 0, 0)),
        0.01673163,
        102.93005885,
        -5.11260389,
        100.46457166,
        -0.00054346,
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
        true
    );

    scene.add(...celestialBodyList.getMeshes());
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new OrbitControls(camera, canvas)
    cameraControls.target = new Vector3(0, 0, 0)
    cameraControls.enableDamping = true
    cameraControls.autoRotate = false
    cameraControls.update()

    cameraControls.addEventListener('change', () => {
      skybox.update();
    })

    selectedBody.subscribe((body) => {
      goTo(cameraControls, body);
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

    const gridHelper = new GridHelper(20, 20, 'teal', 'darkgray')
    gridHelper.position.y = -0.01
    scene.add(gridHelper)
  }

  // ===== 📈 STATS & CLOCK =====
  {
    //clock = new Clock()
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
    gui.add({ resetGui }, 'resetGui').name('RESET')

    gui.close()
  }
}


function animate() {
  requestAnimationFrame(animate)

  stats.update()
  group.update();

  date = simulatedTime.getSimulatedTime(86400000);

   //cambiar
    date = simulatedTime.getSimulatedTime(500000);

    console.log(epoch);


    CelestialBodyList.getInstance().getCelestialBodies().forEach(celestialBody => {
      celestialBody.update(epoch, simSpeed);
      if(celestialBody.name == "Venus"){
        //console.log("Vector Venus: " + celestialBody.getPosition().toArray())
      }
    })
    updateTheDate();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()

   

  }

  cameraControls.update()
  renderer.render(scene, camera)
}

function updateTheDate() 
  { 
  if (simSpeed == 1) {
      epoch = new Date(Date.now());            // At maximum speed, increment calendar by a day for each clock-cycle.
  } else if (0 > simSpeed) {
      epoch.setDate(epoch.getDate() - simSpeed * 24 * 3600000)
  } else if (simSpeed == 0){
      epoch.setDate(Date.now());
  } else {  epoch.setTime(epoch.getTime() + simSpeed * 24 * 3600000) ; }  // 24 hours * milliseconds in an hour * simSpeed 
    
  //	 document.getElementById("modelDate").innerHTML = (epoch.getMonth() + 1) + "-" + epoch.getDate() + "-" + epoch.getFullYear() ;
  }

function goTo(cameraControls: OrbitControls, body: CelestialBody | null) {
  if (body === null) {
    return;
  }

  // Get the position of the celestial body and the camera's current position
  const target = body.getPosition();
  const currentTarget = cameraControls.target.clone();

  let movementTween;

  // Step 1: Smoothly move the cameraControls' target to the new position
  const lookTween = new Tween(currentTarget)
      .to(target, 1500) // Transition over 1 second
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => {
        // Update the camera's target position during the tween
        cameraControls.target.copy(currentTarget);
      })
      .onComplete(() => {
        cameraControls.target.copy(target);

        const cameraPosition = cameraControls.object.position.clone();
        const direction = new Vector3().subVectors(cameraPosition, target).normalize();

        const newCameraPosition = target.clone().add(direction.multiplyScalar(body.getRadius() * 8));

        movementTween = new Tween(cameraControls.object.position)
            .to(
                {
                  x: newCameraPosition.x,
                  y: newCameraPosition.y,
                  z: newCameraPosition.z,
                },
                1500
            )
            .easing(Easing.Quadratic.Out)
            .onUpdate(() => {
              cameraControls.update(); // Update the controls each frame
            })
            .start();
        group.add(movementTween);
      })
      .start();
  group.add(lookTween);
}
