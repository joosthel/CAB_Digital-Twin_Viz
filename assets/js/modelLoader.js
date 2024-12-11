import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class SceneModelLoader {
    constructor(scene, basePath = '../assets/models/') {
        this.scene = scene;
        this.loader = new GLTFLoader().setPath(basePath);
        this.mixers = [];
        this.MaterialModifications = [];
        this.DoorAction = null;
        this.models = [
            {
                path: '241126_CAB_Exterior.gltf',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [{
                    name: 'EX_Window',
                    properties: {
                        transparent: true,
                        opacity: 0.3,
                        roughness: 0.1
                    }
                },
                {   
                    name: 'Glas_Matrix',
                    properties: {
                        transparent: true,
                        opacity: 0.3,
                        roughness: 0.1
                    }
                }],
                animations: {
                    play: true,
                    loop: THREE.LoopRepeat,
                    speed: 1.0,
                }
            },
            {
                path: '241126_CAB_Interior-S.gltf',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [{
                    name: 'EX_Window',
                    properties: {
                        transparent: true,
                        opacity: 0.3,
                        roughness: 0.1
                    }
                },
                {   
                    name: 'Glas_Matrix',
                    properties: {
                        transparent: true,
                        opacity: 0.3,
                        roughness: 0.1
                    }
                }],
                animations: {
                    play: true,
                    loop: THREE.LoopRepeat,
                    speed: 1.0,
                }
            },
            {
                path: '241126_CAB_Tires_Back.gltf',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [],
                animations: {
                    play: true,
                    loop: THREE.LoopRepeat,
                    speed: 1.0,
                }
            },
            {
                path: '241126_CAB_Tires_FL.gltf',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [],
                animations: {
                    play: true,
                    loop: THREE.LoopRepeat,
                    speed: 1.0,
                }
            },
            {
                path: '241126_CAB_Tires_FR.gltf',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [],
                animations: {
                    play: true,
                    loop: THREE.LoopRepeat,
                    speed: 1.0,
                }
            },
            {
                path: '241202_CAB_Door.gltf',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [{
                    name: 'EX_Window',
                    properties: {
                        transparent: true,
                        opacity: 0.3,
                        roughness: 0.1
                    }
                }],
                animations: {
                    play: false,
                    loop: THREE.LoopRepeat,
                    speed: 0.5,
                }
            },
            // Add more models here as needed
        ];
    }

    // Method to add more models to the configuration
    addModel(modelConfig) {
        this.models.push(modelConfig);
        return this;
    }

    loadModels() {
        this.models.forEach((modelData) => {
            this.loader.load(
                modelData.path,
                (gltf) => {
                    const mesh = gltf.scene;
                    
                    // Set position, scale, and rotation
                    if (modelData.position) mesh.position.set(...modelData.position);
                    if (modelData.scale) mesh.scale.set(...modelData.scale);
                    if (modelData.rotation) mesh.rotation.set(...modelData.rotation);

                    // Apply shadows and material changes
                    mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
    
                            if (modelData.materials) {
                                modelData.materials.forEach((materialConfig) => {
                                    if (child.material && child.material.name === materialConfig.name) {
                                        Object.keys(materialConfig.properties).forEach((prop) => {
                                            child.material[prop] = materialConfig.properties[prop];
                                        });
                                        child.material.needsUpdate = true;
                                    }
                                });
                            }
                        }
                    });

                    // Add animation playback if animations exist
                    if (gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(mesh);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.loop = modelData.animations.loop || THREE.LoopRepeat;
                    action.timeScale = modelData.animations.speed || 1.0;
                    if (modelData.animations.play) action.play();

                    this.mixers.push(mixer); // Store mixer for update in the animation loop
                }
    
                    this.scene.add(mesh);
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
                },
                (error) => {
                    console.error('An error occurred while loading the model:', error);
                }
            );
        });
    
        return this;
    }
    
    }

export default SceneModelLoader;