import './style.css'
import * as THREE from 'three';


const maxParticleCount = 1000;
const particlesData = [];
const r = 1000;
const rHalf = r / 2;

let container, clock;
let group;
let positions, colors;
let particles;
let pointCloud;
let particlePositions;
let linesMesh;
let minDistance = 300;
let particleCount = 500;
let camera, scene, renderer;


init();
animate();

function init() {

  container = document.getElementById( 'container' );

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / (window.innerHeight/5), 1, 4000 );
  camera.position.z = 2000;

  scene = new THREE.Scene();
  group = new THREE.Group();
  scene.add( group );
  clock = new THREE.Clock();
/*

  const helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxGeometry( 4*r, r, r*2 ) ) );
  helper.material.color.setHex( 0x101010 );
  helper.material.blending = THREE.AdditiveBlending;
  helper.material.transparent = true;
  group.add( helper );
*/
  const segments = maxParticleCount * maxParticleCount;

  positions = new Float32Array( segments * 3 );
  colors = new Float32Array( segments * 3 );

  const pMaterial = new THREE.PointsMaterial( {
    color: 0xFFFFFF,
    size: 3,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: false
  } );

  particles = new THREE.BufferGeometry();
  particlePositions = new Float32Array( maxParticleCount * 3 );

  for ( let i = 0; i < maxParticleCount; i ++ ) {

    const x = (Math.random() * r - r / 2) * 4;
    const y = Math.random() * r - r / 2;
    const z = (Math.random() * r - r / 2)* 2;

    particlePositions[ i * 3 ] = x;
    particlePositions[ i * 3 + 1 ] = y;
    particlePositions[ i * 3 + 2 ] = z;

    // add it to the geometry
    particlesData.push( {
      velocity: new THREE.Vector3( - 1 + Math.random() * 2, - 1 + Math.random() * 2, - 1 + Math.random() * 2 ),
      numConnections: 0
    } );

  }

  particles.setDrawRange( 0, particleCount );
  particles.setAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );

  // create the particle system
  pointCloud = new THREE.Points( particles, pMaterial );
  group.add( pointCloud );

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
  geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setUsage( THREE.DynamicDrawUsage ) );

  geometry.computeBoundingSphere();

  geometry.setDrawRange( 0, 0 );

  const material = new THREE.LineBasicMaterial( {
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true
  } );

  linesMesh = new THREE.LineSegments( geometry, material );
	group.add( linesMesh );

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight /5 );
  renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild( renderer.domElement );

  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / (window.innerHeight/5);
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight/5 );

}

//

function animate() {

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  for ( let i = 0; i < particleCount; i ++ )
    particlesData[ i ].numConnections = 0;

  for ( let i = 0; i < particleCount; i ++ ) {

    // get the particle
    const particleData = particlesData[ i ];

    particlePositions[ i * 3 ] += particleData.velocity.x;
    particlePositions[ i * 3 + 1 ] += particleData.velocity.y;
    particlePositions[ i * 3 + 2 ] += particleData.velocity.z;

    if ( particlePositions[ i * 3 + 1 ] < - rHalf || particlePositions[ i * 3 + 1 ] > rHalf )
      particleData.velocity.y = - particleData.velocity.y;

    if ( particlePositions[ i * 3 ] < - rHalf || particlePositions[ i * 3 ] > rHalf )
      particleData.velocity.x = - particleData.velocity.x;

    if ( particlePositions[ i * 3 + 2 ] < - rHalf || particlePositions[ i * 3 + 2 ] > rHalf )
      particleData.velocity.z = - particleData.velocity.z;


    // Check collision
    for ( let j = i + 1; j < particleCount; j ++ ) {

      const particleDataB = particlesData[ j ];

      const dx = particlePositions[ i * 3 ] - particlePositions[ j * 3 ];
      const dy = particlePositions[ i * 3 + 1 ] - particlePositions[ j * 3 + 1 ];
      const dz = particlePositions[ i * 3 + 2 ] - particlePositions[ j * 3 + 2 ];
      const dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

      if ( dist < minDistance ) {

        particleData.numConnections ++;
        particleDataB.numConnections ++;

        const alpha = 1.0 - dist / minDistance;

        positions[ vertexpos ++ ] = particlePositions[ i * 3 ];
        positions[ vertexpos ++ ] = particlePositions[ i * 3 + 1 ];
        positions[ vertexpos ++ ] = particlePositions[ i * 3 + 2 ];

        positions[ vertexpos ++ ] = particlePositions[ j * 3 ];
        positions[ vertexpos ++ ] = particlePositions[ j * 3 + 1 ];
        positions[ vertexpos ++ ] = particlePositions[ j * 3 + 2 ];

        colors[ colorpos ++ ] = alpha;
        colors[ colorpos ++ ] = alpha;
        colors[ colorpos ++ ] = alpha;

        colors[ colorpos ++ ] = alpha;
        colors[ colorpos ++ ] = alpha;
        colors[ colorpos ++ ] = alpha;

        numConnected ++;

      }

    }

  }

  linesMesh.geometry.setDrawRange( 0, numConnected * 2 );
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;

  pointCloud.geometry.attributes.position.needsUpdate = true;

  requestAnimationFrame( animate );
  render();
}

function render() {

  const time = clock.getElapsedTime();
  group.rotation.y = time * 0.1;
  renderer.render( scene, camera );

}
