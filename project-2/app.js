/**
 * Controlos:
 *  'w': Muda para visualização em malha de arame.
 *  's': Muda para visualização com superficies preenchidas
 *  'p': Pausa a animação
 *  '+': Aumenta a velocidade de animação
 *  '-': Diminui a velocidade de animação
 *  '1': Projeção axonometrica
 *  '2': Vista de alçado principal
 *  '3': Vista de planta
 *  '4': Vista de alçado lateral direito
 *  '5': Vista livre
 *  '6': Vista de primeira pessoa no helicoptero
 *  'j': Alterar direção horizontal de vista livre para menos
 *  'l': Alterar direção horizontal de vista livre para mais
 *  'i': Alterar direção vertical de vista livre para mais
 *  'k': Alterar direção vertical de vista livre para menos
 *  'r': Helicoptero andar para a frente
 *  'f': Helicoptero abranda
 *  'g': Helicoptero rodar para a direita
 *  'd': Helicoptero rodar para a esquerda
 *  'ArrowUp': Subir o helicoptero (aumentando a velocidade da helice)
 *  'ArrowDown': Descer o helicoptero
 *  'ArrowLeft': Mover o helicoptero em circulo (apenas quando está em modo automatico)
 *  'q': Aumentar distancia de visualização (apenas em Vista Livre)
 *  'a': Diminuir distancia de visualização (apenas em Vista Livre)
 *  'z': Mudar de modo automático para manual e vice versa
 *  ' ': Largar caixa
 *  'm': Gerar novo cenário
 * 
 */


import {
  buildProgramFromSources,
  loadShadersFromURLS,
  setupWebGL,
} from "../../libs/utils.js";
import { flatten, lookAt, ortho, vec3} from "../../libs/MV.js";
import {
  loadMatrix,
  modelView,
  multRotationX,
  multRotationY,
  multRotationZ,
  multScale,
  multTranslation,
  popMatrix,
  pushMatrix
} from "../../libs/stack.js";

import * as SPHERE from "../../libs/objects/sphere.js";
import * as CYLINDER from "../../libs/objects/cylinder.js";
import * as CUBE from "../../libs/objects/cube.js";
import * as PYRAMID from "../../libs/objects/pyramid.js";
import { mult, perspective, rotateY, vec2, rotateZ,rotate} from "./libs/MV.js";
import * as dat from "../../libs/dat.gui.module.js";

/** @type WebGLRenderingContext */
let gl;

let time = 0; // Global simulation time in days
let speed = 1 / 60.0; // Speed (how many days added to time on each render pass
let mode; // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true; // Animation is running
let hasToRestart = false;
let isAutomaticAnimation = true;

//VIEWCONST
//View
let ADJUSTABLE_VARS = {vp_distance: 150.0, gravity: 9.8, wind_resistance: 35.0, enableDayNightCycle: true, helicopterScale: 3.5,
                       verticalDirection: 335.0, horizontalDirection: 145.0};
const CAMERA_ANGLE_CHANGE = 3.0;
const FIRST_PERSON_VIEW_MODE = "firstPersonView";
const BOTTOM_VIEW_MODE = "botomView";
const CENTER_VIEW_MODE = "centerView";
const DEFAULT_VIEW_MODE = "defaultView";
const HELICOPTER_VIEW_MODE = "helicopterView";
const GUI = new dat.GUI({name: 'My GUI'});
let viewMode = DEFAULT_VIEW_MODE;


//Crate

let crateInstances = [];
const CRATE_DESPAWN_TIME = 5.0;
const MAX_CRATE_NUM = 200;
const CRATE_SIZE = 3.5;

//World Limits and forces
const WORLD_X_UPPER_LIMIT = 100.0;
const WORLD_Y_UPPER_LIMIT = 100.0;
const WORLD_Z_UPPER_LIMIT = 100.0;

const WORLD_X_LOWER_LIMIT = -100.0;
const WORLD_Y_LOWER_LIMIT = 0.0;
const WORLD_Z_LOWER_LIMIT = -100.0;

//Estes valores foram adaptados de acordo com alguns testes
let sunAngle = -90.0; //em relacao ao x

//Helicopter movement
let helicopterSpeed = 0.0;
let helicopterAngleY = 0.0;
const AUTOMATIC_ANIMATION_RADIUS = 50.0;


const HELICOPTER_MAX_SPEED = 130;
const HELICOPTER_ANGLE_CHANGE = 7.0;
const HELICOPTER_MAX_ATTACK_ANGLE = 30;
let HELICOPTER_ACCELERATION = ADJUSTABLE_VARS.wind_resistance/3.0;

//Main Helice
let HELICE_DIAMETER = 4 * ADJUSTABLE_VARS.helicopterScale;
let HELICE_SIZE_X = HELICE_DIAMETER * 1.0;
let HELICE_SIZE_Y = HELICE_DIAMETER * 1.0 / 30.0;
let HELICE_SIZE_Z = HELICE_DIAMETER * 1.0 / 8.0;

//All helices
let heliceSpeed = 0;
const HELICE_FLYING_SPEED = 1300;
const HELICE_NUM = 3;

//Helice connector
let HELICE_CONECT_DIAMETER = 0.3 * ADJUSTABLE_VARS.helicopterScale;
let HELICE_CONECT_HIGH = 0.5 * ADJUSTABLE_VARS.helicopterScale;

//Tail Main Connector
let TAIL_MAIN_CONECT_DIAMETER = 4.0 * ADJUSTABLE_VARS.helicopterScale;
let TAIL_MAIN_SIZE_X = TAIL_MAIN_CONECT_DIAMETER * 1.0 / 18.0;
let TAIL_MAIN_SIZE_Y = TAIL_MAIN_CONECT_DIAMETER * 1.0 / 8.0;
let TAIL_MAIN_SIZE_Z = TAIL_MAIN_CONECT_DIAMETER * 1.0;

//Tail End Connector
let TAIL_END_DIAMETER = 1 * ADJUSTABLE_VARS.helicopterScale;
let TAIL_END_SIZE_X = TAIL_END_DIAMETER * 1.0 / 13.0;
let TAIL_END_SIZE_Y = TAIL_END_DIAMETER * 1.0;
let TAIL_END_SIZE_Z = TAIL_END_DIAMETER * 1.0 / 1.8;

//Leg connector
const LEG_ANGLE_Y = 30;
const LEG_ANGLE_Z = 60;
let LEG_CONECT_X = 1.2 * ADJUSTABLE_VARS.helicopterScale;
let LEG_CONECT_Y = 1 / 7 * ADJUSTABLE_VARS.helicopterScale;
let LEG_CONECT_Z = 1 / 4 * ADJUSTABLE_VARS.helicopterScale;

//Helicopter Body
let BODY_DIAMETER = 5.0 * ADJUSTABLE_VARS.helicopterScale;
let BODY_SIZE_X = BODY_DIAMETER * 1.0 / 3.0;
let BODY_SIZE_Y = BODY_DIAMETER * 1.0 / 2.2;
let BODY_SIZE_Z = BODY_DIAMETER * 1.0;

//Feet
let FEET_X = 1 / 4 * ADJUSTABLE_VARS.helicopterScale;
let FEET_Y = 1 / 4 * ADJUSTABLE_VARS.helicopterScale;
let FEET_Z = BODY_SIZE_Z;

