import Swal from 'sweetalert2';
import './bootstrap';
import * as THREE from 'three';

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';


window.Swal = Swal;
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.OrbitControls = OrbitControls;
window.RGBELoader = RGBELoader;
