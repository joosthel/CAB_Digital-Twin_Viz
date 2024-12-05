import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

// Controls
const DoorRaycast = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false;

window.addEventListener( 'pointermove', ( event ) => {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'pointerdown', () => {
	selectState = true;
} );

window.addEventListener( 'pointerup', () => {
	selectState = false;
} );

window.addEventListener( 'touchstart', ( event ) => {
	selectState = true;
	mouse.x = ( event.touches[ 0 ].clientX / window.innerWidth ) * 2 - 1;
	mouse.y = -( event.touches[ 0 ].clientY / window.innerHeight ) * 2 + 1;
} );

window.addEventListener( 'touchend', () => {
	selectState = false;
	mouse.x = null;
	mouse.y = null;
} );

//Create Button
doorPanel();

function doorPanel() {
    // Container to hold botton
    const container = new ThreeMeshUI.Block({
		justifyContent: 'center',
		contentDirection: 'row-reverse',
		fontSize: 0.07,
		padding: 0.02,
		borderRadius: 0.11
	});

    // Container Position
    container.position.set( 0, 0.6, -1.2 );
    container.rotation.x = -0.55;
    scene.add( container );

    // Options for button styling
    const buttonOptions = {
		width: 0.4,
		height: 0.15,
		justifyContent: 'center',
		offset: 0.05,
		margin: 0.02,
		borderRadius: 0.075
	};

	const hoveredStateAttributes = {
		state: 'hovered',
		attributes: {
			offset: 0.035,
			backgroundColor: new THREE.Color( 0x999999 ),
			backgroundOpacity: 1,
			fontColor: new THREE.Color( 0xffffff )
		},
	};

    const idleStateAttributes = {
		state: 'idle',
		attributes: {
			offset: 0.035,
			backgroundColor: new THREE.Color( 0x666666 ),
			backgroundOpacity: 0.3,
			fontColor: new THREE.Color( 0xffffff )
		},
	};

    // Add Button to container
	const buttonDoor = new ThreeMeshUI.Block( buttonOptions );
    buttonDoor.add(
		new ThreeMeshUI.Text( { content: 'Door' } )
	);

    // Apply styling to buttons
    const selectedAttributes = {
		offset: 0.02,
		backgroundColor: new THREE.Color( 0x777777 ),
		fontColor: new THREE.Color( 0x222222 )
	};

	buttonNext.setupState( {
		state: 'selected',
		attributes: selectedAttributes,
		onSet: () => {

			currentMesh = ( currentMesh + 1 ) % 3;
			showMesh( currentMesh );

		}
	} );
	buttonDoor.setupState( hoveredStateAttributes );
	buttonDoor.setupState( idleStateAttributes );

    container.add( buttonDoor);
	objsToTest.push( buttonDoor);
};

// Scene setup for buttons

// Loop to update buttons
function loop() {

	// Don't forget, ThreeMeshUI must be updated manually.
	// This has been introduced in version 3.0.0 in order
	// to improve performance
	ThreeMeshUI.update();

	controls.update();

	meshContainer.rotation.z += 0.01;
	meshContainer.rotation.y += 0.01;

	renderer.render( scene, camera );

	updateButtons();
}

// Function to update button states
function updateButtons() {

	// Find closest intersecting object

	let intersect;

	if ( renderer.xr.isPresenting ) {

		vrControl.setFromController( 0, DoorRaycast.ray );

		intersect = raycast();

		// Position the little white dot at the end of the controller pointing ray
		if ( intersect ) vrControl.setPointerAt( 0, intersect.point );

	} else if ( mouse.x !== null && mouse.y !== null ) {

		DoorRaycast.setFromCamera( mouse, camera );

		intersect = raycast();

	}

	// Update targeted button state (if any)

	if ( intersect && intersect.object.isUI ) {

		if ( selectState ) {

			// Component.setState internally call component.set with the options you defined in component.setupState
			intersect.object.setState( 'selected' );

		} else {

			// Component.setState internally call component.set with the options you defined in component.setupState
			intersect.object.setState( 'hovered' );

		}

	}

	// Update non-targeted buttons state

	objsToTest.forEach( ( obj ) => {

		if ( ( !intersect || obj !== intersect.object ) && obj.isUI ) {

			// Component.setState internally call component.set with the options you defined in component.setupState
			obj.setState( 'idle' );

		}

	} );

}

// Raycast function to find intersecting objects

function raycast() {

	return objsToTest.reduce( ( closestIntersection, obj ) => {

		const intersection = DoorRaycast.intersectObject( obj, true );

		if ( !intersection[ 0 ] ) return closestIntersection;

		if ( !closestIntersection || intersection[ 0 ].distance < closestIntersection.distance ) {

			intersection[ 0 ].object = obj;

			return intersection[ 0 ];

		}

		return closestIntersection;

	}, null );

}

//Exports
export default DoorOpen;

export { doorPanel };

export function updateButtonStates(intersectedObjects) {
    buttonDoor.setState('hovered');
    buttonDoor.setState('selected');
}

export { DoorRaycast };