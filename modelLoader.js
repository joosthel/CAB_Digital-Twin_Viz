import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class SceneModelLoader {
    constructor(scene, basePath = './src/') {
        this.scene = scene;
        this.loader = new GLTFLoader().setPath(basePath);
        this.models = [
            {
                path: '240911_CAB.glb',
                position: [-1.2, 0.045, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                //Specify Material config here
                materials: [{
                    name: 'EX_Glas',
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
                }]
            },
            // Add more models here as needed
        ];
        this.MaterialModifications = [];
    }

    // Method to add more models to the configuration
    addModel(modelConfig) {
        this.models.push(modelConfig);
        return this;
    }

    // Load all configured models
    loadModels() {
        this.models.forEach((modelData) => {
            this.loader.load(
                modelData.path, 
                (gltf) => {
                    const mesh = gltf.scene;

                    // Apply shadows and Material changes
                    mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            //Material Changes
                            if (modelData.materials) {
                                modelData.materials.forEach((materialConfig) => {
                                    if (child.material && child.material.name === materialConfig.name) {
                                        // Apply each specified property
                                        Object.keys(materialConfig.properties).forEach((prop) => {
                                            child.material[prop] = materialConfig.properties[prop];
                                        });
                                        child.material.needsUpdate = true;
                                    }
                                });
                            }
                            
                        }
                    });

                    // Set position
                    if (modelData.position) {
                        mesh.position.set(
                            modelData.position[0],
                            modelData.position[1],
                            modelData.position[2]
                        );
                    }

                    // Set scale
                    if (modelData.scale) {
                        mesh.scale.set(
                            modelData.scale[0],
                            modelData.scale[1],
                            modelData.scale[2]
                        );
                    }

                    // Set rotation
                    if (modelData.rotation) {
                        mesh.rotation.set(
                            modelData.rotation[0],
                            modelData.rotation[1],
                            modelData.rotation[2]
                        );
                    }

                    this.scene.add(mesh);
                },
                // Progress callback (optional)
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                // Error callback (optional)
                (error) => {
                    console.error('An error occurred while loading the model:', error);
                }
            );
        });

        return this;
    }
}

export default SceneModelLoader;