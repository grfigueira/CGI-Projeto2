
export{ domo };

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


//Domo - The little creature riding the helicopter
const DOMO_BODY_COLOR = vec3(149, 102, 73);
const DOMO_MOUTH_COLOR = vec3(228.0, 54.0, 49.0);
const DOMO_BODY_SIZE_X = 10.0;
const DOMO_BODY_SIZE_Y = 30.0;
const DOMO_BODY_SIZE_Z = 20.0

const DOMO_LEG_SIZE_X = 14.0;
const DOMO_LEG_SIZE_Y = 6.0;
const DOMO_LEG_SIZE_Z = 6.0;

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
