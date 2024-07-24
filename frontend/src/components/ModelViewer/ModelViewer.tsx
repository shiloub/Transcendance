import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const ModelViewer: React.FC = () => {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
			if (containerRef.current) {
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
			const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
			const loader = new GLTFLoader();

			renderer.setSize(window.innerWidth, window.innerHeight);
			containerRef.current.appendChild(renderer.domElement);

			loader.load(
					'3Dmodels/ping_pong_racket/scene.gltf',
					(gltf) => {
					scene.add(gltf.scene);
					},
					undefined,
					(error) => console.error(error)
					);

			camera.position.set(1, 0, 3.5);
			scene.scale.set(0.1, 0.1, 0.1);

			scene.rotation.x = 0.4;
			scene.rotation.z = 0.2;
			camera.position.y += 0.4;
			camera.position.x -= 0.8;



			const ambientLight = new THREE.AmbientLight(0xcccccc, 2);
			scene.add(ambientLight);

			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
			directionalLight.position.set(0, 1, 1);
			scene.add(directionalLight);

			const animate = () => {
				requestAnimationFrame(animate);
				scene.rotation.y += 0.003;
				renderer.render(scene, camera);
			};

			animate();

			// Resize handler
			const handleResize = () => {
				const width = window.innerWidth;
				const height = window.innerHeight;

				camera.aspect = width / height;
				camera.updateProjectionMatrix();

				renderer.setSize(width, height);
			};

			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
			}
	}, []);

	return (<div ref={containerRef} style={{overflow: 'hidden',
											margin: '0',
											padding: '0',
											width: '100%',
											height: '100%'}} />
	)
};

export default ModelViewer;

