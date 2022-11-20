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
import { mult, perspective, rotateY } from "./libs/MV.js";

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
let VP_DISTANCE = 100.0;
const CAMERA_ANGLE_CHANGE = Math.PI / 20.0;
const FIRST_PERSON_VIEW_MODE = "firstPersonView";
const BOTTOM_VIEW_MODE = "botomView";
const CENTER_VIEW_MODE = "centerView";
const DEFAULT_VIEW_MODE = "defaultView";
const HELICOPTER_VIEW_MODE = "helicopterView";
let viewMode = DEFAULT_VIEW_MODE;

let horizontalDirection = 0.0;
let verticalDirection = 0.0;

//Crate

let crateInstances = [];
const CRATE_DESPAWN_TIME = 5.0;
const CRATE_SIZE = 3.5;
const CRATE_MASS = 7.0;

//World Limits and forces
const WORLD_X_UPPER_LIMIT = 100.0;
const WORLD_Y_UPPER_LIMIT = 100.0;
const WORLD_Z_UPPER_LIMIT = 100.0;

const WORLD_X_LOWER_LIMIT = -100.0;
const WORLD_Y_LOWER_LIMIT = 0.0;
const WORLD_Z_LOWER_LIMIT = -100.0;

//Estes valores foram adaptados de acordo com alguns testes
const GRAVITY = 9.8; // m/s^2
const WIND_RESISTANCE = 0.5; // m/s^2
let sunAngle = 0.0; //em relacao ao x

//Helicopter movement
let helicopterSpeed = 0.0;
let helicopterAngleY = 0.0;
const AUTOMATIC_ANIMATION_RADIUS = 70.0;
const HELICOPTER_INIT_X = Math.sin(helicopterAngleY * Math.PI / 180 - Math.PI / 2.0) * AUTOMATIC_ANIMATION_RADIUS;
const HELICOPTER_INIT_Z = Math.cos(helicopterAngleY * Math.PI / 180 - Math.PI / 2.0) * AUTOMATIC_ANIMATION_RADIUS;
const HELICOPTER_INIT_Y = 0.0;
const HELICOPTER_MAX_SPEED = 200;
const HELICOPTER_ANGLE_CHANGE = 7.0;
const HELICOPTER_MAX_ATTACK_ANGLE = 30;
const HELICOPTER_ACCELERATION = 1.6;
let helicopterPosX = HELICOPTER_INIT_X
let helicopterPosY = HELICOPTER_INIT_Y;
let helicopterPosZ = HELICOPTER_INIT_Z;


//Main Helice
const HELICE_DIAMETER = 4;
const HELICE_SIZE_X = HELICE_DIAMETER * 1.0;
const HELICE_SIZE_Y = HELICE_DIAMETER * 1.0 / 30.0;
const HELICE_SIZE_Z = HELICE_DIAMETER * 1.0 / 8.0;

//All helices
let heliceSpeed = 0;
const HELICE_FLYING_SPEED = 1300;
const HELICE_NUM = 3;

//Helice connector
const HELICE_CONECT_DIAMETER = 0.3;
const HELICE_CONECT_HIGH = 0.5;

//Tail Main Connector
const TAIL_MAIN_CONECT_DIAMETER = 4.0;
const TAIL_MAIN_SIZE_X = TAIL_MAIN_CONECT_DIAMETER * 1.0 / 18.0;
const TAIL_MAIN_SIZE_Y = TAIL_MAIN_CONECT_DIAMETER * 1.0 / 8.0;
const TAIL_MAIN_SIZE_Z = TAIL_MAIN_CONECT_DIAMETER * 1.0;

//Tail End Connector
const TAIL_END_DIAMETER = 1;
const TAIL_END_SIZE_X = TAIL_END_DIAMETER * 1.0 / 13.0;
const TAIL_END_SIZE_Y = TAIL_END_DIAMETER * 1.0;
const TAIL_END_SIZE_Z = TAIL_END_DIAMETER * 1.0 / 1.8;

//Leg connector
const LEG_ANGLE_Y = 30;
const LEG_ANGLE_Z = 60;
const LEG_CONECT_X = 1.2;
const LEG_CONECT_Y = 1 / 7;
const LEG_CONECT_Z = 1 / 4;

//Helicopter Body
const BODY_DIAMETER = 5.0;
const BODY_SIZE_X = BODY_DIAMETER * 1.0 / 3.0;
const BODY_SIZE_Y = BODY_DIAMETER * 1.0 / 2.2;
const BODY_SIZE_Z = BODY_DIAMETER * 1.0;

