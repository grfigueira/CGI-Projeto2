precision highp float;
uniform mat4 mModelView;
uniform mat4 mProjection;
uniform vec3 uColor;
uniform float uLightAngle;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;
varying vec3 fColor;

float toAdd = 0.0;

const float VAR_SCALE = 1.0/5.0;


// generates a pseudo random number that is a function of the argument. The argument needs to be constantly changing from call to call to generate different results
highp float rand(vec2 co)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    fNormal = vNormal;

    float maxVar = (1.0-max(uColor[2],max(uColor[0],uColor[1])))*VAR_SCALE;
    float minVar = (min(uColor[2],min(uColor[0],uColor[1])))*VAR_SCALE;

    float randN = rand(vec2(vPosition[1],rand(vec2(vPosition[2],vPosition[0]))));
    if(maxVar<minVar){
    toAdd = randN * (maxVar-minVar)+minVar;
    }else
    {
    toAdd = randN * (minVar-maxVar)+maxVar;
    }
    //va2 == 0 dir e opost
    //var2 == 1 esq
    //var1 == 0 todo o lado
    //var0 == 0 esq e opost
    //var0 == 1 dir

    /*
        Luz vinda de:
            lado nenhum: var1!=0
            todo o lado: var2 == 0 || var0 == 0
            tras: var2 ==1 || var0 == 1
            frente: (var0 == 0 && var2 ==1) || (var2 == 0 && var0 !=0)
            esq-tras: 
            dir-tras:
    *//*
    if(vNormal[0] != 1.0 && vNormal[2] != 1.0 && vNormal[1] != 1.0){
        toAdd = s-3.0*toAdd;
    }
    */
    if(uLightAngle<180.0){
        toAdd *=3.0*(vNormal[2])*(vNormal[0])*sin(radians(uLightAngle+90.0));;
    }else{
        //primeira parte da rotacao
         toAdd *= 2.7*(vNormal[2]-1.0)*(vNormal[0])*sin(radians(uLightAngle+90.0));
    }
    
    
    vec3 newColor = vec3(uColor[0]+toAdd,uColor[1]+toAdd,uColor[2]+toAdd);

    fColor = newColor;
}