const CENTER_SPHERE_SIZE = 2.0;

//General helicopter
let HELICOPTER_BOTTOM_TO_CENTER = BODY_SIZE_Y / 2.0 + (Math.cos(LEG_ANGLE_Y * Math.PI / 180) * LEG_CONECT_Y) / LEG_CONECT_X+ + FEET_Y;

const HELICOPTER_INIT_X = Math.sin(helicopterAngleY * Math.PI / 180 - Math.PI / 2.0) * AUTOMATIC_ANIMATION_RADIUS;
const HELICOPTER_INIT_Z = Math.cos(helicopterAngleY * Math.PI / 180 - Math.PI / 2.0) * AUTOMATIC_ANIMATION_RADIUS;
const HELICOPTER_INIT_Y = 0.0

let helicopterPosX = HELICOPTER_INIT_X
let helicopterPosY = HELICOPTER_INIT_Y;
let helicopterPosZ = HELICOPTER_INIT_Z;

//Buildings
let buildingsInstances = [];
const MAX_FLOOR_NUMBER = 8;
const MIN_FLOOR_NUMBER = 3;

//Domo - The little creature riding the helicopter
const DOMO_BODY_COLOR = vec3(149, 102, 73);
const DOMO_MOUTH_COLOR = vec3(228.0, 54.0, 49.0);
const DOMO_BODY_SIZE_X = 10.0;
const DOMO_BODY_SIZE_Y = 30.0;
const DOMO_BODY_SIZE_Z = 20.0

const DOMO_LEG_SIZE_X = 14.0;
const DOMO_LEG_SIZE_Y = 6.0;
const DOMO_LEG_SIZE_Z = 6.0;

//type1
const BASE_HEIGHT = 2.0;
const BASE_SIZE = 9.0;

const BUILDING_SIZE = BASE_SIZE - BASE_SIZE * 0.2;
const BUILDING_HEIGHT = 24.0;

const ROOF_HEIGHT = 4.0;
const ROOF_SIZE = BASE_SIZE;

//type2
const BUILDING_T2_LEN = 22.0;
const BUILDING_FLOOR_HIGH = 9.0;

const WINDOW_HIGH =7.0;
const WINDOW_LEN =5.0;

const N_BUILDINGS = 7.0;
let currBuilding = 0;

let seedGenerated = [];

//Colors

let BUILDING_FLOOR_BASE_COLORS = [vec3(217.0,180.0,110.0),vec3(236.0,177.0,97.0),vec3(116.0,130.0,139.0),vec3(38.0,28.0,32.0),vec3(104.0,78.0,55.0)];
let COLUMN_COLORS = [vec3(115.0,97.0,83.0),vec3(187.0,195.0,212.0),vec3(86.0,80.0,99.0),vec3(0.0,0.0,0.0),vec3(69.0,84.0,89.0)];
let WALL_COLORS = [vec3(221.0,212.0,179.0),vec3(236.0,181.0,101.0),vec3(54.0,101.0,119.0),vec3(138.0,109.0,104.0),vec3(107.0,30.0,10.0)];
let ROOF_COLORS =[vec3(153.0,134.0,121.0),vec3(248.0,155.0,115.0),vec3(89.0,159.0,161.0),vec3(178.0,154.0,132.0),vec3(16.0,73.0,54.0)];

const NIGHT_GRASS_COLOR = vec3(66.0,92.0,13.0);
const DAY_GRASS_COLOR = vec3(100.0,139.0,20.0);

const DAY_WINDOW_GLASS_COLOR = vec3(158.0,191.0,234.0);
//const NIGHT_WINDOW_GLASS_COLOR = vec3(153.0,246.0,255.0); //luz das janelas azul
const NIGHT_WINDOW_GLASS_COLOR = vec3(255.0,255.0,255.0); //luz das janelas branca

const BOX_COLOR = vec3(177, 178, 255);

const HELICE_CONECT_COLOR = vec3(255.0, 255.0, 0.0);
const HELICE_PART_COLOR = vec3(0.0, 0.0, 255.0);
const TAIL_END_COLOR = vec3(255.0, 0.0, 0.0);
const TAIL_MAIN_CONECT_COLOR = vec3(255.0, 0.0, 0.0);
const BODY_COLOR = vec3(255.0, 0.0, 0.0);
const LEG_CONECT_COLOR = vec3(255.0, 255.0, 0.0);
const FEET_END_COLOR = vec3(255.0, 255.0, 0.0);
//const NIGHT_COLOR = vec3(36, 22, 107);
const NIGHT_COLOR = vec3(11.0,17.0,29.0);
const DAY_COLOR = vec3(204.0 , 151.0 , 142.0);

let backgroundColor = DAY_COLOR;

const axonotricView = lookAt(
  [ADJUSTABLE_VARS.vp_distance, ADJUSTABLE_VARS.vp_distance, ADJUSTABLE_VARS.vp_distance],
  [0, 0, 0],
  [0, 1, 0],
);
const XZview = lookAt([0, ADJUSTABLE_VARS.vp_distance, 0], [0, 0, 0], [0, 0, 1]); //olhar de cima para baixo
const ZYview = lookAt([ADJUSTABLE_VARS.vp_distance, 0, 0], [0, 0, 0], [0, 1, 0]); //olhar do x para o centro
const XYview = lookAt([0, 0, ADJUSTABLE_VARS.vp_distance], [0, 0, 0], [0, 1, 0]); //olhar do z para o centro

let view = axonotricView;
let keys = {}; // Map that stores whether each key is pressed or not

document.getElementById("tutorialButton").addEventListener("click", showTutorial);

function showTutorial(){
  if(document.getElementById("tutorial").style.display === "none"){
    document.getElementById("tutorial").style.display = "block";
  }
  else{
    document.getElementById("tutorial").style.display = "none";
  }
}

