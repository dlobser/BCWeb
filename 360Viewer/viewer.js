// 360 Viewer Logic

let camera, scene, renderer;
let isUserInteracting = false;
let onPointerDownMouseX = 0, onPointerDownMouseY = 0;
let lon = 0, onPointerDownLon = 0;
let lat = 0, onPointerDownLat = 0;
let targetLon = 0, targetLat = 0;
let phi = 0, theta = 0;

// Auto-rotate settings
let autoRotate = false;
let autoRotateSpeed = 0.05;

// Sphere geometry and material
let sphereMaterial;
const textureLoader = new THREE.TextureLoader();

// DOM elements
const container = document.getElementById('canvas-container');
const dropdown = document.getElementById('image-select');
const fovSlider = document.getElementById('fov-slider');
const fovValue = document.getElementById('fov-val');
const autoRotateToggle = document.getElementById('auto-rotate');
const rotateSpeedSlider = document.getElementById('rotate-speed');
const speedValue = document.getElementById('speed-val');
const resetBtn = document.getElementById('btn-reset');
const fullscreenBtn = document.getElementById('btn-fullscreen');
const fileInput = document.getElementById('file-input');
const dragOverlay = document.getElementById('drag-overlay');
const loader = document.getElementById('loader');
const toastContainer = document.getElementById('toast-container');

// Map to track dynamically added user files (name -> object URL)
const userFiles = new Map();

// Initialize the 360 Viewer
function init() {
  // 1. Create Scene
  scene = new THREE.Scene();

  // 2. Create Camera
  const initialFov = parseInt(fovSlider.value) || 75;
  camera = new THREE.PerspectiveCamera(initialFov, window.innerWidth / window.innerHeight, 1, 1100);
  camera.position.set(0, 0, 0);

  // 3. Create Sphere Geometry
  // We use scale.x = -1 to invert the sphere faces so the texture renders on the inside
  const geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  // Create basic material (no lighting required for self-illuminated panorama)
  sphereMaterial = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, sphereMaterial);
  scene.add(mesh);

  // 4. Create WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace; // Matches modern Three.js colorspace
  container.appendChild(renderer.domElement);

  // 5. Setup Event Listeners
  setupEventListeners();

  // 6. Start UI values sync
  updateFovUI(initialFov);
  updateSpeedUI(parseFloat(rotateSpeedSlider.value));

  // 7. Load images and start loop
  loadImagesList().then(() => {
    // Load initial image
    if (dropdown.options.length > 0) {
      loadImage(dropdown.value);
    } else {
      showToast("No images found. Please drag & drop a .jpg panorama!", "error");
      hideLoader();
    }
  });

  animate();
}

