import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

container.appendChild(renderer.domElement);

//Setup Scene
const scene = new THREE.Scene();

//Setup Camera
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set (5,5,10);
camera.lookAt(0,0,0);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth movement
controls.dampingFactor = 0.05;

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

//Create Light
const areaLight = new THREE.RectAreaLight(0xFFFFFF, 2.5, 5, 5);
areaLight.position.set(0,5,0);
areaLight.lookAt(0,0,0);
areaLight.castShadow = true;
scene.add(areaLight);

//Setup Test Geo (Cube)
//const geometry = new THREE.BoxGeometry();
//const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//const cube = new THREE.Mesh(geometry, material);
//scene.add(cube);

//Load GLTF model
const loader = new GLTFLoader().setPath('./src/');
loader.load('240911_CAB.glb', (gltf) => {
    const mesh = gltf.scene;

    mesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    mesh.position.set(0,0.05,0);
    scene.add(mesh);
})

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

//Setup Animate Function to make everything visible
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}

animate();