//Feet
const FEET_X = 1 / 4;
const FEET_Y = 1 / 4;
const FEET_Z = BODY_SIZE_Z;

const CENTER_SPHERE_SIZE = 2.0;

//General helicopter
const HELICOPTER_MASS = 100.0;
const HELICOPTER_BOTTOM_TO_CENTER = BODY_SIZE_Y / 2.0 + (Math.cos(LEG_ANGLE_Y * Math.PI / 180) * LEG_CONECT_Y + FEET_Y) / 1.2;


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


const GRASS_COLOR = vec3(100.0,139.0,20.0);

const WINDOW_GLASS_COLOR = vec3(158.0,191.0,234.0);

const BOX_COLOR = vec3(115, 79, 13);

const HELICE_CONECT_COLOR = vec3(255.0, 255.0, 0.0);
const HELICE_PART_COLOR = vec3(0.0, 0.0, 255.0);
const TAIL_END_COLOR = vec3(255.0, 0.0, 0.0);
const TAIL_MAIN_CONECT_COLOR = vec3(255.0, 0.0, 0.0);
const BODY_COLOR = vec3(255.0, 0.0, 0.0);
const LEG_CONECT_COLOR = vec3(255.0, 255.0, 0.0);
const FEET_END_COLOR = vec3(255.0, 255.0, 0.0);

const axonotricView = lookAt(
  [VP_DISTANCE, VP_DISTANCE, VP_DISTANCE],
  [0, 0, 0],
  [0, 1, 0],
);
const XZview = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, 1]); //olhar de cima para baixo
const ZYview = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]); //olhar do x para o centro
const XYview = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]); //olhar do z para o centro

