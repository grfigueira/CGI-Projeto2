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
  multRotationX,
  multScale,
  multTranslation,
  popMatrix,
  pushMatrix,
} from "../../libs/stack.js";

import * as SPHERE from "../../libs/objects/sphere.js";
import * as CYLINDER from "../../libs/objects/cylinder.js";

/** @type WebGLRenderingContext */
let gl;

let time = 0; // Global simulation time in days
let speed = 1 / 60.0; // Speed (how many days added to time on each render pass
let mode; // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true; // Animation is running

//Main Helice
const HELICE_DIAMETER = 4;
const HELICE_SCALE_X =1;
const HELICE_SCALE_Y =1.0/30.0;
const HELICE_SCALE_Z =1.0/8.0;

//All helices
const HELICE_SPEED = 50;
const HELICE_NUM = 3;

//Helice connector
const HELICE_CONECT_DIAMETER = 0.3;
const HELICE_CONECT_HIGH = 0.5;

//Tail Main Connector
const TAIL_MAIN_CONECT_DIAMETER = 4;
const TAIL_MAIN_SCALE_X = 1.0/18.0;
const TAIL_MAIN_SCALE_Y = 1.0/8.0;
const TAIL_MAIN_SCALE_Z = 1.0;

//Tail End Connector
const TAIL_END_DIAMETER = 1;
const TAIL_END_SCALE_X = 1.0;
const TAIL_END_SCALE_Y = 1.0;
const TAIL_END_SCALE_Z = 1.0;

//Helicopter Body
const BODY_DIAMETER = 5;
const BODY_SCALE_X = 1.0/3.0
const BODY_SCALE_Y = 1.0/2.2;
const BODY_SCALE_Z = 1.0;

const PLANET_SCALE = 1; // scale that will apply to each planet and satellite
const ORBIT_SCALE = 1 / 60; // scale that will apply to each orbit around the sun

const SUN_DIAMETER = 1391900;
const SUN_DAY = 24.47; // At the equator. The poles are slower as the sun is gaseous


//View
const VP_DISTANCE = 4;
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
        view = XZview;
        break;
      case "2":
        view = ZYview;
        break;
      case "3":
        view = XYview;
        break;
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  SPHERE.init(gl);
  CYLINDER.init(gl);
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

  function Sun() {
    // Don't forget to scale the sun, rotate it around the y axis at the correct speed
    multScale([SUN_DIAMETER, SUN_DIAMETER, SUN_DIAMETER]);
    multRotationY(360 * time / SUN_DAY);

    // Send the current modelview matrix to the vertex shader
    uploadModelView();

    // Draw a sphere representing the sun
    SPHERE.draw(gl, program, mode);
  }

  function helicePart() {
    multScale([HELICE_DIAMETER*HELICE_SCALE_X, HELICE_DIAMETER*HELICE_SCALE_Y, HELICE_DIAMETER*HELICE_SCALE_Z]);

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
    multScale([TAIL_MAIN_CONECT_DIAMETER*TAIL_MAIN_SCALE_X, TAIL_MAIN_CONECT_DIAMETER*TAIL_MAIN_SCALE_Y, TAIL_MAIN_CONECT_DIAMETER*TAIL_MAIN_SCALE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

  function tailEnd(){
    multScale([TAIL_END_DIAMETER*TAIL_END_SCALE_X, TAIL_END_DIAMETER*TAIL_END_SCALE_Y, TAIL_END_DIAMETER*TAIL_END_SCALE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);

  }

  function tailTip(){
    pushMatrix();
        tailEnd();
    popMatrix();
    pushMatrix();
        multTranslation([0,0,0]);
        multRotationX([0,0,0]);
        multScale([1,1,1]);
        helice();
    popMatrix();
  }

  function tail(){
    pushMatrix();
        tailConnector();
    popMatrix();
    pushMatrix();
        multTranslation([0,TAIL_MAIN_CONECT_DIAMETER*TAIL_MAIN_SCALE_Y /2.0,-TAIL_MAIN_CONECT_DIAMETER*TAIL_MAIN_SCALE_Z/2.0]);
        tailTip();
    popMatrix();
  }


  function body() {
    multScale([BODY_DIAMETER * BODY_SCALE_X, BODY_DIAMETER * BODY_SCALE_Y, BODY_DIAMETER*BODY_SCALE_Z]);

    uploadModelView();

    SPHERE.draw(gl, program, mode);
  }

  function helicopter() {
    pushMatrix();
        body();
    popMatrix();
    pushMatrix();
        multTranslation([0, BODY_DIAMETER*BODY_SCALE_Y/2.0 + HELICE_CONECT_HIGH/2.0,0.0]);
        helice();
    popMatrix();
    pushMatrix();
        multTranslation([0,BODY_DIAMETER*BODY_SCALE_Y/4.0,-(BODY_DIAMETER*BODY_SCALE_Z+TAIL_MAIN_CONECT_DIAMETER*TAIL_MAIN_SCALE_Z)/2.5]);
        tail();
    popMatrix();
  }

  function cityHel() {
    pushMatrix();
        helicopter();
    popMatrix();
  }

  function render() {
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

    loadMatrix(view);
    cityHel();
  }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then((shaders) => setup(shaders));