function setup(shaders) {
  generateSeeds();
  let canvas = document.getElementById("gl-canvas");
  let aspect = canvas.width / canvas.height;

  gl = setupWebGL(canvas);

  let program = buildProgramFromSources(
    gl,
    shaders["shader.vert"],
    shaders["shader.frag"],
  );

  let mProjection = ortho(
    -ADJUSTABLE_VARS.vp_distance * aspect,
    ADJUSTABLE_VARS.vp_distance * aspect,
    -ADJUSTABLE_VARS.vp_distance,
    ADJUSTABLE_VARS.vp_distance,
    -3 * ADJUSTABLE_VARS.vp_distance,
    3 * ADJUSTABLE_VARS.vp_distance,
  );


  mode = gl.TRIANGLES;

  // GUI Controllers
  GUI.width = 260;
  const worldFolder = GUI.addFolder('World');
  const heliFolder = GUI.addFolder('Helicopter');
  const cameraFolder = GUI.addFolder('Camera');
  let vpDistanceController = worldFolder.add(ADJUSTABLE_VARS, 'vp_distance', 1.0, 500.0).name('World Scale');
  let gravityController = worldFolder.add(ADJUSTABLE_VARS, 'gravity', 2.0, 40.0).name('Gravity');
  let windResController = worldFolder.add(ADJUSTABLE_VARS, 'wind_resistance', 0.0, 50.0).name('Wind Resistance');
  let heliScaleController = heliFolder.add(ADJUSTABLE_VARS, 'helicopterScale', 1.0, 10.0).name('Helicopter Scale');
  let dayNightController = worldFolder.add(ADJUSTABLE_VARS, 'enableDayNightCycle').name('Enable Day/Night');
  let horizontalDirController = cameraFolder.add(ADJUSTABLE_VARS, 'horizontalDirection', 0, 360.0).name('Horizontal Direction');
  let verticalDirController = cameraFolder.add(ADJUSTABLE_VARS, 'verticalDirection', 0, 360.0).name('Vertical Direction');


  resize_canvas();
  window.addEventListener("resize", resize_canvas);
  document.onkeydown = function (event) {
    keys[event.key] = true;
    updatePerspectivePerMode();
  }


  window.addEventListener("keyup", (event) => {
    keys[event.key] = false; // Key no longer pressed
  });

  gl.clearColor(backgroundColor[0] / 255.0, backgroundColor[1] / 255.0, backgroundColor[2] / 255.0, 1.0); // Background cinzento
  SPHERE.init(gl);
  CYLINDER.init(gl);
  CUBE.init(gl);
  PYRAMID.init(gl);
  gl.enable(gl.DEPTH_TEST); // Enables Z-buffer depth test
  window.requestAnimationFrame(render);

  function checkKeys(){
      if(keys["w"]){
          mode = gl.LINES;
          keys["w"] = false;
        }
      if(keys["s"]){
          mode = gl.TRIANGLES;
          keys["s"] = false;
        }
      if(keys["p"]){
          animation = !animation;
          keys["p"] = false;
        }
      if(keys["+"]){
          if (animation) speed *= 1.1;
        }
      if(keys["-"]){
          if (animation) speed /= 1.1;
        }
      if(keys["1"]){
          viewMode = DEFAULT_VIEW_MODE;
          view = axonotricView;
          keys["1"] = false;
        }
      if(keys["2"]){
          viewMode = DEFAULT_VIEW_MODE;
          view = XZview;
          keys["2"] = false;
        }
      if(keys["3"]){
          viewMode = DEFAULT_VIEW_MODE;
          view = ZYview;
          keys["3"] = false;
        }
      if(keys["4"]){
          viewMode = DEFAULT_VIEW_MODE;
          view = XYview;
          keys["4"] = false;
        }
      if(keys["5"]){
          viewMode = CENTER_VIEW_MODE;
          keys["5"] = false;
        }
      if(keys["6"]){
          viewMode = FIRST_PERSON_VIEW_MODE;
          keys["6"] = false;
        }
      if(keys["7"]){
        viewMode = BOTTOM_VIEW_MODE;
        keys["7"] = false;
      }
      if(keys["8"]){
        viewMode = HELICOPTER_VIEW_MODE;
        keys["8"] = false;
      }
      if(keys["j"]){
          ADJUSTABLE_VARS.horizontalDirection += CAMERA_ANGLE_CHANGE;
        }
      if(keys["l"]){
          ADJUSTABLE_VARS.horizontalDirection -= CAMERA_ANGLE_CHANGE;
        }
      if(keys["i"]){
          if (ADJUSTABLE_VARS.verticalDirection >= -90.0) {
            ADJUSTABLE_VARS.verticalDirection -= CAMERA_ANGLE_CHANGE;
          }
        }
      if(keys["k"]){
          if (ADJUSTABLE_VARS.verticalDirection <= 90.0) {
            ADJUSTABLE_VARS.verticalDirection += CAMERA_ANGLE_CHANGE;
          }
        }
      if(keys["r"]){
          if (helicopterPosY > getFloor(helicopterPosX,helicopterPosZ) && !isAutomaticAnimation) {
            if (helicopterSpeed < HELICOPTER_MAX_SPEED) {
              helicopterSpeed+= HELICOPTER_ACCELERATION;
            }
          }
        }
      if(keys["f"]){
        if (helicopterSpeed > 0.0) {
          helicopterSpeed = helicopterSpeed - ADJUSTABLE_VARS.helicopterScale;
        }
      }
      if(keys["d"]){
          if (helicopterPosY > getFloor(helicopterPosX,helicopterPosZ) && !isAutomaticAnimation) {
            helicopterAngleY += HELICOPTER_ANGLE_CHANGE/2.0;
            if (helicopterSpeed < HELICOPTER_MAX_SPEED) {
              helicopterSpeed += 0.3 * speed * HELICOPTER_ANGLE_CHANGE *
                HELICOPTER_ANGLE_CHANGE;
            }
          }
        }

      if(keys["g"]){
          if (helicopterPosY > getFloor(helicopterPosX,helicopterPosZ) && !isAutomaticAnimation) {
            helicopterAngleY -= HELICOPTER_ANGLE_CHANGE/2.0;
            if (helicopterSpeed < HELICOPTER_MAX_SPEED) {
              helicopterSpeed += 0.3 * speed * HELICOPTER_ANGLE_CHANGE *
                HELICOPTER_ANGLE_CHANGE;
            }
          }
        }

      if(keys["ArrowUp"]){
          if (heliceSpeed < HELICE_FLYING_SPEED) {
            heliceSpeed += 50.0;
          } else {
            let newY = helicopterPosY + 0.2;
            if(isWithinWorldLimit(helicopterPosX,newY,helicopterPosZ)){
              helicopterPosY = newY;
            }  
          }
        }
      if(keys["ArrowDown"]){
          let floorLevel = getFloor(helicopterPosX,helicopterPosZ);
          let newY = helicopterPosY - 0.2;
          if (isWithinWorldLimit(helicopterPosX,newY,helicopterPosZ)) {
            helicopterPosY = newY;
          } else {
            helicopterPosY = floorLevel;
          }
          }
      if(keys["ArrowLeft"]){
        if(isAutomaticAnimation && helicopterPosY != getFloor(helicopterPosX,helicopterPosZ)){
          if (
          helicopterSpeed + HELICOPTER_ACCELERATION < HELICOPTER_MAX_SPEED
        ) {
          helicopterSpeed += HELICOPTER_ACCELERATION;
        }
          else{
            helicopterSpeed = HELICOPTER_MAX_SPEED;
          }
        }
        }
      if(keys["q"]){
          ADJUSTABLE_VARS.vp_distance--;
          keys["q"] = false;
        }
      if(keys["a"]){
          ADJUSTABLE_VARS.vp_distance++;
          keys["a"] = false;
        }
      if(keys["z"]){
          //Troca o tipo de animacao para manual/automatica
          isAutomaticAnimation = !isAutomaticAnimation;
          hasToRestart = true;
          keys["z"] = false;
        }
      if(keys[" "]){
        if(crateInstances.length<=MAX_CRATE_NUM && isCrateAlowed()){
          spawnCrate();}
          keys[" "] = false;
        }
      if(keys["m"]){
          generateSeeds();
          keys["m"] = false;
        }
  }

  function updatePerspectivePerMode(){
    switch(viewMode){
      case BOTTOM_VIEW_MODE:
        break;
      case FIRST_PERSON_VIEW_MODE:
        updateFirstPerson();
        break;
      case CENTER_VIEW_MODE:
          
      case DEFAULT_VIEW_MODE:
      case HELICOPTER_VIEW_MODE:
        mProjection = ortho(
          -ADJUSTABLE_VARS.vp_distance * aspect,
          ADJUSTABLE_VARS.vp_distance * aspect,
          -ADJUSTABLE_VARS.vp_distance,
          ADJUSTABLE_VARS.vp_distance,
          -3 * ADJUSTABLE_VARS.vp_distance,
          3 * ADJUSTABLE_VARS.vp_distance,
        );
        break;
      default:
    }
  }

  function getEndPosCrate(posX,posY,posZ,crateSpeed,angle){
    let crateFloorTime = posY/(ADJUSTABLE_VARS.gravity);
    let accCalcule = ADJUSTABLE_VARS.wind_resistance*crateFloorTime;
    let crateEndX = posX + (crateSpeed-accCalcule)*-Math.cos((angle+90.0)*Math.PI/180.0);
    let crateEndZ = posZ + (crateSpeed-accCalcule)*Math.sin((angle+90.0)*Math.PI/180.0);
    return vec2(crateEndX,crateEndZ);
  }

  function getEndPosCrateV2(){
    let crate ={
      posX: helicopterPosX,
      posY: helicopterPosY,
      posZ: helicopterPosZ,
      startTime: time,
      speed: helicopterSpeed,
      speedY: 0.0,
      angle: helicopterAngleY,
    };
    let endPos = vec3(WORLD_X_UPPER_LIMIT,WORLD_Y_UPPER_LIMIT,WORLD_Z_UPPER_LIMIT);
    while(endPos[1]!=getFloor(endPos[0],endPos[2])){
      endPos = moveCrate(crate);
    }
    return vec2(endPos[0],endPos[2]);
  }

  function resize_canvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);

    updatePerspectivePerMode();
  }

  function uploadModelView() {
    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "mModelView"),
      false,
      flatten(modelView()),
    );
  }

  function restartHelicopter() {
    helicopterSpeed = 0.0;
    helicopterAngleY = 0.0;
    helicopterPosX = HELICOPTER_INIT_X;
    helicopterPosY = HELICOPTER_INIT_Y;
    helicopterPosZ = HELICOPTER_INIT_Z;

    heliceSpeed = 0;
  }

  function updateFirstPerson(){
     mProjection = perspective(
      90.0,
      aspect,
      BODY_SIZE_Z,
      3*ADJUSTABLE_VARS.vp_distance,
    );
  }

  function getFloor(x,z){
    let ret = 0.0;
    let isXInside = false;
    let isZInside = false;
    for (let buildingObj of buildingsInstances){
      isXInside = buildingObj.posX + buildingObj.varX/2.0>x && buildingObj.posX - buildingObj.varX/2.0<x;
      isZInside = buildingObj.posZ + buildingObj.varZ/2.0>z && buildingObj.posZ - buildingObj.varZ/2.0<z;

        if(isXInside && isZInside){
          ret = Math.max(ret,buildingObj.varY);
        }
    }

    return ret;
  }

  function isCrateAlowed(){
    let endCrate = getEndPosCrateV2(helicopterPosX,helicopterPosY,helicopterPosZ,helicopterSpeed,helicopterAngleY);
    for (let i = 0; i<crateInstances.length;i++){ 
      let crateObj = crateInstances[i];
      let isXInside = crateObj.endPosX + CRATE_SIZE>endCrate[0] && crateObj.endPosX - CRATE_SIZE<endCrate[0];
      let isZInside = crateObj.endPosZ + CRATE_SIZE>endCrate[1] && crateObj.endPosZ - CRATE_SIZE<endCrate[1];

      console.log(crateObj.endPosZ);
        if(isXInside && isZInside){
          return false;
        }
    }
    return true;
  }

  function isWithinWorldLimit(x, y, z) {
    let isWithinX = x <= WORLD_X_UPPER_LIMIT && x >= WORLD_X_LOWER_LIMIT;
    let isWithinY = y <= WORLD_Y_UPPER_LIMIT && y >= getFloor(x,z);
    let isWithinZ = z <= WORLD_Z_UPPER_LIMIT && z >= WORLD_Z_LOWER_LIMIT;
    return isWithinX && isWithinY && isWithinZ;
  }

  function generateSeeds(){
    restartHelicopter();
    seedGenerated = [];
    for(let i = 0; i<N_BUILDINGS;i++){
    seedGenerated.push({
      nFloors: Math.floor(Math.random()* (MAX_FLOOR_NUMBER-MIN_FLOOR_NUMBER) + MIN_FLOOR_NUMBER),
      floorColor: Math.floor(Math.random() * BUILDING_FLOOR_BASE_COLORS.length),
      columnColor: Math.floor(Math.random() * COLUMN_COLORS.length),
      wallColor: Math.floor(Math.random() * WALL_COLORS.length),
      roofColor: Math.floor(Math.random() * ROOF_COLORS.length),
    });}

  }

  function addBuildingInstance(posXB,posYB,posZB,varXB,varYB,varZB){
    buildingsInstances.push({
      posX: posXB,
      posY: posYB,
      posZ: posZB,
      varX: varXB,
      varY: varYB,
      varZ: varZB,
  });

  }

  function spawnCrate() {
    if(getFloor(helicopterPosX, helicopterPosZ) < helicopterPosY){
      let endPos = getEndPosCrateV2(helicopterPosX,helicopterPosY,helicopterPosZ,helicopterSpeed,helicopterAngleY);
      crateInstances.push({
        endPosX: endPos[0],
        endPosZ:endPos[1],
        posX: helicopterPosX,
        posY: helicopterPosY,
        posZ: helicopterPosZ,
        startTime: time,
        speed: helicopterSpeed,
        speedY: 0.0,
        angle: helicopterAngleY,
      });
    } 
  }

  function Sun(){
    multScale([10.0, 10.0, 10.0]);
    selectColor(vec3(249.0, 201.0, 76.0));
    uploadModelView();
    SPHERE.draw(gl, program, mode);
  }

  /*
    Este método desenha uma das partes moviveis da helice
  */
  function helicePart() {
    selectColor(HELICE_PART_COLOR);
    multScale([HELICE_SIZE_X, HELICE_SIZE_Y, HELICE_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }
  /*
    Este método desenha o cilindro que conecta as partes moviveis da helice ao body.
  */
  function heliceConect() {
        selectColor(HELICE_CONECT_COLOR);
    multScale([
      HELICE_CONECT_DIAMETER,
      HELICE_CONECT_HIGH,
      HELICE_CONECT_DIAMETER,
    ]);

    uploadModelView();

    CYLINDER.draw(gl, program, mode);
  }
  /*
    Este método desenha todas as partes de helice, calculando a sua velocidade
  */
  function rotHelice() {
    for (let i = 0; i < 360; i += 360 / HELICE_NUM) {
      pushMatrix();
      multRotationY(heliceSpeed * time + i);
      multTranslation([HELICE_DIAMETER / 2.0, 0, 0]);
      helicePart();
      popMatrix();
    }
  }
  /*
    Este método cria uma helice inteira
  */
  function helice() {
    pushMatrix();
    heliceConect();
    popMatrix();
    pushMatrix();
    rotHelice();
    popMatrix();
  }

  /*
    Este método cria o obejto que conecta a cauda (zona da helice) do helicoptero e o body
  */
  function tailConnector() {
    selectColor(TAIL_MAIN_CONECT_COLOR);
    multScale([TAIL_MAIN_SIZE_X, TAIL_MAIN_SIZE_Y, TAIL_MAIN_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }
  /*
    Este método cria a cauda do helicoptero/zona onde está situada a helice mais pequena
  */
  function tailEnd() {
    selectColor(TAIL_END_COLOR);
    multScale([TAIL_END_SIZE_X, TAIL_END_SIZE_Y, TAIL_END_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }
  /*
    Este método desenha a ponta da cauda, ou seja, a helice pequena e o seu apoio
  */
  function tailTip() {
    pushMatrix();
      multRotationX(-20);
      tailEnd();
    popMatrix();
    pushMatrix();
      multTranslation([(TAIL_END_SIZE_X + HELICE_CONECT_DIAMETER) / 2, 0, 0]);
      multRotationZ(90);
      multScale([0.3, 0.3, 0.3]);
      helice();
    popMatrix();
  }

  /*
    Este método desenha a cauda completa
  */
  function tail() {
    pushMatrix();
      tailConnector();
    popMatrix();
    pushMatrix();
      multTranslation([0, TAIL_MAIN_SIZE_Y / 2.0, -TAIL_MAIN_SIZE_Z / 2.0]);
      tailTip();
    popMatrix();
  }

  /*
    Este método desenha o body do helicoptero
  */
  function body() {
    multScale([BODY_SIZE_X, BODY_SIZE_Y, BODY_SIZE_Z]);

    selectColor(BODY_COLOR);
    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

  /*
    Este desenho desenha uma das quatro pernas laterais do helicoptero
  */

  function legConect() {
    selectColor(LEG_CONECT_COLOR);
    multRotationZ(LEG_ANGLE_Z);
    multRotationY(LEG_ANGLE_Y);

    multScale([LEG_CONECT_X, LEG_CONECT_Y, LEG_CONECT_Z]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  /*
    Este método desenha o pé, ou seja, a zona mais abaixo do helicoptero
  */
  function feetEnd() {
    selectColor(FEET_END_COLOR);
    multScale([FEET_X, FEET_Y, FEET_Z]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  /*
    Este método desenha uma perna + pé (são duas pernas, basicamente, mas que seguram um unico pé)
  */
  function oneLeg() {
    pushMatrix();
    multTranslation([0.0, 0.0, BODY_SIZE_Z / 4]);
    legConect();
    popMatrix();
    pushMatrix();
    multScale([1.0, 1.0, -1.0]);
    multTranslation([0.0, 0.0, BODY_SIZE_Z / 4]);
    legConect();
    popMatrix();
    pushMatrix();
    multTranslation([
      Math.sin(LEG_ANGLE_Z * Math.PI / 180) * LEG_CONECT_X + FEET_X / 2,
      -(Math.cos(LEG_ANGLE_Y * Math.PI / 180) * LEG_CONECT_Y + FEET_Y),
      0.0,
    ]);
    feetEnd();
    popMatrix();
  }

  /*
      Desenha toda a zona inferior do helicoptero, incluindo 4 pernas e dois pés
  */

  function feet() {
    pushMatrix();
    multTranslation([-BODY_SIZE_X / 4.0, 0.0, 0.0]);
    oneLeg();
    popMatrix();
    pushMatrix();
    multTranslation([BODY_SIZE_X / 4.0, 0.0, 0.0]);
    multScale([-1, 1, 1]);
    oneLeg();
    popMatrix();
  }

  /*
    Desenha o helicoptero inteiro
  */

  function helicopter() {
    pushMatrix();
    body();
    popMatrix();
    pushMatrix();
    multTranslation([0, BODY_SIZE_Y / 2.0 + HELICE_CONECT_HIGH / 2.0, 0.0]);
    helice();
    popMatrix();
    pushMatrix();
    multTranslation([
      0,
      BODY_SIZE_Y / 4.0,
      -(BODY_SIZE_Z + TAIL_MAIN_SIZE_Z) / 2.5,
    ]);
    tail();
    popMatrix();
    pushMatrix();
    multScale([1,1,1].map((x)=>x ));
    multTranslation([
      0,
      -(BODY_SIZE_Y / 2.0 +
        (Math.cos(LEG_ANGLE_Y * Math.PI / 180) * LEG_CONECT_Y + FEET_Y) / LEG_CONECT_X),
      0.0,
    ]);
    feet();
    popMatrix();
    pushMatrix();
      multScale([0.15, 0.15, 0.15].map((x) => x * ADJUSTABLE_VARS.helicopterScale));
      multRotationY(-90);
      multTranslation([0.0, 27.0, 0.0]);
      domo();
    popMatrix();
  }
  // Usar isto antes de uma chamada draw() para mudar a cor
  function selectColor(color){
    let floorColor = vec3(color[0] / 255.0, color[1] / 255.0, color[2] / 255.0);
    const uColor = gl.getUniformLocation(program, "uColor");
    const uLightAngle = gl.getUniformLocation(program,"uLightAngle");
    gl.useProgram(program);
    gl.uniform1f(uLightAngle,sunAngle%360);
    gl.uniform3fv(uColor, flatten(floorColor));
  }

  /*
  Desenha o chão
  */
  function floor(floorColor) {
    selectColor(floorColor);
    multScale([WORLD_X_UPPER_LIMIT * 2.0, 1.0, WORLD_Z_UPPER_LIMIT * 2.0]);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }

  function centerSphere() {
    multScale([CENTER_SPHERE_SIZE, CENTER_SPHERE_SIZE, CENTER_SPHERE_SIZE]);
    selectColor(vec3(255.0, 0.0, 0.0));
    uploadModelView();
    SPHERE.draw(gl, program, mode);
  }

  function crate() {
    multScale([CRATE_SIZE, CRATE_SIZE, CRATE_SIZE]);
    selectColor(BOX_COLOR);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }

  /*
    Desenha o mundo
  */
  function isNightTime(){
    return sunAngle % 360.0 > 20.0 && sunAngle % 360.0 < 180.0 && ADJUSTABLE_VARS.enableDayNightCycle;
  }

  function world() {
    pushMatrix();
      multTranslation([0.0, -1.0, 0.0]);
      if(isNightTime()){
      floor(NIGHT_GRASS_COLOR);}
      else{
        floor(DAY_GRASS_COLOR);
      }
    popMatrix();
    pushMatrix();
      multTranslation([-20.0, 0.0, -20.0]);
      building();
    popMatrix();
    pushMatrix();
      addBuilding(-80.0, BUILDING_FLOOR_HIGH / 2.0, -80.0);
    popMatrix();
    pushMatrix();
      addBuilding(-80.0, BUILDING_FLOOR_HIGH / 2.0, 80.0);
    popMatrix();
    pushMatrix();
      addBuilding(80.0, BUILDING_FLOOR_HIGH / 2.0, -80.0);
    popMatrix();
    pushMatrix();
      addBuilding(80.0, BUILDING_FLOOR_HIGH / 2.0, 80.0);
    popMatrix();
    pushMatrix();
      addBuilding(10.0, BUILDING_FLOOR_HIGH / 2.0, -80.0);
    popMatrix();
    pushMatrix();
      addBuilding(28.0, BUILDING_FLOOR_HIGH / 2.0, 80.0);
    popMatrix();
    pushMatrix();
      addBuilding(-80.0,BUILDING_FLOOR_HIGH/2.0,-30.0); 
    popMatrix();
    currBuilding=0;

    pushMatrix();
      multTranslation([helicopterPosX, helicopterPosY, helicopterPosZ]);
      if(animation){
      helicopterStillAnimation();
      helicopterFlight();
      }
      multRotationY(helicopterAngleY);
      multRotationX(
        HELICOPTER_MAX_ATTACK_ANGLE * (helicopterSpeed / HELICOPTER_MAX_SPEED),
      );
      helicopter();
    popMatrix();
    pushMatrix();
    multRotationZ(sunAngle);
    multTranslation([-2*WORLD_Y_UPPER_LIMIT,0.0,0.0]);
    if(animation){
      if(ADJUSTABLE_VARS.enableDayNightCycle){
        sunAngle+=10.0*speed;
      }
      else{
        sunAngle = -90.0;
      }
    }
    if(isNightTime()){
      gl.clearColor(NIGHT_COLOR[0] / 255.0, NIGHT_COLOR[1] / 255.0, NIGHT_COLOR[2] / 255.0, 1.0); 
    }
    else{
      gl.clearColor(DAY_COLOR[0] / 255.0, DAY_COLOR[1] / 255.0, DAY_COLOR[2] / 255.0, 1.0); 
    }
    Sun();
    popMatrix();
    //pushMatrix();
    //centerSphere();
    //popMatrix();
    for (let crateObj of crateInstances) {
      pushMatrix();
      if(animation){
      moveCrate(crateObj);
      }
      multTranslation([crateObj.posX, crateObj.posY +CRATE_SIZE/2.0, crateObj.posZ]);
      crate();
      popMatrix();
    }
  }

  function addBuilding(x,y,z){
    let currSeed = seedGenerated[currBuilding];
    multTranslation([x,y-0.5,z]);
    buildingType1(currSeed.nFloors,BUILDING_FLOOR_BASE_COLORS[currSeed.floorColor],ROOF_COLORS[currSeed.roofColor],WALL_COLORS[currSeed.wallColor],COLUMN_COLORS[currSeed.columnColor]);
    currBuilding++;
    addBuildingInstance(x,y,z,BUILDING_T2_LEN+1.5+BODY_SIZE_X,currSeed.nFloors*BUILDING_FLOOR_HIGH+1.0,BUILDING_T2_LEN+1.5+BODY_SIZE_Z);
    
  }

  function base() {
    multScale([BASE_SIZE, BASE_HEIGHT, BASE_SIZE]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  function buildingBody() {
    multScale([BUILDING_SIZE, BUILDING_HEIGHT, BUILDING_SIZE]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  function buildingRoof() {
    multScale([ROOF_SIZE, ROOF_HEIGHT, ROOF_SIZE]);

    uploadModelView();

    PYRAMID.draw(gl, program, mode);
  }

  function building() {
    pushMatrix();
    selectColor(vec3(243.0, 156.0, 107.0));
    base();
    popMatrix();
    pushMatrix();
    multTranslation([0, BUILDING_HEIGHT / 2, 0]);
    selectColor(vec3(255.0, 56.0, 100.0));
    buildingBody();
    popMatrix();
    pushMatrix();
    multTranslation([0, BUILDING_HEIGHT + BASE_HEIGHT, 0]);
    selectColor(vec3(38.0, 20.0, 71.0));
    buildingRoof();
    popMatrix();
  }

  function buildingFloorBase(floorColor) {
    selectColor(floorColor);
    multScale([BUILDING_T2_LEN, BUILDING_FLOOR_HIGH, BUILDING_T2_LEN]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  function columnType1(columnColor) {
    selectColor(columnColor);
    multScale([0.8, BUILDING_FLOOR_HIGH, 0.5]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  function wallExtraType1(wallColor) {
    selectColor(wallColor);
    multScale([BUILDING_T2_LEN, 1.0, 0.3]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  function buildingFloorType1(floorColor,columnColor) {
    pushMatrix();
    buildingFloorBase(floorColor);
    popMatrix();
    pushMatrix();
    multTranslation([BUILDING_T2_LEN / 2.0, 0.0, BUILDING_T2_LEN / 2.0]);
    columnType1(columnColor);
    popMatrix();
    pushMatrix();
    multTranslation([-BUILDING_T2_LEN / 2.0, 0.0, -BUILDING_T2_LEN / 2.0]);
    columnType1(columnColor);
    popMatrix();
    pushMatrix();
    multTranslation([BUILDING_T2_LEN / 2.0, 0.0, -BUILDING_T2_LEN / 2.0]);
    columnType1(columnColor);
    popMatrix();
    pushMatrix();
    multTranslation([-BUILDING_T2_LEN / 2.0, 0.0, BUILDING_T2_LEN / 2.0]);
    columnType1(columnColor);
    popMatrix();
  }

  function buildingFloorType2(floorColor,wallColor,columnColor) {
    pushMatrix();
    buildingFloorType1(floorColor,columnColor);
    popMatrix();
    for (let i = 0; i < 360; i += 90) {
      pushMatrix();
      multRotationY(i);
      multTranslation([0.0, BUILDING_FLOOR_HIGH / 2.0, BUILDING_T2_LEN / 2.0]);
      wallExtraType1(wallColor);
      popMatrix();
    }
  }

  function windowConstructType1() {
    for (let i = 0; i < 3; i++) {
      pushMatrix();
      multTranslation([i * BUILDING_T2_LEN / 3.0 + WINDOW_LEN/6.0, 0.0, BUILDING_T2_LEN / 2.0]);
      multScale([0.7, 0.7, 0.7]);
      windowGlass();
      popMatrix();
    }
  }

  function windowConstructType2() {
    for (let i = 0; i < 2; i++) {
      pushMatrix();
      multTranslation([i * BUILDING_T2_LEN / 2.0 +WINDOW_LEN/4.0, 0.0, BUILDING_T2_LEN / 2.0]);
      multScale([0.7, 0.7, 0.7]);
      windowCompleteType2();
      popMatrix();
    }
  }


  function completeFloorType1(floorColor,columnColor) {
    pushMatrix();
    buildingFloorType1(floorColor,columnColor);
    popMatrix();
    for (let i = 0; i < 360; i += 90) {
      pushMatrix();
      multRotationY(i);
      multTranslation([-(BUILDING_T2_LEN / 2.0 - 2.5), 0.0, 0.0]);
      windowConstructType1();
      popMatrix();
    }
  }
  function completeFloorType2(floorColor,columnColor) {
    pushMatrix();
    buildingFloorType1(floorColor,columnColor);
    popMatrix();
    for (let i = 0; i < 360; i += 90) {
      pushMatrix();
      multRotationY(i);
      multTranslation([-(BUILDING_T2_LEN / 2.0 - 2.5), 0.0, 0.0]);
      windowConstructType2();
      popMatrix();
    }
  }

  function completeFloorType3(floorColor,wallColor,columnColor) {
    pushMatrix();
    buildingFloorType2(floorColor,wallColor,columnColor);
    popMatrix();
    for (let i = 0; i < 360; i += 90) {
      pushMatrix();
      multRotationY(i);
      multTranslation([-(BUILDING_T2_LEN / 2.0 - 2.5), 0.0, 0.0]);
      windowConstructType1();
      popMatrix();
    }
  }
  function roofType1(roofColor) {
    
    pushMatrix();
    roofPartType1(roofColor);
    popMatrix();
    pushMatrix();
    multTranslation([0, 0.7 / 2.0, 0]);
    multScale([0.9, 1.0, 0.9]);
    roofPartType1(roofColor);
    popMatrix();
  }

  function roofPartType1(roofColor) {
    selectColor(roofColor)
    multScale([BUILDING_T2_LEN + 1.5, 0.7, BUILDING_T2_LEN + 1.5]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }


  function windowGlass(){
    if(isNightTime()){
    selectColor(NIGHT_WINDOW_GLASS_COLOR);
    }else{
      selectColor(DAY_WINDOW_GLASS_COLOR);
    }
    multScale([WINDOW_LEN,WINDOW_HIGH,0.1]);

    uploadModelView();

    CUBE.draw(gl,program,mode);
  }

  function windowCompleteType2() {
    pushMatrix();
    windowGlass();
    popMatrix();
    pushMatrix();
    multTranslation([5 + 0.5, 0.0, 0.0]);
    windowGlass();
    popMatrix();
  }


  function buildingType1(nFloors,floorColor,roofColor,wallColor,columnColor) {
    for (let i = 0; i < nFloors; i++) {
      pushMatrix();
      multTranslation([0.0, BUILDING_FLOOR_HIGH * i, 0.0]);
      if (i % 4 == 0) {
        selectColor(vec3(38.0, 20.0, 71.0));
        completeFloorType3(floorColor,wallColor,columnColor);
      } else {
        if (i % 3 == 0) {
          completeFloorType2(floorColor,columnColor);
        } else {
          completeFloorType1(floorColor,columnColor);}

      }
      popMatrix();
    }
    pushMatrix();
    multTranslation([
      0.0,
      BUILDING_FLOOR_HIGH * nFloors + 0.25 - BUILDING_FLOOR_HIGH / 2.0,
      0.0,
    ]);
    roofType1(roofColor);
    popMatrix();
  }

  function domoBody(){
    selectColor(DOMO_BODY_COLOR);
    multScale([DOMO_BODY_SIZE_X, DOMO_BODY_SIZE_Y, DOMO_BODY_SIZE_Z]);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }

  function domoLeg(){
    selectColor(DOMO_BODY_COLOR);
    multScale([DOMO_LEG_SIZE_X, DOMO_LEG_SIZE_Y, DOMO_LEG_SIZE_Z]);
    multRotationY(Math.PI / 2);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }

  function domoMouth(){
    selectColor(DOMO_MOUTH_COLOR);
    multScale([1.0, 6.0, DOMO_BODY_SIZE_Z / 2]);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }

  function domoEye(){
    selectColor(vec3(0.0, 0.0, 0.0));
    multScale([2.5, 2.5, 2.5]);
    uploadModelView();
    SPHERE.draw(gl, program, mode);
  }

  function domoTooth(){
    selectColor(vec3(255.0, 255.0, 255.0));
    multScale([2.0, 2.0, 2.0]);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }


  function domo(){
    pushMatrix();
      domoBody();
    popMatrix();
    pushMatrix();
      multTranslation([DOMO_BODY_SIZE_X / 2, -DOMO_BODY_SIZE_Y / 2 + 6.0 / 2, DOMO_LEG_SIZE_Z]);
      domoLeg();
    popMatrix();
    pushMatrix();
      multTranslation([DOMO_BODY_SIZE_X / 2, -DOMO_BODY_SIZE_Y / 2 + 6.0 / 2, -DOMO_LEG_SIZE_Z]);
      domoLeg();
    popMatrix();
    pushMatrix();
      multTranslation([DOMO_BODY_SIZE_X / 2, 1.0, 0.0])
      domoMouth();
    popMatrix();
    pushMatrix();
      multTranslation([DOMO_BODY_SIZE_X / 2, DOMO_BODY_SIZE_Y / 3, -BODY_SIZE_Z / 1.5 / ADJUSTABLE_VARS.helicopterScale]);
      domoEye();
    popMatrix();
    pushMatrix();
      multTranslation([DOMO_BODY_SIZE_X / 2, DOMO_BODY_SIZE_Y / 3, BODY_SIZE_Z / 1.5 / ADJUSTABLE_VARS.helicopterScale]);
      domoEye();
    popMatrix();
    for(let i = 0; i < 3; i++){
      pushMatrix();
        multTranslation([DOMO_BODY_SIZE_X / 2, -0.5, BODY_SIZE_Z / 1.5 / ADJUSTABLE_VARS.helicopterScale - 2.0 * i * 2 + 0.5 ]);
        domoTooth();
      popMatrix();
    }
    for(let i = 0; i < 3; i++){
      pushMatrix();
        multTranslation([DOMO_BODY_SIZE_X / 2, 3.0, BODY_SIZE_Z / 1.5 / ADJUSTABLE_VARS.helicopterScale - 2.0 * i * 2 + 0.5 ]);
        domoTooth();
      popMatrix();
    }
  }

  function helicopterStillAnimation() {
    let isMovable = isWithinWorldLimit(helicopterPosX, helicopterPosY, helicopterPosZ) &&
    helicopterPosY != getFloor(helicopterPosX,helicopterPosZ);
    if (isMovable) {
      let toAddAnimation = Math.sin(time * Math.PI) / 80.0;
      if(isWithinWorldLimit(helicopterPosX,helicopterPosY+toAddAnimation,helicopterPosZ)){
        helicopterPosY += toAddAnimation;
      }
      multRotationZ(ADJUSTABLE_VARS.wind_resistance/30.0 * Math.sin(time * Math.PI));
    }
    multTranslation([0, HELICOPTER_BOTTOM_TO_CENTER, 0]);
    if(isMovable){
      multRotationZ(Math.sin(time * Math.PI));
    }
    
  }

  function helicopterFlight() {
    if (isAutomaticAnimation && helicopterPosY != getFloor(helicopterPosX,helicopterPosY)) {
      helicopterAutomaticCalcule();
    }else{
      helicopterPosCalcule();
    }
    helicopterSpeedCalcule();
  }
  /**
   * Este método tem de ser obrigatoriamente feito (e não rodamos apenas o helicoptero no angulo dele) uma vez que temos
   * de saber se ele vai colidir com um edificio. 
   */

  function helicopterAutomaticCalcule() {
    let newAngle = helicopterAngleY;
    if (helicopterSpeed > 0) {
      newAngle += 180.0*helicopterSpeed*speed/(AUTOMATIC_ANIMATION_RADIUS*Math.PI);
    }
    let newX = Math.sin(newAngle * Math.PI / 180 - Math.PI / 2.0) * AUTOMATIC_ANIMATION_RADIUS;
    let newZ = Math.cos(newAngle * Math.PI / 180 - Math.PI / 2.0) * AUTOMATIC_ANIMATION_RADIUS;
    if(isWithinWorldLimit(newX,helicopterPosY,newZ)){
    helicopterPosX = newX;
    helicopterPosZ = newZ;
    helicopterAngleY = newAngle;
  }
}

  function helicopterSpeedCalcule() {
    if (helicopterPosY <= getFloor(helicopterPosX,helicopterPosZ)) {
      heliceSpeed -= heliceSpeed / 70.0;
      if (heliceSpeed < 0.03) {
        heliceSpeed = 0.0;
      }
    }
    let toAddSpeed = - ADJUSTABLE_VARS.wind_resistance*speed;
    if (helicopterSpeed + toAddSpeed >= 0.0) {
      helicopterSpeed += toAddSpeed;
    } else {
      helicopterSpeed = 0.0;
    }
  }

  function helicopterPosCalcule() {
    let toAddZ = helicopterSpeed * speed *
      Math.cos(helicopterAngleY * Math.PI / 180);
    if (
      isWithinWorldLimit(
        helicopterPosX,
        helicopterPosY,
        helicopterPosZ + toAddZ,
      )
    ) {
      helicopterPosZ += toAddZ;
    }

    let toAddX = helicopterSpeed * speed *
      Math.sin(helicopterAngleY * Math.PI / 180);
    if (
      isWithinWorldLimit(
        helicopterPosX + toAddX,
        helicopterPosY,
        helicopterPosZ,
      )
    ) {
      helicopterPosX += toAddX;
    }
    if(heliceSpeed == 0.0){
      helicopterPosY = getFloor(helicopterPosX,helicopterPosZ)
    }
  }

  function moveCrate(crate) {
    //Perguntar ao professor se quer que ela fique com velocidade negativa (se fica para trás)
    let toAddSpeed = (ADJUSTABLE_VARS.wind_resistance*3.0)*speed;
    if(crate.speed- toAddSpeed>0.0){
    crate.speed -= toAddSpeed
  }
    crate.speedY -= ADJUSTABLE_VARS.gravity*10.0*speed;
    
    let newX = crate.posX + crate.speed * Math.sin((crate.angle)*Math.PI/180.0)*speed;

    let newZ = crate.posZ + crate.speed * Math.cos((crate.angle)*Math.PI/180.0)*speed;

    let newY = crate.posY + crate.speedY*speed;

    let floor = getFloor(newX,newZ);
    if(crate.posY != getFloor(crate.posX,crate.posZ) && crate.posY != WORLD_Y_LOWER_LIMIT){
    if(isWithinWorldLimit(newX,crate.posY,crate.posZ)){
      crate.posX = newX;
    }
    if(isWithinWorldLimit(newX,crate.posY,newZ)){
      crate.posZ = newZ;
    }
    if(isWithinWorldLimit(newX,newY,newZ) || (floor>crate.posY)){
      if(newY>WORLD_Y_LOWER_LIMIT){
        console.log("Passou-Maior do que o limite");
        crate.posY = newY;
      }else{
        console.log("Passou-Menor do que o limite");
        crate.posY = WORLD_Y_LOWER_LIMIT;
      }
    }else{
      console.log("Não passou");
      crate.posY = floor;
    }

  }
    if (time - crate.startTime > CRATE_DESPAWN_TIME) {
      crateInstances.splice(crateInstances.indexOf(crate), 1);
    }

    return vec3(crate.posX,crate.posY,crate.posZ);
  }

  function updateHelicopterSize(){
     BODY_DIAMETER = 5.0 * ADJUSTABLE_VARS.helicopterScale;
     BODY_SIZE_X = BODY_DIAMETER * 1.0 / 3.0;
     BODY_SIZE_Y = BODY_DIAMETER * 1.0 / 2.2;
     BODY_SIZE_Z = BODY_DIAMETER * 1.0;

     HELICE_DIAMETER = 4 * ADJUSTABLE_VARS.helicopterScale;
     HELICE_SIZE_X = HELICE_DIAMETER * 1.0;
     HELICE_SIZE_Y = HELICE_DIAMETER * 1.0 / 30.0;
     HELICE_SIZE_Z = HELICE_DIAMETER * 1.0 / 8.0;

     TAIL_MAIN_CONECT_DIAMETER = 4.0 * ADJUSTABLE_VARS.helicopterScale;
     TAIL_MAIN_SIZE_X = TAIL_MAIN_CONECT_DIAMETER * 1.0 / 18.0;
     TAIL_MAIN_SIZE_Y = TAIL_MAIN_CONECT_DIAMETER * 1.0 / 8.0;
     TAIL_MAIN_SIZE_Z = TAIL_MAIN_CONECT_DIAMETER * 1.0;

     TAIL_END_DIAMETER = 1 * ADJUSTABLE_VARS.helicopterScale;
     TAIL_END_SIZE_X = TAIL_END_DIAMETER * 1.0 / 13.0;
     TAIL_END_SIZE_Y = TAIL_END_DIAMETER * 1.0;
     TAIL_END_SIZE_Z = TAIL_END_DIAMETER * 1.0 / 1.8;
    
     HELICE_CONECT_DIAMETER = 0.3 * ADJUSTABLE_VARS.helicopterScale;
     HELICE_CONECT_HIGH = 0.5 * ADJUSTABLE_VARS.helicopterScale;

     FEET_X = 1 / 4 * ADJUSTABLE_VARS.helicopterScale;
     FEET_Y = 1 / 4 * ADJUSTABLE_VARS.helicopterScale;
     FEET_Z = BODY_SIZE_Z;

     LEG_CONECT_X = 1.2 * ADJUSTABLE_VARS.helicopterScale;
     LEG_CONECT_Y = 1 / 7 * ADJUSTABLE_VARS.helicopterScale;
     LEG_CONECT_Z = 1 / 4 * ADJUSTABLE_VARS.helicopterScale;
 
     HELICOPTER_BOTTOM_TO_CENTER = BODY_SIZE_Y / 2.0 + (Math.cos(LEG_ANGLE_Y * Math.PI / 180) * LEG_CONECT_Y) / LEG_CONECT_X+ + FEET_Y;
  
    }

  function updateHelicopterMovement(){
    HELICOPTER_ACCELERATION = ADJUSTABLE_VARS.wind_resistance/10.0;
  }

  function render() {
    console.log(helicopterSpeed);
    updatePerspectivePerMode();
    if (animation) time += speed;
    window.requestAnimationFrame(render);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "mProjection"),
      false,
      flatten(mProjection),
    );

    let cameraHigh = helicopterPosY+BODY_SIZE_Y+LEG_CONECT_Y+FEET_Y+HELICE_CONECT_HIGH+1.5;
    switch(viewMode){
      case CENTER_VIEW_MODE: 
        view = lookAt([0, 0, 0], [0.0,0.0,1.0], [0, 1, 0]);     
        view = mult(mult(view,rotate(ADJUSTABLE_VARS.verticalDirection,[1,0,0])), rotate(ADJUSTABLE_VARS.horizontalDirection,[0,1,0]));
        break;
      case FIRST_PERSON_VIEW_MODE:
      case HELICOPTER_VIEW_MODE:
        view = lookAt([helicopterPosX, cameraHigh, helicopterPosZ], [helicopterPosX,cameraHigh,helicopterPosZ +1.0,], [0, 1, 0]);
        let rotY = rotateY(-helicopterAngleY);
        view = mult(rotY,view);
      break;
      case BOTTOM_VIEW_MODE:
        view = lookAt([helicopterPosX, helicopterPosY, helicopterPosZ], [helicopterPosX, 0.0, helicopterPosZ], [1, 0, 0]);
        let rotX = rotateZ(-helicopterAngleY + 90.0);
        view = mult(rotX, view);
      break;
    }

    if (hasToRestart) {
      restartHelicopter();
      hasToRestart = false;
    }

    loadMatrix(view);
    buildingsInstances = [];
    world();
    checkKeys();
    updateHelicopterSize();
    updateHelicopterMovement();
  }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then((shaders) => setup(shaders));
