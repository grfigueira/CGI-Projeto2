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

//Main Helice
const HELICE_DIAMETER = 4;
const HELICE_SIZE_X = HELICE_DIAMETER*1.0;
const HELICE_SIZE_Y = HELICE_DIAMETER*1.0/30.0;
const HELICE_SIZE_Z = HELICE_DIAMETER*1.0/8.0;

//All helices
const HELICE_SPEED = 50;
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



//View
const VP_DISTANCE = 10.0;
let directionView = [0.0,0.0,0.0];
let eye = [VP_DISTANCE,0.0,0.0];
let up = [0.0,1.0,0.0];
let isPlayerView = false;


//const XZview = lookAt([10, VP_DISTANCE, 0-10], [0, 0, 0], [0, 0, 1]); //olhar de lado
const XZview = lookAt([0, VP_DISTANCE, 0], [0, 0, 0], [0, 0, 1]); //olhar de cima para baixo
const ZYview = lookAt([VP_DISTANCE, 0, 0], [0, 0, 0], [0, 1, 0]); //olhar do x para o centro
const XYview = lookAt([0, 0, VP_DISTANCE], [0, 0, 0], [0, 1, 0]); //olhar do z para o centro

let view = XZview;

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
        isPlayerView = false;
        view = XZview;
        break;
      case "2":
        isPlayerView = false;
        view = ZYview;
        break;
      case "3":
        isPlayerView = false;
        view = XYview;
        break;
      case "4":
        isPlayerView = true;
      break;
      
      case "j":
        eye[0]++;
        break;
      case "k":
        eye[2]--;
        break;
      case "l":
        eye[0]--;
        break;
      case "i":
        eye[2]++;
        break;
      case "g":
        directionView[0]--;
      break;
      case "h":
        directionView[0]++;
      break;
      
    }
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

  function helicePart() {
    multScale([HELICE_SIZE_X, HELICE_SIZE_Y, HELICE_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

  function heliceConect() {
    multScale([
      HELICE_CONECT_DIAMETER,
      HELICE_CONECT_HIGH,
      HELICE_CONECT_DIAMETER,
    ]);

    uploadModelView();

    CYLINDER.draw(gl, program, mode);
  }

  function rotHelice() {
    for(let i = 0; i<360;i+=360/HELICE_NUM){
        pushMatrix();
            multRotationY(HELICE_SPEED * time+i);
            multTranslation([HELICE_DIAMETER / 2, 0, 0]);
            helicePart();
        popMatrix();
    }
  }

  function helice() {
    pushMatrix();
        heliceConect();
    popMatrix();
    pushMatrix();
        rotHelice();
    popMatrix();
  }

  function tailConnector(){
    multScale([TAIL_MAIN_SIZE_X, TAIL_MAIN_SIZE_Y, TAIL_MAIN_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

  function tailEnd(){
    multScale([TAIL_END_SIZE_X, TAIL_END_SIZE_Y, TAIL_END_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);

  }

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

  function tail(){
    pushMatrix();
        tailConnector();
    popMatrix();
    pushMatrix();
        multTranslation([0,TAIL_MAIN_SIZE_Y /2.0,-TAIL_MAIN_SIZE_Z/2.0]);
        tailTip();
    popMatrix();
  }


  function body() {
    multScale([BODY_SIZE_X, BODY_SIZE_Y, BODY_SIZE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

  function legConect(){
    multRotationZ(LEG_ANGLE_Z);
    multRotationY(LEG_ANGLE_Y);

    multScale([LEG_CONECT_X,LEG_CONECT_Y,LEG_CONECT_Z]);

    uploadModelView();

    CUBE.draw(gl, program, mode);

  }
  function feetEnd(){

    multScale([FEET_X,FEET_Y,FEET_Z]);

    uploadModelView();

    CUBE.draw(gl, program, mode);
  }

  function oneLeg(){
    pushMatrix();
      multTranslation([0,0,BODY_SIZE_Z/4]);
      legConect();
    popMatrix();
    pushMatrix();
      multScale([1,1,-1]);
      multTranslation([0,0,BODY_SIZE_Z/4]);
      legConect();
    popMatrix();
    pushMatrix();
      multTranslation([Math.sin(LEG_ANGLE_Z*Math.PI/180)*LEG_CONECT_X+FEET_X/2,-(Math.cos(LEG_ANGLE_Y*Math.PI/180)*LEG_CONECT_Y+FEET_Y),0]);
      feetEnd();
    popMatrix();
  }

  function feet(){
    pushMatrix();
      multTranslation([-BODY_SIZE_X/4,0,0])
      oneLeg();
    popMatrix();
    pushMatrix();
      multTranslation([BODY_SIZE_X/4,0,0])
      multScale([-1,1,1]);
      oneLeg();
    popMatrix();
  }

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
    popMatrix();
    multTranslation([0,-(BODY_SIZE_Y/2+LEG_CONECT_Y/3),0]);
        feet();
    pushMatrix();
  }

  function cityHel() {
    pushMatrix();
        helicopter();
    popMatrix();
  }

  function render() {
    console.log("EM eye: " +eye);
    console.log("EM center: " + [eye[0]+directionView[0],eye[1]+directionView[1],eye[2]+directionView[2]]);
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
     if(isPlayerView){
      //view = lookAt([1,1,1],[0,0,0],[0,1,0]);
      let center = [eye[0]+directionView[0],eye[1]+directionView[1],eye[2]+directionView[2]];
      view = lookAt(eye ,center ,up); 
    }
    loadMatrix(view);
    cityHel();
  }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then((shaders) => setup(shaders));
