import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

//Import Model Selection
import {getFirstObjectWithName} from './ObjectSelection.js';
import {getFirstCameraInScene, updateCameraAspect} from './ObjectSelection.js';

//Import Model Loader
import SceneModelLoader from './modelLoader.js';

//Setup Container
const container = document.getElementById('threejs-app');

// Setup Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;

// renderer.setSize(window.innerWidth, window.innerHeight); //Not needed in Container setup
renderer.setClearColor(0xF0F0F0);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(container.clientWidth, container.clientHeight);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping

container.appendChild(renderer.domElement);

//Setup Scene
const scene = new THREE.Scene();

//Setup Camera
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
camera.position.set (-4,2,-4);
//camera.lookAt(0,10,0);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth movement
controls.dampingFactor = 0.05;
//controls.autoRotate = true;
//controls.autoRotateSpeed = 1;
controls.target.set(0,0.8,0);

// HDR Environment Map
let envmaploader = new THREE.PMREMGenerator(renderer);

new RGBELoader()
    .setPath('./src/')
    .load('urban_street_01_4k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
});

// Create Ground Plane
const groundGeometry = new THREE.PlaneGeometry(25, 25, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xFAFAFA,
    side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

//Create Lights
//Fill Light
const fillLight = new THREE.PointLight(0xFFFFFF, 5, 20, 100);
fillLight.position.set(2,4,2);
fillLight.lookAt(0,0.75,0);
fillLight.castShadow = true;
scene.add(fillLight);
//Key Light
const keyLight = new THREE.PointLight(0xFFFFFF, 10, 20, 100);
keyLight.position.set(0,3,-4);
keyLight.lookAt(0,0.75,0);
keyLight.castShadow = true;
scene.add(keyLight);
//Back Light
const backLight = new THREE.PointLight(0xFFFFFF, 20, 100);
backLight.position.set(4,5,4);
backLight.lookAt(0,0.75,0);
backLight.castShadow = true;
scene.add(backLight);

//Setup Test Geo (Cube)
//const geometry = new THREE.BoxGeometry();
//const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//const cube = new THREE.Mesh(geometry, material);
//scene.add(cube);

// Load 3D Models
const modelLoader = new SceneModelLoader(scene);
modelLoader.loadModels();

// Resize Renderer to Fit Container
function resizeRendererToContainer() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeRendererToContainer);
resizeRendererToContainer();

//Create Clock for animation timing
const clock = new THREE.Clock();

//Start Animation when Object is clicked
document.addEventListener('click', onClick);
function onClick(event) {
    //Play Animation called "Door_open" from imported objects.
}

//Setup Animate Function to make everything visible
function animate() {
    requestAnimationFrame(animate);
    //Animation
    const delta = clock.getDelta();
    modelLoader.mixers.forEach((mixer) => mixer.update(delta));
    //Scene
    renderer.render(scene, camera);
    controls.update();
}

animate();