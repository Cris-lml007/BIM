import '../css/app.css';

import Swal from 'sweetalert2';
import './bootstrap';
import * as THREE from 'three';

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import * as FB from "flatbuffers";
import * as OBF from '@thatopen/components-front';
import pako from "pako";
import Stats from 'stats.js';
import * as BUI from '@thatopen/ui';
import * as BUIC from '@thatopen/ui-obc'

window.Swal = Swal;
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.OrbitControls = OrbitControls;
window.RGBELoader = RGBELoader;
window.OBC = OBC;
window.FRAGS = FRAGS;
window.FB = FB;
window.pako = pako;
window.Stats = Stats;
window.OBF = OBF;
window.BUI = BUI;
window.BUIC = BUIC;
