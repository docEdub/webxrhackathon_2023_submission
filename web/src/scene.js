/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
	DirectionalLight,
	HemisphereLight,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	sRGBEncoding,
} from 'three';

import { RealityAccelerator } from 'ratk';

export const setupScene = () => {
	const scene = new Scene();

	const camera = new PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.1,
		5000,
	);

	scene.add(new HemisphereLight(0x606060, 0x404040));

	const light = new DirectionalLight(0xffffff);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);

	const renderer = new WebGLRenderer({ antialias: true, alpha: true, multiviewStereo: true, });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputEncoding = sRGBEncoding;
	renderer.xr.enabled = true;
	// renderer.setClearAlpha(0);
	document.body.appendChild(renderer.domElement);

	window.addEventListener('resize', function () {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	});

	const ratk = new RealityAccelerator(renderer.xr);
	scene.add(ratk.root);

	return { scene, camera, renderer, ratk };
};