// Set up UI and Interaction Event Listeners
function setupEventListeners() {
  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Pointer/Mouse Drag interaction
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  container.addEventListener('wheel', onDocumentMouseWheel);

  // Dropdown select change
  dropdown.addEventListener('change', (e) => {
    loadImage(e.target.value);
  });

  // FOV Slider adjustment
  fovSlider.addEventListener('input', (e) => {
    const fov = parseInt(e.target.value);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    updateFovUI(fov);
  });

  // Auto-rotate Toggle
  autoRotateToggle.addEventListener('change', (e) => {
    autoRotate = e.target.checked;
    showToast(autoRotate ? "Auto-rotation enabled" : "Auto-rotation paused", "success");
  });

  // Auto-rotate Speed Slider
  rotateSpeedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    autoRotateSpeed = val;
    updateSpeedUI(val);
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    targetLon = 0;
    targetLat = 0;
    camera.fov = 75;
    camera.updateProjectionMatrix();
    fovSlider.value = 75;
    updateFovUI(75);
    showToast("View reset", "success");
  });

  // Fullscreen Button
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Custom File Input
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Drag and Drop
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragOverlay.classList.add('active');
  });

  dragOverlay.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  dragOverlay.addEventListener('dragleave', (e) => {
    e.preventDefault();
    // Only deactivate if leaving the overlay, not sub-elements
    if (e.relatedTarget === null || !dragOverlay.contains(e.relatedTarget)) {
      dragOverlay.classList.remove('active');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragOverlay.classList.remove('active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });
}

// Load the list of images
async function loadImagesList() {
  // Clear select elements
  dropdown.innerHTML = '';

  // 1. Try to fetch folder listing (works on local web servers)
  try {
    const response = await fetch('./');
    if (response.ok) {
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'));
      
      const files = links
        .map(a => a.getAttribute('href'))
        .filter(href => href && (
          href.toLowerCase().endsWith('.jpg') || 
          href.toLowerCase().endsWith('.jpeg') || 
          href.toLowerCase().endsWith('.png')
        ))
        .map(href => decodeURIComponent(href));
      
      const uniqueFiles = [...new Set(files)];
      
      if (uniqueFiles.length > 0) {
        uniqueFiles.forEach(file => addDropdownOption(file, file));
        showToast(`Auto-scanned ${uniqueFiles.length} images from folder!`, "success");
        return;
      }
    }
  } catch (err) {
    console.log("Folder scanner could not run dynamically (likely file:// protocol or folder index disabled). Using fallback.");
  }

  // 2. Try static config fallback (if images.js loaded a global IMAGES array)
  if (typeof IMAGES !== 'undefined' && Array.isArray(IMAGES) && IMAGES.length > 0) {
    // Filter out potential blank elements and build option list
    const validImages = IMAGES.filter(img => img && img.trim() !== "");
    if (validImages.length > 0) {
      validImages.forEach(img => addDropdownOption(img, img));
      showToast(`Loaded ${validImages.length} images from static config!`, "success");
      return;
    }
  }

  // 3. Fallback: Show helper instruction message
  showToast("Ready. Please drag & drop panorama files to start!", "success");
}

function addDropdownOption(value, text, selectIt = false) {
  const option = document.createElement('option');
  option.value = value;
  option.text = text;
  dropdown.appendChild(option);
  if (selectIt) {
    dropdown.value = value;
  }
}

// Load a specific texture image
function loadImage(url) {
  showLoader();
  
  textureLoader.load(
    url,
    (texture) => {
      // Success
      if (sphereMaterial.map) {
        sphereMaterial.map.dispose(); // clean up old texture memory
      }
      sphereMaterial.map = texture;
      sphereMaterial.needsUpdate = true;
      hideLoader();
      
      // Extract filename from URL/path for user toast
      let filename = url;
      if (url.startsWith('blob:')) {
        // Find user file entry
        for (let [name, blobUrl] of userFiles.entries()) {
          if (blobUrl === url) {
            filename = name;
            break;
          }
        }
      } else {
        filename = url.substring(url.lastIndexOf('/') + 1);
      }
      showToast(`Loaded image: ${filename}`, "success");
    },
    undefined,
    (err) => {
      // Error
      console.error("Error loading texture:", err);
      hideLoader();
      showToast(`Failed to load texture: ${url}. (Check console or browser CORS restrictions if using file://)`, "error");
    }
  );
}

// File Handler for Custom Upload and Drag-and-Drop
function handleFiles(files) {
  if (!files || files.length === 0) return;
  
  let firstLoaded = false;
  
  for (let file of files) {
    const nameLower = file.name.toLowerCase();
    if (file.type.match('image/jpeg') || file.type.match('image/png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png')) {
      const objectURL = URL.createObjectURL(file);
      userFiles.set(file.name, objectURL);
      
      // Add option to dropdown
      addDropdownOption(objectURL, `[Local] ${file.name}`, !firstLoaded);
      
      if (!firstLoaded) {
        loadImage(objectURL);
        firstLoaded = true;
      }
    } else {
      showToast(`File "${file.name}" is not a JPEG/JPG or PNG image!`, "error");
    }
  }
}

// Pointer event handlers for drag rotation
function onPointerDown(e) {
  if (e.target !== container.querySelector('canvas')) return; // ignore control panel clicks
  
  isUserInteracting = true;
  onPointerDownMouseX = e.clientX;
  onPointerDownMouseY = e.clientY;
  onPointerDownLon = lon;
  onPointerDownLat = lat;
}

function onPointerDownNative(e) {
  // Guard so clicking UI panels doesn't trigger drag
  if (e.target.closest('.control-panel') || e.target.closest('#toast-container')) return;
}

function onPointerMove(e) {
  if (isUserInteracting === true) {
    // Multiply by sensitivity index (e.g. 0.1)
    const factor = 0.1 + (camera.fov / 75) * 0.1; // adjust drag speed based on zoom
    targetLon = (onPointerDownMouseX - e.clientX) * factor + onPointerDownLon;
    targetLat = (e.clientY - onPointerDownMouseY) * factor + onPointerDownLat;
  }
}

function onPointerUp() {
  isUserInteracting = false;
}

// Mouse wheel event for zooming
function onDocumentMouseWheel(e) {
  // Smooth zooming
  const fov = camera.fov + e.deltaY * 0.05;
  camera.fov = Math.max(30, Math.min(120, fov));
  camera.updateProjectionMatrix();
  
  // Sync UI slider
  const fovRounded = Math.round(camera.fov);
  fovSlider.value = fovRounded;
  updateFovUI(fovRounded);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Fullscreen controls
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      showToast(`Could not activate fullscreen: ${err.message}`, "error");
    });
  } else {
    document.exitFullscreen();
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  update();
}

function update() {
  if (autoRotate && !isUserInteracting) {
    targetLon += autoRotateSpeed;
  }

  // Smooth out camera angles using linear interpolation (lerping)
  lon = THREE.MathUtils.lerp(lon, targetLon, 0.15);
  lat = THREE.MathUtils.lerp(lat, targetLat, 0.15);

  // Clamp latitude to prevent camera from flipping upside down
  lat = Math.max(-85, Math.min(85, lat));

  // Convert angles to Cartesian Coordinates looking inside-out
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  const target = new THREE.Vector3();
  target.x = 500 * Math.sin(phi) * Math.sin(theta);
  target.y = 500 * Math.cos(phi);
  target.z = 500 * Math.sin(phi) * Math.cos(theta);

  camera.lookAt(target);
  renderer.render(scene, camera);
}

// UI Helper Utilities
function updateFovUI(val) {
  fovValue.textContent = `${val}°`;
}

function updateSpeedUI(val) {
  speedValue.textContent = val.toFixed(2);
}

function showLoader() {
  loader.style.opacity = '1';
  loader.style.pointerEvents = 'auto';
}

function hideLoader() {
  loader.style.opacity = '0';
  loader.style.pointerEvents = 'none';
}

// Toast Notifications System
function showToast(message, type = "success") {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon based on type
  let iconHtml = '';
  if (type === 'success') {
    iconHtml = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`;
  } else if (type === 'error') {
    iconHtml = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  }
  
  toast.innerHTML = `${iconHtml} <span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.9)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Initialize on page load
window.addEventListener('load', init);
