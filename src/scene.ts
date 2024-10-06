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
        0.1,
        5.972e24,
        "/earthMap.png",
        1,
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 0),
        null,
        1.00000018,
        new Date(Date.UTC(2000, 0, 3, 0, 0, 0)),
        0.01673163,
        102.93005885,
        -5.11260389,
        -0.00054346,
        100.46457166,
        true
    )

    /*
    let pelota = new CelestialBody(
        "Pelota",
        0.5,
        1,
        '/blanco.png',
        1,
        new Vector3(1, 1, 1),
        new Vector3(0, 0, 0),
        earth,
        1,
        new Date(Date.UTC(2000, 0, 3, 0, 0, 0)),
        true
    )
    */

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

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()
    //cambiar
    date = simulatedTime.getSimulatedTime(3);

    console.log(date);


    CelestialBodyList.getInstance().getCelestialBodies().forEach(celestialBody => {
      celestialBody.update(date);
    })
  }

  cameraControls.update()
  renderer.render(scene, camera)
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
