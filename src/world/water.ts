import * as THREE from 'three'
import { heightAt, WORLD_RADIUS } from './engine/terrain'

export function createGardenWater() {
  const size = 512, span = WORLD_RADIUS * 2 + 16, data = new Uint8Array(size * size * 4)
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const i = (z * size + x) * 4
    data[i] = Math.round(THREE.MathUtils.clamp((heightAt((x / (size - 1) - .5) * span, (z / (size - 1) - .5) * span) + 2) / 10, 0, 1) * 255)
    data[i + 3] = 255
  }
  const depth = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  depth.minFilter = depth.magFilter = THREE.LinearFilter; depth.needsUpdate = true
  const uniforms = { time: { value: 0 }, night: { value: 0 }, wind: { value: .65 }, golden: { value: 0 }, bed: { value: depth }, worldSpan: { value: span } }
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `uniform float time;uniform float wind;varying vec3 vWorld;
      void main(){vec3 p=position;p.y+=sin(p.x*.8+time*.6)*cos(p.z*.6+time*.45)*.025*wind;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
    fragmentShader: `uniform float time;uniform float night;uniform float wind;uniform float golden;uniform float worldSpan;uniform sampler2D bed;varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      void main(){
        vec2 p=vWorld.xz,uv=p/worldSpan+.5;float floorY=texture2D(bed,clamp(uv,0.,1.)).r*10.-2.;
        if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))floorY=-.6;
        float d=max(0.,.43-floorY),n=noise(p*.7+time*.025);if(floorY>.55)discard;
        vec3 c=mix(vec3(.12,.43,.32),vec3(.045,.25,.27),smoothstep(.2,2.5,d));
        float caustic=1.-smoothstep(.025,.11,abs(sin(p.x*2.4+sin(p.y*1.3+time*.35))+cos(p.y*2.1+cos(p.x*1.4-time*.23))));
        c+=vec3(.15,.21,.10)*caustic*(1.-smoothstep(.2,2.,d))*.4;
        float glint=pow(max(0.,sin(p.x*6.+time*.9)*sin(p.y*4.8-time*.55)*sin(p.x*7.7+p.y*5.8)),14.);
        c+=vec3(.65,.74,.52)*glint*.4;
        float foam=pow(max(0.,sin(d*14.-time*1.1+n*3.)),12.)*(1.-smoothstep(.08,.65,d));
        c=mix(c,vec3(.87,.91,.78),foam*.7);c=mix(c,c*vec3(1.12,.96,.75),golden*.4);c*=1.-night*.68;
        float alpha=mix(.48,.90,smoothstep(.2,2.,d));gl_FragColor=vec4(c,alpha);
        #include <colorspace_fragment>
      }`,
  })
  return { material, uniforms, dispose: () => depth.dispose() }
}