let view = axonotricView;
let keys = {}; // Map that stores whether each key is pressed or not

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
    -VP_DISTANCE * aspect,
    VP_DISTANCE * aspect,
    -VP_DISTANCE,
    VP_DISTANCE,
    -3 * VP_DISTANCE,
    3 * VP_DISTANCE,
  );


  mode = gl.LINES;

  resize_canvas();
  window.addEventListener("resize", resize_canvas);
  document.onkeydown = function (event) {
    keys[event.key] = true;
    updatePerspectivePerMode();
  }


  window.addEventListener("keyup", (event) => {
    keys[event.key] = false; // Key no longer pressed
  });

  gl.clearColor(204.0 / 255.0, 151.0 / 255.0, 142.0 / 255.0, 1.0); // Background cinzento
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
          horizontalDirection += CAMERA_ANGLE_CHANGE;
        }
      if(keys["l"]){
          horizontalDirection -= CAMERA_ANGLE_CHANGE;
        }
      if(keys["i"]){
          if (verticalDirection < Math.PI / 2.0) {
            verticalDirection += CAMERA_ANGLE_CHANGE;
          }
        }
      if(keys["k"]){
          if (verticalDirection > -Math.PI / 2.0) {
            verticalDirection -= CAMERA_ANGLE_CHANGE;
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
          helicopterSpeed--;
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
          if (
          isAutomaticAnimation && helicopterPosY != getFloor(helicopterPosX,helicopterPosZ) &&
          helicopterSpeed < HELICOPTER_MAX_SPEED
        ) {
          helicopterSpeed += HELICOPTER_ACCELERATION;
        }
        }
      if(keys["q"]){
          VP_DISTANCE--;
          keys["q"] = false;
        }
      if(keys["a"]){
          VP_DISTANCE++;
          keys["a"] = false;
        }
      if(keys["z"]){
          //Troca o tipo de animacao para manual/automatica
          isAutomaticAnimation = !isAutomaticAnimation;
          hasToRestart = true;
          keys["z"] = false;
        }
      if(keys[" "]){
        if(isCrateAlowed(helicopterPosX,helicopterPosZ)){
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
          -VP_DISTANCE * aspect,
          VP_DISTANCE * aspect,
          -VP_DISTANCE,
          VP_DISTANCE,
          -3 * VP_DISTANCE,
          3 * VP_DISTANCE,
        );
        break;
      default:
    }
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
      3*VP_DISTANCE,
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

  function isCrateAlowed(x,z){
    for (let i = 0; i<crateInstances.length;i++){ 
      let crateObj = crateInstances[i];
      let isXInside = crateObj.posX + CRATE_SIZE/2.0>x && crateObj.posX - CRATE_SIZE/2.0<x;
      let isZInside = crateObj.posZ + CRATE_SIZE/2.0>z && crateObj.posZ - CRATE_SIZE/2.0<z;

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
      crateInstances.push({
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
    multTranslation([
      0,
      -(BODY_SIZE_Y / 2.0 +
        (Math.cos(LEG_ANGLE_Y * Math.PI / 180) * LEG_CONECT_Y + FEET_Y) / 1.2),
      0.0,
    ]);
    feet();
    popMatrix();
    pushMatrix();
      multScale([0.15, 0.15, 0.15]);
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

  function world() {
    pushMatrix();
      multTranslation([0.0, -1.0, 0.0]);
      floor(GRASS_COLOR);
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
      addBuilding(-70.0,BUILDING_FLOOR_HIGH/2.0,30.0);
    popMatrix();
    currBuilding=0;

    pushMatrix();
      multTranslation([helicopterPosX, helicopterPosY, helicopterPosZ]);
      helicopterStillAnimation();
      helicopterFlight();
      multRotationY(helicopterAngleY);
      multRotationX(
        HELICOPTER_MAX_ATTACK_ANGLE * (helicopterSpeed / HELICOPTER_MAX_SPEED),
      );
      helicopter();
    popMatrix();
    pushMatrix();
    multRotationZ(sunAngle);
    multTranslation([-2*WORLD_Y_UPPER_LIMIT,0.0,0.0]);
    sunAngle+=10.0*speed;
    Sun();
    popMatrix();
    //pushMatrix();
    //centerSphere();
    //popMatrix();
    for (let crateObj of crateInstances) {
      pushMatrix();
      moveCrate(crateObj);
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
    selectColor(WINDOW_GLASS_COLOR);
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

  function domoColum(){
    selectColor(vec3(0.0, 0.0, 0.0));
    multScale([0.5, DOMO_BODY_SIZE_Y, 0.5]);
    uploadModelView();
    CUBE.draw(gl, program, mode);
  }

  function domoBodyColum(){
    pushMatrix();
      domoBody();
    popMatrix();
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
      domoBodyColum();
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
      multTranslation([DOMO_BODY_SIZE_X / 2, DOMO_BODY_SIZE_Y / 3, -BODY_SIZE_Z / 1.5]);
      domoEye();
    popMatrix();
    pushMatrix();
      multTranslation([DOMO_BODY_SIZE_X / 2, DOMO_BODY_SIZE_Y / 3, BODY_SIZE_Z / 1.5]);
      domoEye();
    popMatrix();
    for(let i = 0; i < 3; i++){
      pushMatrix();
        multTranslation([DOMO_BODY_SIZE_X / 2, -0.5, BODY_SIZE_Z / 1.5 - 2.0 * i * 2 + 0.5 ]);
        domoTooth();
      popMatrix();
    }
    for(let i = 0; i < 3; i++){
      pushMatrix();
        multTranslation([DOMO_BODY_SIZE_X / 2, 3.0, BODY_SIZE_Z / 1.5 - 2.0 * i * 2 + 0.5 ]);
        domoTooth();
      popMatrix();
    }
  }

  function helicopterStillAnimation() {

    if (
      isWithinWorldLimit(helicopterPosX, helicopterPosY, helicopterPosZ) &&
      helicopterPosY != getFloor(helicopterPosX,helicopterPosZ)
    ) {
      helicopterPosY += Math.sin(time * Math.PI) / 90.0;
      multRotationZ(WIND_RESISTANCE/10.0 * Math.sin(time * Math.PI));}
    multTranslation([0, HELICOPTER_BOTTOM_TO_CENTER, 0]);
    multRotationZ(Math.sin(time * Math.PI));
  }

  function helicopterFlight() {
    if (isAutomaticAnimation && helicopterPosY != getFloor(helicopterPosX,helicopterPosY)) {
      helicopterAutomaticCalcule();
    }else{
      helicopterPosCalcule();
    }
    helicopterSpeedCalcule();
  }

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
    if (helicopterSpeed - WIND_RESISTANCE *HELICOPTER_MASS *speed >= 0.0) {
      helicopterSpeed -= WIND_RESISTANCE * HELICOPTER_MASS*speed;
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
    crate.speed -= WIND_RESISTANCE*CRATE_MASS*speed;
    crate.speedY -= GRAVITY*CRATE_MASS*speed;
    
    let newX = crate.posX + crate.speed * -Math.cos((helicopterAngleY+90.0)*Math.PI/180.0)*speed;

    let newZ = crate.posZ + crate.speed * Math.sin((helicopterAngleY+90.0)*Math.PI/180.0)*speed;

    let newY = crate.posY + crate.speedY*speed;

    let floor = getFloor(newX,newZ);
    if(crate.posY != getFloor(crate.posX,crate.posZ)){
    if(isWithinWorldLimit(newX,crate.posY,crate.posZ)){
      crate.posX = newX;
    }
    if(isWithinWorldLimit(newX,crate.posY,newZ)){
      crate.posZ = newZ;
    }
    if(isWithinWorldLimit(newX,newY,newZ) || (floor>crate.posY && floor>WORLD_Y_LOWER_LIMIT)){
      crate.posY = newY;
    }else{
      crate.posY = floor;
    }
  }
/*
    let newY = crate.posY -
      GRAVITY * GRAVITY * speed / 2;
    let newX = crate.posX +  Math.sin(crate.angle * Math.PI / 180) * crate.speed * speed;
    let newZ = crate.posZ + Math.cos(crate.angle * Math.PI / 180) * crate.speed * speed;
    let floor = getFloor(newX,newZ);
    if(newY < CRATE_SIZE / 2.0){newY = CRATE_SIZE/2.0}
    if (isWithinWorldLimit(newX, newY - CRATE_SIZE / 2.0, crate.posZ) && crate.posY > CRATE_SIZE / 2.0 + floor) {
      crate.posY = newY;
      crate.posX = newX;
      crate.posZ = newZ;
    } else{
      if(CRATE_SIZE/2.0 + floor > crate.posY){
        crate.posY = newY;
      }
      else{
        crate.posY = CRATE_SIZE / 2.0 + floor;
      }
    }*/
    if (time - crate.startTime > CRATE_DESPAWN_TIME) {
      crateInstances.splice(crateInstances.indexOf(crate), 1);
    }
  }

  function render() {
    updatePerspectivePerMode();
    //console.log("EM eye: " +[xCameraPos,0.0,zCameraPos]);
    //console.log("EM center: " + [Math.cos(horizontalDirection)+xCameraPos,0,Math.sin(horizontalDirection)+zCameraPos]);
    //console.log("helX = " + helicopterPosX);
    //console.log("helY = " + helicopterPosY);
    //console.log("helZ = "+ helicopterPosZ);
    //console.log("Helice speed = " + heliceSpeed);
    //console.log("Inclinação d helic = " + helicopterAngleY);
    //console.log("Distancia ao centro: " + Math.sqrt(   helicopterPosX * helicopterPosX + helicopterPosZ * helicopterPosZ, ),  );
    console.log("Speed = " + helicopterSpeed);
    if (animation) time += speed;
    window.requestAnimationFrame(render);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "mProjection"),
      false,
      flatten(mProjection),
    );
    if (viewMode == CENTER_VIEW_MODE) {
      view = lookAt([0, 0, 0], [
        Math.sin(horizontalDirection),
        Math.sin(verticalDirection),
        Math.cos(horizontalDirection),
      ], [0, 1, 0]);
    }
    if(viewMode == FIRST_PERSON_VIEW_MODE){
      let cameraHigh = helicopterPosY+BODY_SIZE_Y+LEG_CONECT_Y+FEET_Y+HELICE_CONECT_HIGH+1.5;
      view = lookAt([helicopterPosX, cameraHigh, helicopterPosZ], [
        -Math.cos((helicopterAngleY+90.0)*Math.PI/180.0)+helicopterPosX,
        cameraHigh,
        Math.sin((helicopterAngleY+90.0)*Math.PI/180.0)+helicopterPosZ,
      ], [0, 1, 0]);
    }

    if(viewMode == BOTTOM_VIEW_MODE){
      let cameraHigh = helicopterPosY+BODY_SIZE_Y+LEG_CONECT_Y+FEET_Y+HELICE_CONECT_HIGH+1.5;
      view = lookAt([helicopterPosX, cameraHigh, helicopterPosZ], [helicopterPosX, 0.0, helicopterPosZ], [1, 0, 0]);
    }

    if(viewMode == HELICOPTER_VIEW_MODE){

      view = lookAt([helicopterPosX,helicopterPosY,helicopterPosZ],[helicopterPosX,helicopterPosY,helicopterPosZ+1.0],[0,1,0]);
      let rotY = rotateY(-helicopterAngleY);
      view = mult(rotY,view);
    }

    if (hasToRestart) {
      restartHelicopter();
      hasToRestart = false;
    }

    loadMatrix(view);
    buildingsInstances = [];
    world();
    //domo();
    checkKeys();
  }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then((shaders) => setup(shaders));
