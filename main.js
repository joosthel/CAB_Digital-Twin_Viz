// ThreeJS Functions
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import ThreeMeshUI from 'three-mesh-ui';

//Local imports
import SceneModelLoader from './modelLoader_v2.js';

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


// HDR Environment Map
let envmaploader = new THREE.PMREMGenerator(renderer);

new RGBELoader()
    .setPath('./src/')
    .load('urban_street_01_4k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = '#F0F0F0';
        scene.environment = texture;
});

// ======Visible Objects======

// Load 3D Models
const modelLoader = new SceneModelLoader(scene);
modelLoader.loadModels();

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

let mixer;

function onMouseDown(event) {
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY/ renderer.domElement.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(coords, camera);
    raycaster.layers.set(1); //Intersect only with Door

    const intersections = raycaster.intersectObjects(scene.children, true);
    //console.log(intersections[0]);

    if (intersections.length > 0 && intersections[0].object.isMesh) {
        const selectedObject = intersections[0].object;
        const parent = selectedObject.parent;
        const mixer = parent.userData.mixer;
        const animationClip = parent.userData.animationClip;
    
        if (mixer && animationClip) {
            const action = mixer.clipAction(animationClip);
            action.play();
            console.log(selectedObject);
        } else {
            console.error('Mixer or animation clip not found for:', selectedObject);
        }
    }
};

//Create Clock for animation timing
const clock = new THREE.Clock();

//Setup Animate Function to make everything visible
function animate() {
    requestAnimationFrame(animate);
    //Animation
    const delta = clock.getDelta();
    modelLoader.getMixers().forEach(mixer => mixer.update(delta));
    //Scene
    renderer.render(scene, camera);
    controls.update();
}

animate();