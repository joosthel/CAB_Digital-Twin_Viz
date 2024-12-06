// ThreeJS Functions
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import ThreeMeshUI from 'three-mesh-ui';

//Local imports
import SceneModelLoader from './modelLoader_v2.js';

// ====== ThreeJS Render Setup ======
//Setup Container
const container = document.getElementById('threejs-app');

// Setup Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setClearColor(0xF0F0F0);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(container.clientWidth, container.clientHeight);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping

container.appendChild(renderer.domElement);

// Resize Renderer to Fit Container
function resizeRendererToContainer() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

//Create Clock for animation timing
const clock = new THREE.Clock();


// ====== Scene Setup ======

//Setup Scene
const scene = new THREE.Scene();

//Setup Camera
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
camera.position.set (-4,2,-4);
camera.layers.enable(1); //Door
camera.layers.enable(2); //All Objects
camera.layers.enable(3); //Ground Plane

//Resize Camera to fit window
window.addEventListener('resize', resizeRendererToContainer);
resizeRendererToContainer();

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth movement
controls.dampingFactor = 0.05;
controls.target.set(0,0.8,0);
controls.maxPolarAngle = Math.PI / 2;
//controls.autoRotate = true;
//controls.autoRotateSpeed = 1;


// ====== Lighting Setup ======

// HDR Environment Map
let envmaploader = new THREE.PMREMGenerator(renderer);
new RGBELoader()
    .setPath('./src/')
    .load('urban_street_01_4k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = '#F0F0F0';
        scene.environment = texture;
});


// ====== Geometry ======

// Load 3D Models
const modelLoader = new SceneModelLoader(scene);
//modelLoader.loadModels();

// Test Geometry
    /*
    const ballGeo = new THREE.SphereGeometry(1.5, 64, 64);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMaterial);
    ballMesh.position.set(0, 1, 0);
    ballMesh.scale.set(1, 0.75, 1);
    ballMesh.layers.set(3);
    scene.add(ballMesh);
    */

// Create Ground Plane
const groundGeometry = new THREE.PlaneGeometry(25, 25, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xA0A0A0,
    side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
groundMesh.layers.set(3);
scene.add(groundMesh);


// ====== Interactive UI ======
const raycaster = new THREE.Raycaster();
document.addEventListener('mousedown', onMouseDown);

// Door State Management
const DOOR_STATES = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    OPENING: 'OPENING',
    CLOSING: 'CLOSING'
};

// Door Animation configuration for opening and closing
const ANIMATION_CONFIG = {
    DURATION: 3000, // milliseconds
    FORWARD_SCALE: 1,
    REVERSE_SCALE: -0.25
};

// Handler for door animation with state management
function handleDoorAnimation(rootObject, mixer, animationClip) {
    if (isAnimating(rootObject)) {
        console.log('Door is busy:', getDoorState(rootObject));
        return;
    }

    const action = setupAnimationAction(mixer, animationClip);
    const currentState = getDoorState(rootObject) || DOOR_STATES.CLOSED;
    
    if (currentState === DOOR_STATES.CLOSED) {
        openDoor(rootObject, action);
    } else if (currentState === DOOR_STATES.OPEN) {
        closeDoor(rootObject, action);
    }
}

// Setup Animation with default settings
function setupAnimationAction(mixer, clip) {
    const action = mixer.clipAction(clip);
    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce);
    return action;
}

//Inititate opening animation
function openDoor(rootObject, action) {
    console.log('Opening door...');
    setDoorState(rootObject, DOOR_STATES.OPENING);
    action.reset();
    action.time = 0;
    action.timeScale = ANIMATION_CONFIG.FORWARD_SCALE;
    action.play();
    
    setTimeout(() => {
        setDoorState(rootObject, DOOR_STATES.OPEN);
        console.log('Door is now open');
    }, ANIMATION_CONFIG.DURATION);
}

// Initiate closing animation
function closeDoor(rootObject, action) {
    console.log('Closing door...');
    setDoorState(rootObject, DOOR_STATES.CLOSING);
    action.reset();
    action.time = action._clip.duration;
    action.timeScale = ANIMATION_CONFIG.REVERSE_SCALE;
    action.play();
    
    setTimeout(() => {
        setDoorState(rootObject, DOOR_STATES.CLOSED);
        console.log('Door is now closed');
    }, ANIMATION_CONFIG.DURATION);
}

// State Management Helpers
function getDoorState(object) {
    return object.userData.doorState;
}

function setDoorState(object, state) {
    object.userData.doorState = state;
}

function isAnimating(object) {
    const state = getDoorState(object);
    return state === DOOR_STATES.OPENING || state === DOOR_STATES.CLOSING;
}

//  Event handler
function onMouseDown(event) {
    // Mouse position to normalized device coordinates
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(coords, camera);
    raycaster.layers.set(1); //Only detect objects on layer 1 (door)

    const intersections = raycaster.intersectObjects(scene.children, true);

    if (intersections.length > 0 && intersections[0].object.isMesh) {
        const selectedObject = intersections[0].object;
        // Find the root object with animation data 
        let rootObject = selectedObject;
        while (rootObject.parent && !rootObject.userData.mixer) {
            rootObject = rootObject.parent;
        }
        
        const mixer = rootObject.userData.mixer;
        const animationClip = rootObject.userData.animationClip;
    
        if (mixer && animationClip) {
            handleDoorAnimation(rootObject, mixer, animationClip);
        }
    }
}

//Animation Loop; updates all animations and handles state changes
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    modelLoader.getMixers().forEach(mixer => {
        mixer.update(delta);
        mixer.getRoot().traverse(obj => {
            if (getDoorState(obj) === DOOR_STATES.CLOSING) {
                const action = mixer.clipAction(obj.userData.animationClip);
                action.time -= delta;
                if (action.time <= 0) {
                    action.paused = true;
                }
            }
        });
    });
    renderer.render(scene, camera);
    controls.update();
}

animate();