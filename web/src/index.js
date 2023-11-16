import './styles/index.css';

import { Amplify } from 'aws-amplify';
import amplifyConfig from './amplifyconfigure';
import { fetchAllPreSignedUrls } from './fetchurl';
import { AudioEngine } from './audio';
import { startCreatingAnnotationObject } from './annotation_object_creation';
import { loadAnnotationObjects } from './load_annotation_objects';

import { ARButton, RealityAccelerator } from 'ratk';
import {
	BoxGeometry,
	BufferGeometry,
	DirectionalLight,
	Group,
	HemisphereLight,
	Line,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	SphereGeometry,
	Vector3,
	WebGLRenderer,
	// DoubleSide,
	CylinderGeometry,
	// ConeGeometry
} from 'three';

import { Text } from 'troika-three-text';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

Amplify.configure(amplifyConfig);

// Global variables for scene components

let camera, scene, renderer, controller, uiGroup;
let ratk; // Instance of Reality Accelerator
let pendingAnchorData = null;
let primaryAnchor = null;

// Initialize and animate the scene
init();
animate();

/**
 * Initializes the scene, camera, renderer, lighting, and AR functionalities.
 */
function init() {
	scene = new Scene();
	setupCamera();
	setupAudioEngine();
	setupLighting();
	setupRenderer();
	setupARButton();
	setupController(0);
	setupController(1);
	window.addEventListener('resize', onWindowResize);
	setupRATK();
	setupScene();
	setupMenu();
}

/**
 * Creates black sky sphere to block out AR camera
 */
function setupScene() {
	// const geometry = new SphereGeometry(150);
	// const material = new MeshBasicMaterial({color: 0x000000, side: DoubleSide});
	// const skySphere = new Mesh(geometry, material);
	// scene.add(skySphere)
	// this.hitTestTarget.add(hitTestMarker);
}

/**
 * Creates a "lower third" menu similar to Quest OS toolbar.
 * The toolbar consists of a thin, semitransparent box (similar to plane)
 * On the toolbar are 4 different shapes each in a different color - box, sphere, cylinder, cone
 * The toolbar should always be visible to the user regardless fo their location
 * Therefore the toolbar "follows" the user camera around, or it could be set as a child of the user camera
 */
function setupMenu() {
    // Create the toolbar as a thin, semitransparent box
    const toolbarGeometry = new BoxGeometry(1, 0.1, 0.01); // Adjust size as needed
    const toolbarMaterial = new MeshBasicMaterial({
        color: 0xaaaaaa, // Grey color
        transparent: true,
        opacity: 0.5
    });

	uiGroup = new Group();
	scene.add(uiGroup);

    const toolbar = new Mesh(toolbarGeometry, toolbarMaterial);
	uiGroup.add(toolbar);

    // Add toolbar as a child of the camera so it always follows the user
    toolbar.position.set(0, -1, -2); // Adjust position relative to camera

    // Define shapes with their respective geometries and colors
    const shapes = [
        { geometry: BoxGeometry, color: 0xff0000 }, // red box
        { geometry: SphereGeometry, color: 0x00ff00 }, // green sphere
        { geometry: CylinderGeometry, color: 0x0000ff }, // blue cylinder
        // { geometry: ConeGeometry, color: 0xffff00 } // yellow cone
    ];

    // Create the shapes and add them to the toolbar
    shapes.forEach((shape, index) => {
		let geometry;
		if (shape.geometry == SphereGeometry) {
			geometry = new shape.geometry(0.1); // Adjust size as needed
		} else {
			geometry = new shape.geometry(0.1, 0.1, 0.1); // Adjust size as needed
		}
        const material = new MeshBasicMaterial({ color: shape.color });
        const mesh = new Mesh(geometry, material);

        // Position each shape on the toolbar
        mesh.position.x = -0.35 + index * 0.2; // This positions shapes with equal spacing
        toolbar.add(mesh);
    });
}

/**
 * Sets up the audio engine. Must be done after the camera is setup.
 */
function setupAudioEngine() {
	window.audioEngine = new AudioEngine(camera);
}

/**
 * Sets up the camera for the scene.
 */
function setupCamera() {
	camera = new PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		200,
	);
	camera.position.set(0, 1.6, 3);
}

