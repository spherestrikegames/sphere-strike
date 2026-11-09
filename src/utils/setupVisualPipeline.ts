import * as THREE from 'three';

export function setupVisualPipeline(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // 1. Render Surface & Balanced Tone Mapping
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15; // Balanced for high dynamic range through frosted blur

  // 2. Lighting for Specular Caustics & Contrast
  // Crisp ice-blue sky (0xbfe3ff) with deep slate-earth ground (0x1e293b)
  const hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x1e293b, 0.95);
  hemiLight.position.set(0, 80, 0);
  scene.add(hemiLight);

  // High-intensity directional key light for sharp rim highlights & specular glare
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
  sunLight.position.set(50, 95, 40);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 280;
  sunLight.shadow.bias = -0.0003;

  const shadowBounds = 70;
  sunLight.shadow.camera.left = -shadowBounds;
  sunLight.shadow.camera.right = shadowBounds;
  sunLight.shadow.camera.top = shadowBounds;
  sunLight.shadow.camera.bottom = -shadowBounds;
  scene.add(sunLight);

  // Horizon fog
  const skyColor = 0xa5d5f5;
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.FogExp2(skyColor, 0.0035);

  // 3. Apple Liquid Glass Material (Acrylic / Clearcoat Glass Mesh)
  const liquidGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    thickness: 1.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.92,
  });

  return { hemiLight, sunLight, liquidGlassMaterial };
}
