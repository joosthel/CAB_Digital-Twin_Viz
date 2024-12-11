import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Define model paths
const modelPaths = [
    '241126_CAB_Exterior.gltf',
    '241126_CAB_Interior-S.gltf',
    '241126_CAB_Tires_Back.gltf',
    '241126_CAB_Tires_FL.gltf',
    '241126_CAB_Tires_FR.gltf',
    '241206_CAB_Door.gltf',
    '241210_CAB_Rolling-Chassis.gltf',
    '241206_CAB_Light-Door.gltf',
    // Add more model paths as needed
];

// Define common model properties
const commonModelProperties = {
    position: [-1.2, 0.045, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    animations: {
        play: true,
        loop: THREE.LoopRepeat,
        speed: 1.0,
    }
};

// Define specific material properties
const materialProperties = [
    {
        name: 'EX_Window',
        properties: {
            type: 'MeshPhysicalMaterial',
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.9,
            envMapIntensity: 2,
            side: THREE.DoubleSide
        }
    },
    {
        name: 'Glas_Matrix',
        properties: {
            type: 'MeshPhysicalMaterial',
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.5,
            envMapIntensity: 2,
            side: THREE.DoubleSide
        }
    },
    {
        name: 'M_Light_Door',
        properties: {
            type: 'MeshPhysicalMaterial',
            emissive: new THREE.Color(0xff0000),
            emissiveIntensity: 100,
            roughness: 1,
            metalness: 0,
        }
    },
    {
        name: 'EX_Lack_Seite',
        properties: {
            type: 'MeshPhysicalMaterial',
            transparent: false,
            roughness: 0.1,
            metalness: 0.8,
            envMapIntensity: 2,
            side: THREE.DoubleSide
        }
    },
    {
        name: 'EX_Lack_Front',
        properties: {
            type: 'MeshPhysicalMaterial',
            transparent: false,
            roughness: 0.1,
            metalness: 0.8,
            envMapIntensity: 2,
            side: THREE.DoubleSide
        }
    },
    {
        name: 'Radkappen',
        properties: {
            type: 'MeshPhysicalMaterial',
            transparent: false,
            roughness: 0.8,
            metalness: 1,
            envMapIntensity: 2,
            side: THREE.DoubleSide
        }
    },
];

class SceneModelLoader {
    constructor(scene, basePath = './assets/models/') {
        this.scene = scene;
        this.loader = new GLTFLoader().setPath(basePath);
        this.mixers = [];
        this.models = this.createModels();
        this.loadModels();
    }

    createModels() {
        return modelPaths.map(path => ({
            path,
            ...commonModelProperties,
            materials: materialProperties
        }));
    }

    loadModels() {
        this.models.forEach(model => {
            this.loader.load(model.path, gltf => {
                const object = gltf.scene;
                this.setPosition(object, model.position);
                this.setScale(object, model.scale);
                this.setRotation(object, model.rotation);
                this.applyMaterials(object, model.materials);
                
                // Set the layer based on the model file name
                const layer = model.path === '241206_CAB_Door.gltf' ? 1 : 2;
                object.traverse(child => {
                    if (child.isMesh) {
                        child.layers.set(layer);
                    }
                });

                // Create mixer for the scene, not the model
                const mixer = new THREE.AnimationMixer(object);
                // Store mixer and animation clip in the object's userData
                object.userData.mixer = mixer;
                if (gltf.animations.length > 0) {
                    object.userData.animationClip = gltf.animations[0];
                }

                this.mixers.push(mixer);
                this.scene.add(object);
            });
        });
    }

    getMixers() {
        return this.mixers;
    }

    setPosition(object, position) {
        object.position.set(...position);
    }

    setScale(object, scale) {
        object.scale.set(...scale);
    }

    setRotation(object, rotation) {
        object.rotation.set(...rotation);
    }

    applyMaterials(object, materials) {
        materials.forEach(materialConfig => {
            object.traverse(child => {
                if (child.isMesh && child.material.name === materialConfig.name) {                    
                    // Always create new MeshStandardMaterial
                    const standardMaterial = new THREE.MeshStandardMaterial({
                        name: materialConfig.name,
                        color: child.material.color || 0xffffff,
                        map: child.material.map || null,
                        normalMap: child.material.normalMap || null,
                        side: THREE.DoubleSide,
                        ...materialConfig.properties
                    });
                    
                    // Enable shadows
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Assign new material
                    child.material = standardMaterial;
                    
                    console.log('Applied material and shadows to:', child.name);
                }
            });
        });
    }

    setupAnimations(gltf, animationsConfig) {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            action.setLoop(animationsConfig.loop);
            action.play();
            action.timeScale = animationsConfig.speed;
        });
        this.mixers.push(mixer);
        gltf.scene.userData.mixer = mixer;
    }

    playAnimation(name) {
        if (this.animations[name]) {
            const { mixer, action } = this.animations[name];
            action.reset();
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
        }
    }

    changeMaterialProperty(name, property, value) {
        this.models.forEach(model => {
            model.materials.forEach(materialConfig => {
                if (materialConfig.name === name) {
                    materialConfig.properties[property] = value;
                }
            });
        });
    }

    rotateGeometry(name, rotation) {
        // Implement rotate geometry by name
    }

    exportGeometry() {
        // Implement export geometry
    }
}

export default SceneModelLoader;