/**
 * Sets up the lighting for the scene.
 */
function setupLighting() {
	scene.add(new HemisphereLight(0x606060, 0x404040));
	const light = new DirectionalLight(0xffffff);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);
}

/**
 * Sets up the renderer for the scene.
 */
function setupRenderer() {
	renderer = new WebGLRenderer({
		alpha: true,
		antialias: true,
		multiviewStereo: true,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.xr.enabled = true;
	document.body.appendChild(renderer.domElement);
}

/**
 * Sets up the AR button and web launch functionality.
 */
function setupARButton() {
	const arButton = document.getElementById('ar-button');
	const webLaunchButton = document.getElementById('web-launch-button');
	webLaunchButton.onclick = () => {
		window.open(
			'https://www.oculus.com/open_url/?url=' +
				encodeURIComponent(window.location.href),
		);
	};

	ARButton.convertToARButton(arButton, renderer, {
		requiredFeatures: [
			'anchors',
			'plane-detection',
			'hit-test',
			'mesh-detection',
			'local-floor',
		],
		onUnsupported: () => {
			arButton.style.display = 'none';
			webLaunchButton.style.display = 'block';
		},
	});
}

/**
 * Sets up the XR controller and its event listeners.
 */
function setupController(controllerIndex) {
	controller = renderer.xr.getController(controllerIndex);
	controller.addEventListener('connected', handleControllerConnected);
	controller.addEventListener('disconnected', handleControllerDisconnected);
	controller.addEventListener('selectstart', handleSelectStart);
	controller.addEventListener('squeezestart', handleSqueezeStart);
	scene.add(controller);

	const controllerModelFactory = new XRControllerModelFactory();
	const controllerGrip = renderer.xr.getControllerGrip(0);
	controllerGrip.add(
		controllerModelFactory.createControllerModel(controllerGrip),
	);
	scene.add(controllerGrip);

	const geometry = new BufferGeometry().setFromPoints([
		new Vector3(0, 0, 0),
		new Vector3(0, 0, -1),
	]);
	const line = new Line(geometry);
	renderer.xr.getController(controllerIndex).add(line);
}

/**
 * Handles controller connection events.
 */
function handleControllerConnected(event) {
	ratk
		.createHitTestTargetFromControllerSpace(event.data.handedness)
		.then((hitTestTarget) => {
			this.hitTestTarget = hitTestTarget;
			const geometry = new SphereGeometry(0.05);
			const material = new MeshBasicMaterial({
				transparent: true,
				opacity: 0.5,
			});
			const hitTestMarker = new Mesh(geometry, material);
			this.hitTestTarget.add(hitTestMarker);
		});
}

/**
 * Handles controller disconnection events.
 */
function handleControllerDisconnected() {
	ratk.deleteHitTestTarget(this.hitTestTarget);
	this.hitTestTarget = null;
}

/**
 * Handles 'selectstart' event for the controller.
 */
function handleSelectStart() {
	startCreatingAnnotationObject(scene, primaryAnchor, this.hitTestTarget);
}

/**
 * Handles 'squeezestart' event for the controller.
 */
function handleSqueezeStart() {
	// delete old anchors
	ratk.anchors.forEach((anchor) => {
		console.log(anchor.anchorID);
		ratk.deleteAnchor(anchor);
	});

	// Clone the camera position and set y-coordinate to 0
	const positionClone = camera.position.clone();
	positionClone.y = 0;

	pendingAnchorData = {
		position: positionClone,
		quaternion: camera.quaternion.clone(),
	};
}

/**
 * Sets up the Reality Accelerator instance and its event handlers.
 */
function setupRATK() {
	ratk = new RealityAccelerator(renderer.xr);
	ratk.onPlaneAdded = handlePlaneAdded;
	ratk.onMeshAdded = handleMeshAdded;
	scene.add(ratk.root);
	renderer.xr.addEventListener('sessionstart', () => {
		setTimeout(() => {
			ratk.restorePersistentAnchors().then(() => {
				console.log("restored persistent anchors: ", ratk.anchors)
				ratk.anchors.forEach((anchor) => {
					primaryAnchor = anchor;
					buildAnchorMarker(anchor, true);
					loadAnnotationObjects(scene, primaryAnchor);
				});
			});
		}, 1000);
		// setTimeout(() => {
		// 	if (ratk.planes.size == 0) {
		// 		renderer.xr.getSession().initiateRoomCapture();
		// 	}
		// }, 5000);
	});
}

/**
 * Handles the addition of a new plane detected by RATK.
 */
function handlePlaneAdded(plane) {
	const mesh = plane.planeMesh;
	mesh.material = new MeshBasicMaterial({
		wireframe: true,
		color: Math.random() * 0xffffff,
	});
}

/**
 * Handles the addition of a new mesh detected by RATK.
 */
function handleMeshAdded(mesh) {
	const meshMesh = mesh.meshMesh;
	meshMesh.material = new MeshBasicMaterial({
		wireframe: true,
		color: Math.random() * 0xffffff,
	});
	meshMesh.geometry.computeBoundingBox();
	const semanticLabel = new Text();
	meshMesh.add(semanticLabel);
	semanticLabel.text = mesh.semanticLabel;
	semanticLabel.anchorX = 'center';
	semanticLabel.anchorY = 'bottom';
	semanticLabel.fontSize = 0.1;
	semanticLabel.color = 0x000000;
	semanticLabel.sync();
	semanticLabel.position.y = meshMesh.geometry.boundingBox.max.y;
	mesh.userData.semanticLabelMesh = semanticLabel;
}

/**
 * Handles window resize events.
 */
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Animation loop for the scene.
 */
function animate() {
	renderer.setAnimationLoop(render);
}

/**
 * Updates UI to keep it in front of the camera. Call from render loop.
 */
function updateUi() {
	const xrManager = renderer.xr;
	const session = xrManager.getSession();
	if (!session) {
		return;
	}

	// get camera pose from xrManager
	const referenceSpace = xrManager.getReferenceSpace();
	const frame = xrManager.getFrame();
	const pose = frame.getViewerPose(referenceSpace);
	if (pose) {
		const headsetMatrix = new Matrix4().fromArray(
			pose.views[0].transform.matrix,
		);
		headsetMatrix.decompose(
			uiGroup.position,
			uiGroup.quaternion,
			uiGroup.scale,
		);
	}
}

/**
 * Render loop for the scene, updating AR functionalities.
 */
function render() {
	handlePendingAnchors();
	ratk.update();
	updateSemanticLabels();
	updateUi();
	renderer.render(scene, camera);
}

/**
 * Handles the creation of anchors based on pending data.
 */
function handlePendingAnchors() {
	if (pendingAnchorData) {
		ratk
			.createAnchor(
				pendingAnchorData.position,
				pendingAnchorData.quaternion,
				true,
			)
			.then((anchor) => {
				primaryAnchor = anchor;
				console.log("primary anchor: ", primaryAnchor);

				buildAnchorMarker(anchor, false);
				loadAnnotationObjects(scene, primaryAnchor);
			});
		pendingAnchorData = null;
	}
}

function buildAnchorMarker(anchor, isRecovered) {
	const geometry = new BoxGeometry(0.05, 0.05, 0.05);
	const material = new MeshBasicMaterial({
		color: isRecovered ? 0xff0000 : 0x00ff00,
	});
	const cube = new Mesh(geometry, material);
	anchor.add(cube);
	scene.add(anchor);
	console.log(
		`anchor created (id: ${anchor.anchorID}, isPersistent: ${anchor.isPersistent}, isRecovered: ${isRecovered})`,
	);
}

/**
 * Updates semantic labels for each mesh.
 */
function updateSemanticLabels() {
	ratk.meshes.forEach((mesh) => {
		const semanticLabel = mesh.userData.semanticLabelMesh;
		if (semanticLabel) {
			semanticLabel.lookAt(camera.position);
		}
	});
}

export async function fetchAllAudioFiles() {
    try {
        // Common asset key name
        const assetKey = 'sound.webm';

        // Fetch the pre-signed URLs for the audio files
        const preSignedUrls = await fetchAllPreSignedUrls(assetKey);

        console.log(preSignedUrls);

        return preSignedUrls;

    } catch (error) {
        console.error('Failed to fetch audio files:', error);
    }
}
