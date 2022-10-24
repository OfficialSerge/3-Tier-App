import './App.css'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'
import { AuthProvider } from './contexts/AuthContext'

import { Signup } from './components/Signup'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { ForgotPassword } from './components/ForgotPassword'
import { UpdateProfile } from './components/UpdateProfile'
import { useEffect, useRef, useState } from 'react'

import * as THREE from 'three'
// import * as dat from 'lil-gui'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let colors = [
  0x043D5D,
  0x032E46,
  0x23B684,
  0x0F595E
]

const frag = `
// Retrieve varyings
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}`

const vert = `
// Retrieve Uniforms
uniform float uTime;
uniform float uBigWavesSpeed;
uniform float uBigWavesElevation;
uniform vec2 uBigWavesFreq;

uniform float uSmallWavesSpeed;
uniform float uSmallWavesElevation;
uniform float uSmallWavesFreq;
uniform float uSmallWavesIter;

uniform vec3 uColors[4];
uniform float uColorOffSet;
uniform float uColorMultiplier;

// Values to send to fragment
varying vec3 vColor;

// Classic Perlin 3D Noise 
// by Stefan Gustavson
vec4 permute(vec4 x)
{
    return mod(((x*34.0)+1.0)*x, 289.0);
}
vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}
vec3 fade(vec3 t)
{
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec3 P) 
{
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}

void main() {
  // Let's reference the position
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  // Start animating the waves
  float elevation = sin(modelPosition.x * uBigWavesFreq.x + uTime * uBigWavesSpeed) * // Waves along X
                    sin(modelPosition.z * uBigWavesFreq.y + uTime * uBigWavesSpeed) * // Waves along Z
                    uBigWavesElevation;

  for (float i = 1.0; i <= uSmallWavesIter; i++) {
    elevation += abs(cnoise(vec3(modelPosition.xz * uSmallWavesFreq * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
  }
  modelPosition.y += elevation;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  
  gl_Position = projectedPosition;

  // Assign varyings
  vColor = uColors[0];
  
  // Add noise to vColor
  for (int i = 1; i < 4; i++) {
    float noise = cnoise(
      vec3(
        modelPosition.xz * uSmallWavesFreq * 1.5, 
        uTime * uSmallWavesSpeed
      )
    );   
    
    float mixStrength = (noise + uColorOffSet) * uColorMultiplier; 
    
    vColor = mix(vColor, uColors[i], mixStrength); 
  }
}
`


function App() {
  const canvasRef = useRef(null)

  useEffect(() => {
    // const gui = new dat.GUI({ width: 340 })

    // configure color pallate for affect
    colors = colors.map((color) => { return new THREE.Color(color) })

    // canvas 
    const canvas = canvasRef.current

    // Scene
    const scene = new THREE.Scene()

    // Geometry
    const waterGeometry = new THREE.PlaneGeometry(2, 2, 128, 128)

    // Material
    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },

        uColors: { value: colors },
        uColorOffSet: { value: 0.08 },
        uColorMultiplier: { value: 1 },

        uBigWavesSpeed: { value: 0.1 },
        uBigWavesElevation: { value: 0.1 },
        uBigWavesFreq: { value: new THREE.Vector2(8.11, 4.33) },

        uSmallWavesSpeed: { value: 0.15 },
        uSmallWavesElevation: { value: 0.1 },
        uSmallWavesFreq: { value: 1.5 },
        uSmallWavesIter: { value: 1.0 }

      }
    })

    // gui.add(waterMaterial.uniforms.uBigWavesElevation, 'value', 0, 1, 0.001).name('Big Wave Height')
    // gui.add(waterMaterial.uniforms.uBigWavesFreq.value, 'x', 0, 10, 0.001).name('xBigFrequency')
    // gui.add(waterMaterial.uniforms.uBigWavesFreq.value, 'y', 0, 10, 0.001).name('yBigFrequency')
    // gui.add(waterMaterial.uniforms.uBigWavesSpeed, 'value', 0, 4, 0.001).name('Big Waves Speed')

    // gui.add(waterMaterial.uniforms.uSmallWavesElevation, 'value', 0, 1, 0.001).name('Small Waves Height')
    // gui.add(waterMaterial.uniforms.uSmallWavesFreq, 'value', 0, 30, 0.001).name('Small Waves Freq')
    // gui.add(waterMaterial.uniforms.uSmallWavesIter, 'value', 0, 5, 1).name('Small Waves Iter')
    // gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 'value', 0, 4, 0.001).name('Small Waves Speed')

    // gui.add(waterMaterial.uniforms.uColorOffSet, 'value', 0, 2, 0.001).name('OffSet Height')
    // gui.add(waterMaterial.uniforms.uColorMultiplier, 'value', 0, 10, 0.001).name('Color Multiplier')


    // Mesh
    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.rotation.x = - Math.PI * 0.5
    scene.add(water)

    // Sizes 
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }

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

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
    camera.position.set(0.3, 0.45, 0.5)
    camera.lookAt(0, 0, 0);
    scene.add(camera)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Animate
    const clock = new THREE.Clock()

    function tick() {
      const elapsedTime = clock.getElapsedTime()

      // Update Time
      waterMaterial.uniforms.uTime.value = elapsedTime

      // Render
      renderer.render(scene, camera)

      // Call tick again on the next frame
      window.requestAnimationFrame(tick)
    }

    return tick()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <canvas ref={canvasRef} />
        <div className='App'>
          <Routes>
            <Route exact path='/' element={<PrivateRoute />}>
              <Route exact path='/' element={<Dashboard />} />
            </Route>
            <Route exact path='/update-profile' element={<PrivateRoute />}>
              <Route exact path='/update-profile' element={<UpdateProfile />} />
            </Route>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
