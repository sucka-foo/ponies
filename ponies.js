if (!Detector.webgl) Detector.addGetWebGLMessage()

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024
var SCREEN_WIDTH = window.innerWidth
var SCREEN_HEIGHT = window.innerHeight
var FLOOR = -250
var ANIMATION_GROUPS = 5
var camera
var controls
var renderer
var scene
var container
var stats
var NEAR = 5, FAR = 3000
var morph, morphs = [], mixer, animGroups = []
var light
var clock = new THREE.Clock()

function init () {
  container = document.createElement('div')
  document.body.appendChild(container)
  // SCENE CAMERA

  camera = new THREE.PerspectiveCamera(23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR)
  camera.position.set(70, 50, 2000)

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x594b, 1000, FAR)

  // LIGHTS
  var ambient = new THREE.AmbientLight(0x444644)
  scene.add(ambient)

  light = new THREE.SpotLight(0xfffbbb, 1, 0, Math.PI / 2)
  light.position.set(0, 2000, 1000)
  light.target.position.set(0, 0, 0)
  light.castShadow = true
  light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 700, FAR))
  light.shadow.bias = 0.001
  light.shadow.mapSize.width = SHADOW_MAP_WIDTH
  light.shadow.mapSize.height = SHADOW_MAP_HEIGHT
  scene.add(light)

  createScene()

  // RENDERER

  renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
  container.appendChild(renderer.domElement)
  renderer.setClearColor(scene.fog.color)
  renderer.autoClear = true
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // STATS

  stats = new Stats()
  container.appendChild(stats.dom)

  //
  window.addEventListener('resize', onWindowResize, false)
}

function onWindowResize () {
  SCREEN_WIDTH = window.innerWidth
  SCREEN_HEIGHT = window.innerHeight
  camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT
  camera.updateProjectionMatrix()
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
}

function createScene () {
  // GROUND
  var geometry = new THREE.PlaneBufferGeometry(100, 100)
  var planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffdd99 })
  var ground = new THREE.Mesh(geometry, planeMaterial)

  ground.position.set(0, FLOOR, 0)
  ground.rotation.x = -Math.PI / 2
  ground.scale.set(100, 100, 100)
  ground.castShadow = false
  ground.receiveShadow = true
  scene.add(ground)

  mixer = new THREE.AnimationMixer(scene)
  for (var i = 0; i !== ANIMATION_GROUPS; ++i) {
    animGroups.push(new THREE.AnimationObjectGroup())
  }

  // MORPHS
  function addMorph (geometry, speed, duration, x, y, z, fudgeColor, massOptimization) {
    var material = new THREE.MeshLambertMaterial({ color: 0xffaa55, morphTargets: true, vertexColors: THREE.FaceColors })
    if (fudgeColor) {
      material.color.offsetHSL(0, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25)
    }
    var mesh = new THREE.Mesh(geometry, material)
    mesh.speed = speed
    var clip = geometry.animations[ 0 ]

    var index = Math.floor(Math.random() * ANIMATION_GROUPS)
    var animGroup = animGroups[ index ]
    animGroup.add(mesh)
    // if (!mixer.existingAction(clip, animGroup)) {
    var randomness = 0.6 * Math.random() - 0.3
    var phase = (index + randomness) / ANIMATION_GROUPS
    mixer.clipAction(clip, animGroup)
          .setDuration(duration)
          .startAt(-duration * phase)
          .play()
    // }

    mesh.position.set(x, y, z)
    mesh.rotation.y = Math.PI / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    morphs.push(mesh)
  }

  var loader = new THREE.JSONLoader()
  loader.load('models/animated/horse.js', function (geometry) {
    for (var i = -6; i < 6; i += 2) {
      addMorph(geometry, 550, 1, 100 - Math.random() * 3000, FLOOR, i, true, true)
    }
  })
  loader.load('models/animated/stork.js', function (geometry) {
    for (var i = -6; i < 6; i += 2) {
      addMorph(geometry, 500, 1000, 500 - Math.random() * 500, FLOOR + 350, 40)
    }
  })
}

function animate () {
  requestAnimationFrame(animate)
  render()
}

function render () {
  var delta = clock.getDelta()
  if (mixer) {
    mixer.update(delta)
  }
  for (var i = 0; i < morphs.length; i++) {
    morph = morphs[ i ]
    morph.position.x += morph.speed * delta
    if (morph.position.x > 2000) {
      morph.position.x = -360 - Math.random() * 500
      morph.position.z = -160 - Math.random() * 500
      // morph.position.y = -160
    }
  }
  renderer.clear()
  renderer.render(scene, camera)
}

init()
animate()
