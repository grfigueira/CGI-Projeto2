import {
  buildProgramFromSources,
  loadShadersFromURLS,
  setupWebGL,
} from "../../libs/utils.js";
import { flatten, lookAt, ortho } from "../../libs/MV.js";
import {
  loadMatrix,
  modelView,
  multRotationY,
  multRotationZ,
  multRotationX,
  multScale,
  multTranslation,
  popMatrix,
  pushMatrix,
} from "../../libs/stack.js";

import * as SPHERE from "../../libs/objects/sphere.js";
import * as CYLINDER from "../../libs/objects/cylinder.js";
import * as CUBE from "../../libs/objects/cube.js";

/** @type WebGLRenderingContext */
let gl;

let time = 0; // Global simulation time in days
let speed = 1 / 60.0; // Speed (how many days added to time on each render pass
let mode; // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true; // Animation is running

//VIEWCONST
//View
let VP_DISTANCE = 50.0;
const CAMERA_ANGLE_CHANGE = Math.PI/20.0;

let horizontalDirection = 0.0;
let verticalDirection = 0.0;
let xCameraPos = 0;
let zCameraPos = 0;
let isCenterView = false;

//World Limits
const WORLD_X_UPPER_LIMIT = 100.0;
const WORLD_Y_UPPER_LIMIT = 100.0;
const WORLD_Z_UPPER_LIMIT = 100.0;

const WORLD_X_LOWER_LIMIT = -100.0;
const WORLD_Y_LOWER_LIMIT = 0.0;
const WORLD_Z_LOWER_LIMIT = -100.0;

const GRAIVTY = 10.0;


//Helicopter movement
const HELICOPTER_MAX_SPEED = 10;
const HELICOPTER_ANGLE_CHANGE = 20;
let helicopterAngle = 0.0;
let helicopterPosX = 0.0;
let helicopterPosY = 0.0;
let helicopterPosZ = 0.0;

//Main Helice
const HELICE_DIAMETER = 4;
const HELICE_SIZE_X = HELICE_DIAMETER*1.0;
const HELICE_SIZE_Y = HELICE_DIAMETER*1.0/30.0;
const HELICE_SIZE_Z = HELICE_DIAMETER*1.0/8.0;

//All helices
let heliceSpeed = 0;
let heliceShowSpeed = 0;
const HELICE_FLYING_SPEED = 1000;
const HELICE_NUM = 3;

//Helice connector
const HELICE_CONECT_DIAMETER = 0.3;
const HELICE_CONECT_HIGH = 0.5;

//Tail Main Connector
const TAIL_MAIN_CONECT_DIAMETER = 4.0;
const TAIL_MAIN_SIZE_X = TAIL_MAIN_CONECT_DIAMETER*1.0/18.0;
const TAIL_MAIN_SIZE_Y = TAIL_MAIN_CONECT_DIAMETER*1.0/8.0;
const TAIL_MAIN_SIZE_Z = TAIL_MAIN_CONECT_DIAMETER*1.0;

//Tail End Connector
const TAIL_END_DIAMETER = 1;
const TAIL_END_SIZE_X =TAIL_END_DIAMETER*1.0/13.0;
const TAIL_END_SIZE_Y =TAIL_END_DIAMETER*1.0;
const TAIL_END_SIZE_Z =TAIL_END_DIAMETER*1.0/1.8 ;

//Leg connector
const LEG_ANGLE_Y = 30;
const LEG_ANGLE_Z = 60;
const LEG_CONECT_X=1.2;
const LEG_CONECT_Y=1/7;
const LEG_CONECT_Z=1/4;

//Helicopter Body
const BODY_DIAMETER = 5.0;
const BODY_SIZE_X =BODY_DIAMETER*1.0/3.0;
const BODY_SIZE_Y =BODY_DIAMETER*1.0/2.2;
const BODY_SIZE_Z =BODY_DIAMETER*1.0;

//Feet
const FEET_X =  1/4;
const FEET_Y = 1/4;
const FEET_Z = BODY_SIZE_Z;



