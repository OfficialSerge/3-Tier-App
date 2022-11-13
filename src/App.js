import './App.css'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'
import { AuthProvider } from './contexts/AuthContext'

import { Signup } from './components/Signup'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { ForgotPassword } from './components/ForgotPassword'
import { UpdateProfile } from './components/UpdateProfile'
import { useMemo, useState } from 'react'

import * as THREE from 'three'
// import * as dat from 'lil-gui'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const frag = `
// Retrieve varyings
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}`

const vert = `
// Retrieve Uniforms
uniform float uTime;
uniform float uColorMultiplier;
uniform float uBigWavesSpeed;
uniform float uBigWavesElevation;
uniform float uSmallWavesSpeed;
uniform float uSmallWavesElevation;

uniform vec2 uBigWavesFreq;

uniform vec3 uColors[4];

// Values to send to fragment
varying vec3 vColor;

// Simplex noise functions
// Author : Ian McEwan, Ashima Arts.

vec4 permute(vec4 x)
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}
vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
{ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  // Let's reference the position
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  // Start animating the waves
  float elevation = sin(modelPosition.x * uBigWavesFreq.x + uTime * uBigWavesSpeed) * // Waves along X
                    sin(modelPosition.z * uBigWavesFreq.y + uTime * uBigWavesSpeed) * // Waves along Z
                    uBigWavesElevation;
  
  float noise = snoise(vec3(modelPosition.xz, uTime * uSmallWavesSpeed)) * uSmallWavesElevation;
  noise = max(0.0, noise);

  modelPosition.y += elevation + noise;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  
  gl_Position = projectedPosition;

  // Assign varyings
  vColor = uColors[0];
  
  // Add noise to vColor
  for (int i = 1; i < 4; i++) {
    float noise = snoise(
      vec3(
        modelPosition.xz * 1.8, 
        uTime * uSmallWavesSpeed
      )
    );   
    
    float mixStrength = noise * uColorMultiplier; 
    vColor = mix(vColor, uColors[i], mixStrength); 
  }
}
`

const defaultColors = [
  [0.01568, 0.23921, 0.36470], // Indigo
  [0.01176, 0.18039, 0.27450], // Navy
  [0.05882, 0.34901, 0.36862], // Jungle Green
  [0.13725, 0.71372, 0.51764], // Mint
]

const invalidLoginColors = [
  [0.48235, 0.07843, 0.46274], // Violet
  [0.38431, 0.01568, 0.34901], // Dark Purple
  [0.43921, 0.03921, 0.03921], // Blook Red
  [0.79215, 0.20392, 0.08627], // Cherry Red
]

function App() {
  const [formValid, setFormValid] = useState(true)

  // console.log('APP RERENDERED')
  // DEPENDING ON HOW MUCH THE STATE CHANGES WE MAY OR MAY
  // NOT NEED TO MEMO THIS
  const waterMaterial = useMemo(function webGLSetup() {
    // console.log('MEMO')
    // const gui = new dat.GUI({ width: 340 })

    // gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value', 0, 1, 0.001).name('Big Wave Height')
    // gui.add(waterMaterial.uniforms.uBigWavesFreq.value, 'x', 0, 10, 0.001).name('xBigFrequency')
    // gui.add(waterMaterial.uniforms.uBigWavesFreq.value, 'y', 0, 10, 0.001).name('yBigFrequency')
    // gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value', 0, 4, 0.001).name('Big Waves Speed')
    // gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value', 0, 1, 0.001).name('Small Waves Height')
    // gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value', 0, 4, 0.001).name('Small Waves Speed')
    // gui.add(waterMaterial.uniforms.uColorMultiplier, 'value', 0, 10, 0.001).name('Color Multiplier')

    // Scene
    const scene = new THREE.Scene()

    // configure color palette for affect
    const colors = defaultColors.map(([R, G, B]) => { return new THREE.Color(R, G, B) })

    // Geometry
    const waterGeometry = new THREE.PlaneGeometry(2, 2, 128, 128)

    // Material
    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },                                      // used to animate motion

        uColors: { value: colors },                              // array of 4 colors
        uColorMultiplier: { value: 0.55 },                        // controls the strength of the mix effect

        uBigWavesFreq: { value: new THREE.Vector2(8.11, 4.33) },  // the frequency of the waves in the X, Z directions

        uBigWavesSpeed: { value: 0.1 },                           // constant to multiply uTime with
        uSmallWavesSpeed: { value: 0.1 },                         // constant to multiply uTime with 
        uBigWavesElevation: { value: 0.1 },                       // constant to multiply wave height by
        uSmallWavesElevation: { value: 0.1 },                     // constant to multiply wave noise height by

      }
    })

    // Mesh
    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.rotation.x = - Math.PI * 0.5
    scene.add(water)

    // Sizes 
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Base camera
    const camera = new THREE.PerspectiveCamera(34, sizes.width / sizes.height, 0.1, 100)
    camera.position.set(0.35, 0.43, 0.44) 
    // camera.position.set(1, 1, 0.5)
    camera.lookAt(0, 0, 0);
    scene.add(camera)

    // Renderer
    const renderer = new THREE.WebGLRenderer()
    document.body.appendChild(renderer.domElement)

    // Configure Renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Add event listener for screen resize
    window.addEventListener('resize', () => {
      // Update sizes
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight

      // Update camera
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()

      // Update renderer
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    // Clock
    const clock = new THREE.Clock()

    function tick() {
      // const elapsedTime = clockRef.current.getElapsedTime()
      const elapsedTime = clock.getElapsedTime()

      // Update Time
      waterMaterial.uniforms.uTime.value = elapsedTime

      // Render
      renderer.render(scene, camera)

      // Call tick again on the next frame
      window.requestAnimationFrame(tick)
    }

    // Start Loop
    tick()

    return waterMaterial
  }, [])

  /**
   * @param {number} ms the time in ms to wait before continuing
   * @returns {Promise} will resolve after the time runs out
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @param {number} startCol // a set of rgb values (0 - 1) to serve as the initial color
   * @param {number} endCol // a set of rgb values (0 - 1) to serve as the final color
   * Interpolate between colors using Bezier curve to ease-in values
   */
  function* interpolateColors(startCol, endCol) {
    const [rStart, rEnd] = [startCol[0], endCol[0]]
    const [gStart, gEnd] = [startCol[1], endCol[1]]
    const [bStart, bEnd] = [startCol[2], endCol[2]]

    const deltaR = (rEnd - rStart)
    const deltaG = (gEnd - gStart)
    const deltaB = (bEnd - bStart)

    for (let i = 1; i <= 60; i++) {
      const x = i / 60

      // Bezier outputs value (0 - 1)
      // for domain of [0 - 1] looks curvy
      const Bezier = x * x * (3 - 2 * x)

      const rStep = rStart + (deltaR * Bezier)
      const gStep = gStart + (deltaG * Bezier)
      const bStep = bStart + (deltaB * Bezier)

      const RGB = [rStep, gStep, bStep]
      yield RGB
    }
  }

  /**
   * shifts background to red
   */
  async function blueToRed() {
    const gen1 = interpolateColors(defaultColors[0], invalidLoginColors[0])
    const gen2 = interpolateColors(defaultColors[1], invalidLoginColors[1])
    const gen3 = interpolateColors(defaultColors[2], invalidLoginColors[2])
    const gen4 = interpolateColors(defaultColors[3], invalidLoginColors[3])

    for (let i = 0; i < 60; i++) {
    // target 60fps = 16.67 ms a frame
      await sleep(16.6666) 

      const RGBVals = [
        (gen1.next()).value,
        (gen2.next()).value,
        (gen3.next()).value,
        (gen4.next()).value,
      ]

      // configure color palette for affect
      const colors = RGBVals.map(([R, G, B]) => { return new THREE.Color(R, G, B) })

      // Update Material
      waterMaterial.uniforms.uColors.value = colors
    }
  }
  /**
   * shifts background to blue
   */
  async function redToBlue() {
    const gen1 = interpolateColors(invalidLoginColors[0], defaultColors[0])
    const gen2 = interpolateColors(invalidLoginColors[1], defaultColors[1])
    const gen3 = interpolateColors(invalidLoginColors[2], defaultColors[2])
    const gen4 = interpolateColors(invalidLoginColors[3], defaultColors[3])

    for (let i = 0; i < 60; i++) {
      // target 60fps = 16.67 ms a frame
        await sleep(16.6666) 

      const RGBVals = [
        (gen1.next()).value,
        (gen2.next()).value,
        (gen3.next()).value,
        (gen4.next()).value,
      ]

      // configure color palette for affect
      const colors = RGBVals.map(([R, G, B]) => { return new THREE.Color(R, G, B) })

      // Update Material
      waterMaterial.uniforms.uColors.value = colors
    }
  }

  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          <Routes>
            <Route exact path='/' element={<PrivateRoute />}>
              <Route exact path='/' element={<Dashboard />} />
            </Route>
            <Route exact path='/update-profile' element={<PrivateRoute />}>
              <Route exact path='/update-profile' element={<UpdateProfile />} />
            </Route>
            <Route path="/signup" element={
              <Signup
                formValid={formValid}
                setFormValid={setFormValid}
                blueToRed={blueToRed}
                redToBlue={redToBlue} />} />

            <Route path="/login" element={
              <Login
                formValid={formValid}
                setFormValid={setFormValid}
                blueToRed={blueToRed}
                redToBlue={redToBlue} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
