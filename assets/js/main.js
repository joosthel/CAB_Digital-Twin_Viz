// ThreeJS Functions
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import ThreeMeshUI from 'three-mesh-ui';

//Local imports
import SceneModelLoader from '../js/modelLoader_v2.js';

// ====== ThreeJS Render Setup ======
//Setup Container
const container = document.getElementById('threejs-app');

// Setup Renderer
// Set up WebGPU Renderer
let renderer;

async function initRenderer() {
    console.log('Using WebGL renderer');
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });
    
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xF0F0F0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    container.appendChild(renderer.domElement);
}

// Initialize Start
async function init() {
    await initRenderer();
}

// Debug Renderer
init().catch(console.error);

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
    .setPath('./assets/models/')
    .load('urban_street_01_4k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = '#F0F0F0';
        scene.environment = texture;
});

// Directional Light
const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dirLight.position.set(2, 5, 2);
dirLight.castShadow = true;
scene.add(dirLight);

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(ambientLight);


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
export const DOOR_STATES = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    OPENING: 'OPENING',
    CLOSING: 'CLOSING'
};

export const DOOR_LIGHTS = {
    L_OPENING: {
        color: new THREE.Color(0x00ff00), // Green
        intensity: 100
    },
    L_CLOSING: {
        color: new THREE.Color(0xff0000), // Red
        intensity: 100
    },
    L_INACTIVE: {
        color: new THREE.Color(0x000000), // Off
        intensity: 0
    }
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
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(coords, camera);
    raycaster.layers.set(1);

    const intersections = raycaster.intersectObjects(scene.children, true);

    if (intersections.length > 0 && intersections[0].object.isMesh) {
        // Find the door object directly in the scene
        let doorObject = null;
        scene.traverse((object) => {
            // Look for the object loaded from CAB_Door.gltf
            if (object.userData.mixer && object.userData.animationClip) {
                doorObject = object;
            }
        });

        if (doorObject) {
            handleDoorAnimation(doorObject, doorObject.userData.mixer, doorObject.userData.animationClip);
        }
    }
}

// Update Door Light Material Helper
function updateDoorLightMat(color, intensity) {
    // Array of object names to update
    const objectNames = ["Door_Button_1", "Lichtstreifen"];
    
    objectNames.forEach(name => {
        const mesh = scene.getObjectByName(name);

        if (mesh) {
            mesh.traverse((child) => {
                if (child.isMesh) {
                    // If material is an array
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat, index) => {
                            if (mat.name === "M_Light_Door") {
                                mat.emissive.setHex(color);
                                mat.emissiveIntensity = intensity;
                                mat.needsUpdate = true;
                            }
                        });
                    } 
                    // If single material
                    else if (child.material?.name === "M_Light_Door") {
                        child.material.emissive.setHex(color);
                        child.material.emissiveIntensity = intensity;
                        child.material.needsUpdate = true;
                    }
                }
            });
        }
    });
}

let lightTimer = 0;
let blinkIntervall = 15;

//Animation Loop; updates all animations and handles state changes
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    modelLoader.getMixers().forEach(mixer => {
        mixer.update(delta);
        mixer.getRoot().traverse(obj => {
            if (getDoorState(obj)) {
                const doorState = getDoorState(obj);
                
                if (doorState === DOOR_STATES.OPENING) {
                    //console.log('Door is opening...');
                    lightTimer += delta; // Add time from animation loop
                    if (Math.sin(lightTimer * blinkIntervall) > 0) { // Adjust 5 to control blink speed
                        updateDoorLightMat(0x00FF00, 1); // Bright green
                    } else {
                        updateDoorLightMat(0x00FF00, 0.2); // Dim green
                    }
                }
                if (doorState === DOOR_STATES.OPEN) {
                    //console.log('Door is open...');
                    updateDoorLightMat(0xFFFFFF, 1); // White
                    lightTimer = 0; // Reset timer
                }
                if (doorState === DOOR_STATES.CLOSING) {
                    //console.log('Door is closing...');
                    lightTimer += delta;
                    if (Math.sin(lightTimer * blinkIntervall) > 0) {
                        updateDoorLightMat(0xFF0000, 1); // Bright red
                    } else {
                        updateDoorLightMat(0xFF0000, 0.2); // Dim red
                    }
                }
                if (doorState === DOOR_STATES.CLOSED) {
                    //console.log('Door is close...');
                    updateDoorLightMat(0xAAAAAA, 1); // Gray
                    lightTimer = 0; // Reset timer
                }
            }

            if (getDoorState(obj) === DOOR_STATES.CLOSING) {
                const action = mixer.clipAction(obj.userData.animationClip);
                action.time -= delta;
                if (action.time <= 0) {
                    action.paused = true;
                }
            }
            if (getDoorState(obj) === DOOR_STATES.OPENING) {
                const action = mixer.clipAction(obj.userData.animationClip);
            }
        });
    });
    renderer.render(scene, camera);
    controls.update();
}

animate();