//const XZview = lookAt([10, VP_DISTANCE, 0-10], [0, 0, 0], [0, 0, 1]); //olhar de lado
const axonotricView = lookAt([VP_DISTANCE, VP_DISTANCE, VP_DISTANCE], [0, 0, 0], [0,1, 0]);
const XZview = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, 1]); //olhar de cima para baixo
const ZYview = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]); //olhar do x para o centro
const XYview = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]); //olhar do z para o centro

let view = axonotricView;

function setup(shaders) {
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

  document.onmousemove = function(event){

  }

  document.onkeydown = function (event) {
    switch (event.key) {
      case "w":
        mode = gl.LINES;
        break;
      case "s":
        mode = gl.TRIANGLES;
        break;
      case "p":
        animation = !animation;
        break;
      case "+":
        if (animation) speed *= 1.1;
        break;
      case "-":
        if (animation) speed /= 1.1;
        break;
      case "1":
        isCenterView = false;
        view = axonotricView;
        break;
      case "2":
        isCenterView = false;
        view = XZview;
        break;
      case "3":
        isCenterView = false;
        view = ZYview;
        break;
      case "4":
        isCenterView = false;
        view = XYview;
        break;
      case "5":
        isCenterView = true;
      break;
      case "j":
          horizontalDirection += CAMERA_ANGLE_CHANGE;
      break;
      case "l":
          horizontalDirection -= CAMERA_ANGLE_CHANGE;
      break;
      case "i":
        if(verticalDirection<Math.PI/2.0){
            verticalDirection +=CAMERA_ANGLE_CHANGE;}
        break;
      case "k":
        if(verticalDirection>-Math.PI/2.0){
          verticalDirection -=CAMERA_ANGLE_CHANGE;}
        break;
      case "r":
          if(isWithinWorldLimit(helicopterPosX,helicopterPosY,helicopterPosZ+Math.cos(helicopterAngle*Math.PI/180))){
            helicopterPosZ+=Math.cos(helicopterAngle*Math.PI/180);
          }
          if(isWithinWorldLimit(helicopterPosX+Math.sin(helicopterAngle*Math.PI/180),helicopterPosY,helicopterPosZ)){
            helicopterPosX+=Math.sin(helicopterAngle*Math.PI/180);
          }
      break;
      case "f":
          if(isWithinWorldLimit(helicopterPosX,helicopterPosY,helicopterPosZ-Math.cos(helicopterAngle*Math.PI/180))){
            helicopterPosZ-=Math.cos(helicopterAngle*Math.PI/180);
          }
          if(isWithinWorldLimit(helicopterPosX-Math.sin(helicopterAngle*Math.PI/180),helicopterPosY,helicopterPosZ)){
            helicopterPosX-=Math.sin(helicopterAngle*Math.PI/180);
          }
      break;
      case "g":
          helicopterAngle+=HELICOPTER_ANGLE_CHANGE;
      break;

      case "d":
          helicopterAngle-=HELICOPTER_ANGLE_CHANGE;
      break;

      case "y":
          if(heliceSpeed<HELICE_FLYING_SPEED){
            heliceSpeed+=50
            heliceShowSpeed+=50;}
          else{
            heliceSpeed+=15.0/((heliceSpeed-HELICE_FLYING_SPEED)+1.0);
          }
      break;
      case "h":
        //heliceSpeed-=15.0;
        let toRemove = speed*(helicopterPosY-WORLD_X_LOWER_LIMIT)/10.0;
        if(isWithinWorldLimit(helicopterPosX,helicopterPosY-toRemove,helicopterPosZ)){
          helicopterPosY-=toRemove;}
         else{
          helicopterPosY = WORLD_Y_LOWER_LIMIT;
         }
     break;
     case "q":
         VP_DISTANCE--;
     break;
     case "a":
         VP_DISTANCE++;
     break;  
    }
    mProjection = ortho(
      -VP_DISTANCE * aspect,
      VP_DISTANCE * aspect,
      -VP_DISTANCE,
      VP_DISTANCE,
      -3 * VP_DISTANCE,
      3 * VP_DISTANCE,
    );
  };


  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  SPHERE.init(gl);
  CYLINDER.init(gl);
  CUBE.init(gl);
  gl.enable(gl.DEPTH_TEST); // Enables Z-buffer depth test

  window.requestAnimationFrame(render);

  function resize_canvas(event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);

    mProjection = ortho(
      -VP_DISTANCE * aspect,
      VP_DISTANCE * aspect,
      -VP_DISTANCE,
      VP_DISTANCE,
      -3 * VP_DISTANCE,
      3 * VP_DISTANCE,
    );
  }

  function uploadModelView() {
    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "mModelView"),
      false,
      flatten(modelView()),
    );
  }

  function isWithinWorldLimit(x,y,z){
      let isWithinX= x<=WORLD_X_UPPER_LIMIT && x>=WORLD_X_LOWER_LIMIT;
      let isWithinY= y<=WORLD_Y_UPPER_LIMIT && y>=WORLD_Y_LOWER_LIMIT;
      let isWithinZ= z<=WORLD_Z_UPPER_LIMIT && z>=WORLD_Z_LOWER_LIMIT;
      return isWithinX && isWithinY && isWithinZ;
  }

  /*
    Este método desenha uma das partes moviveis da helice
  */
  function helicePart() {
    multScale([HELICE_SIZE_X, HELICE_SIZE_Y, HELICE_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }
  /*
    Este método desenha o cilindro que conecta as partes moviveis da helice ao body.
  */
  function heliceConect() {
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
    for(let i = 0; i<360;i+=360/HELICE_NUM){
        pushMatrix();
            multRotationY(heliceShowSpeed * time+i);
            multTranslation([HELICE_DIAMETER / 2, 0, 0]);
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
  function tailConnector(){
    multScale([TAIL_MAIN_SIZE_X, TAIL_MAIN_SIZE_Y, TAIL_MAIN_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }
/*
    Este método cria a cauda do helicoptero/zona onde está situada a helice mais pequena
*/
  function tailEnd(){
    multScale([TAIL_END_SIZE_X, TAIL_END_SIZE_Y, TAIL_END_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);

  }
  /*
    Este método desenha a ponta da cauda, ou seja, a helice pequena e o seu apoio
*/
  function tailTip(){
    pushMatrix();
        multRotationX(-20)
        tailEnd();
    popMatrix();
    pushMatrix();
        multTranslation([(TAIL_END_SIZE_X+HELICE_CONECT_DIAMETER)/2,0,0]);
        multRotationZ(90);
        multScale([0.3,0.3,0.3]);
        helice();
    popMatrix();
  }

  /*
    Este método desenha a cauda completa
*/
  function tail(){
    pushMatrix();
        tailConnector();
    popMatrix();
    pushMatrix();
        multTranslation([0,TAIL_MAIN_SIZE_Y /2.0,-TAIL_MAIN_SIZE_Z/2.0]);
        tailTip();
    popMatrix();
  }

  /*
    Este método desenha o body do helicoptero
*/
  function body() {
    multScale([BODY_SIZE_X, BODY_SIZE_Y, BODY_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

    /*
    Este desenho desenha uma das quatro pernas laterais do helicoptero
*/

  function legConect(){
    multRotationZ(LEG_ANGLE_Z);
    multRotationY(LEG_ANGLE_Y);

    multScale([LEG_CONECT_X,LEG_CONECT_Y,LEG_CONECT_Z]);

    uploadModelView();

    CUBE.draw(gl, program, mode);

  }

    /*
    Este método desenha o pé, ou seja, a zona mais abaixo do helicoptero
*/
  function feetEnd(){

    multScale([FEET_X,FEET_Y,FEET_Z]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

    /*
    Este método desenha uma perna + pé (são duas pernas, basicamente, mas que seguram um unico pé)
*/
  function oneLeg(){
    pushMatrix();
      multTranslation([0.0,0.0,BODY_SIZE_Z/4]);
      legConect();
    popMatrix();
    pushMatrix();
      multScale([1.0,1.0,-1.0]);
      multTranslation([0.0,0.0,BODY_SIZE_Z/4]);
      legConect();
    popMatrix();
    pushMatrix();
      multTranslation([Math.sin(LEG_ANGLE_Z*Math.PI/180)*LEG_CONECT_X+FEET_X/2,-(Math.cos(LEG_ANGLE_Y*Math.PI/180)*LEG_CONECT_Y+FEET_Y),0.0]);
      feetEnd();
    popMatrix();
  }

    /*
      Desenha toda a zona inferior do helicoptero, incluindo 4 pernas e dois pés
*/

  function feet(){
    pushMatrix();
      multTranslation([-BODY_SIZE_X/4.0,0.0,0.0])
      oneLeg();
    popMatrix();
    pushMatrix();
      multTranslation([BODY_SIZE_X/4.0,0.0,0.0])
      multScale([-1,1,1]);
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
        multTranslation([0, BODY_SIZE_Y/2.0 + HELICE_CONECT_HIGH/2.0,0.0]);
        helice();
    popMatrix();
    pushMatrix();
        multTranslation([0,BODY_SIZE_Y/4.0,-(BODY_SIZE_Z+TAIL_MAIN_SIZE_Z)/2.5]);
        tail();
    popMatrix();
    pushMatrix();
        multTranslation([0,-(BODY_SIZE_Y/2.0 + (Math.cos(LEG_ANGLE_Y*Math.PI/180)*LEG_CONECT_Y+FEET_Y)/1.2),0.0]);
        feet();
    popMatrix();
  }
  /*
  Desenha o chão
*/
  function floor(){
      
    multScale([100.0,1.0,100.0]);

    uploadModelView();
    SPHERE.draw(gl,program,mode);
    //CUBE.draw(gl, program, mode);
  }

    /*
    Desenha o mundo
*/

  function world(){
    pushMatrix();
      multTranslation([0.0,-1.0,0.0]);
      floor();
    popMatrix();
    pushMatrix();
      helicopterFlight();
      helicopterMovingAnimation();
      multTranslation([helicopterPosX,helicopterPosY,helicopterPosZ]);
      multRotationY(helicopterAngle);
      helicopter();
    popMatrix();
  }

  function helicopterMovingAnimation(){
    let balAngle = 0;
    let helicopterHigh = BODY_SIZE_Y/2.0 + (Math.cos(LEG_ANGLE_Y*Math.PI/180)*LEG_CONECT_Y+FEET_Y)/1.2;
    if(isWithinWorldLimit(helicopterPosX,helicopterPosY,helicopterPosZ) && helicopterPosY != 0.0){
      helicopterPosY += Math.sin(time*Math.PI)/100.0;
      balAngle = 0.5*Math.sin(time*Math.PI);}
    multRotationZ(balAngle);
    multTranslation([0,helicopterHigh,0]);
  }

  function helicopterFlight(){
    if (helicopterPosY==0.0 && 0<heliceSpeed){
      heliceSpeed-= heliceSpeed/100.0;
      heliceShowSpeed -= heliceShowSpeed/100.0;
      if(heliceSpeed<0.03){
        heliceShowSpeed = 0;
        heliceSpeed =0;}
    }
    if(heliceSpeed-GRAIVTY*speed>HELICE_FLYING_SPEED){
      heliceSpeed-=GRAIVTY*speed;
    if(isWithinWorldLimit(helicopterPosX,helicopterPosY+(heliceSpeed-HELICE_FLYING_SPEED)/HELICE_FLYING_SPEED,helicopterPosZ)){
      helicopterPosY+=(heliceSpeed-HELICE_FLYING_SPEED)/HELICE_FLYING_SPEED;}
    }
  }

  function render() {
    //console.log("EM eye: " +[xCameraPos,0.0,zCameraPos]);
    //console.log("EM center: " + [Math.cos(horizontalDirection)+xCameraPos,0,Math.sin(horizontalDirection)+zCameraPos]);
    //console.log("helX = " + helicopterPosX);
    //console.log("helZ = " + helicopterPosY);
    //console.log("helZ = "+ helicopterPosZ);
    console.log("Helice speed = " + heliceSpeed);
    if (animation) time += speed;
    window.requestAnimationFrame(render);
    0;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "mProjection"),
      false,
      flatten(mProjection),
    );
     if(isCenterView){
      //view = lookAt([xCameraPos,0.0,zCameraPos],[0,0,0],[0,1,0]);
      view = lookAt([0,0,0],[Math.sin(horizontalDirection)+xCameraPos,Math.sin(verticalDirection),Math.cos(horizontalDirection)+zCameraPos],[0,1,0]);
    }
    loadMatrix(view);
    world();
  }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then((shaders) => setup(shaders));
