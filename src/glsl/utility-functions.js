// functions that are only used within other functions

module.exports = {
  _luminance: {
    type: 'util',
    glsl: `float _luminance(vec3 rgb){
      const vec3 W = vec3(0.2125, 0.7154, 0.0721);
      return dot(rgb, W);
    }`
  },
  _noise: {
    type: 'util',
    glsl: `
    //	Simplex 3D Noise
    //	by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float _noise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

  // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }
    `
  },


  _rgbToHsv: {
    type: 'util',
    glsl: `vec3 _rgbToHsv(vec3 c){
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }`
  },
    random_f: {
        type: 'util',
        glsl: `
            float random_f(in float x) {
                return fract(sin(x)*43758.5453);
        }`
    },
    random_i: {
        type: 'util',
        glsl: `
            float random_i (in vec2 _st) {
                return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))* 43758.5453123 + abs(time * .125));
        }`
    },
    randChar: {
        type: 'util',
        glsl: ` float randomChar(in vec2 outer, in vec2 inner){
						float grid = 5.;
						vec2 margin = vec2(.2,.05);
						vec2 borders = step(margin,inner)*step(margin,1.-inner);
						vec2 ipos = floor(inner*grid);
						vec2 fpos = fract(inner*grid);
						return step(.5,random_i(outer*64.+ipos))*borders.x*borders.y*step(0.01,fpos.x)*step(0.01,fpos.y);
					}
					`
    },
    outRunLine: {
        type: 'util',
        glsl: `float outRunLine(float center, float size, float edge, float y) {
            return max(
                max(
                    smoothstep(center - size - edge, center - size, y) *
                    smoothstep(center + size + edge, center + size, y),
                    smoothstep(center + size + edge - 1.0, center + size - 1.0, y)
                ),
                smoothstep(center - size + 1.0 - edge, center - size + 1.0, y)
            );
        }`
    },
    bottomGrid: {
        type: 'util',
        glsl: `
                vec3 bottomGrid(vec2 st, in vec3 col, in float maxlines, in float inactive) {
                    st = vec2(1.0) - st;
                    vec2 lines = vec2(10.0, 20.0);
                    float activeVLines = 20.0 - inactive;
                    float maxVlines = 10.0 + maxlines;
                    vec2 shift = vec2(mix(lines.x, maxVlines, st.y), lines.y);
                    vec2 suv = vec2((st.x * shift.x) - (shift.x * 0.5), st.y * shift.y);
                    vec2 fuv = fract(suv);
                    vec2 iuv = floor(suv);

                    col *= step(activeVLines, suv.y);

                    // glow lines
                    vec3 glowCol = vec3(0.3, 1.0, 0.3);
                    float _time = 1.0 - fract(time* 0.6);

                    float gvLine = outRunLine(0.0, 0.04, 0.08, fuv.x);
                    float ghLine = max(
                        outRunLine(_time, 0.12, 0.24, fuv.y),
                        outRunLine(0.0, 0.12, 0.12, fuv.y) * step(activeVLines - 0.16, suv.y)
                    );

                    col = mix(col, glowCol, max(ghLine, gvLine) * step(suv.y, activeVLines + .16) * 0.3);

                    // lines
                    vec3 lineCol = vec3(1.0, 1.0, 1.0);

                    float vLine = outRunLine(0.0, 0.0025, 0.03, fuv.x);
                    float hLine = max(
                        outRunLine(_time, 0.015, 0.06, fuv.y),
                        outRunLine(0.0, 0.03, 0.03, fuv.y) * step(activeVLines - 0.04, suv.y)
                    );

                    col = mix(col, lineCol, max(hLine, vLine) * step(suv.y, activeVLines + .04));
                    return col;
                }
                `
    },
    elechash33: {
        type: 'util',
        glsl: `vec3 elechash33(vec3 p3)
        {
            p3 = fract(p3 * vec3(.1031,.11369,.13787));
            p3 += dot(p3, p3.yxz+19.19);
            return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
        }
        `
    },
    elecsimplex_noise: {
        type: 'util',
        glsl: `float elecsimplex_noise(vec3 p)
        {
            const float K1 = 0.333333333;
            const float K2 = 0.166666667;

            vec3 i = floor(p + (p.x + p.y + p.z) * K1);
            vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);

            vec3 e = step(vec3(0.0), d0 - d0.yzx);
            vec3 i1 = e * (1.0 - e.zxy);
            vec3 i2 = 1.0 - e.zxy * (1.0 - e);

            vec3 d1 = d0 - (i1 - 1.0 * K2);
            vec3 d2 = d0 - (i2 - 2.0 * K2);
            vec3 d3 = d0 - (1.0 - 3.0 * K2);

            vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
            vec4 n = h * h * h * h * vec4(dot(d0, elechash33(i)), dot(d1, elechash33(i + i1)), dot(d2, elechash33(i + i2)), dot(d3, elechash33(i + 1.0)));

            return dot(vec4(31.316), n);
        }
        `
    },
    truchetPattern: {
        type: 'util',
        glsl: `
        vec2 truchetPattern(in vec2 _st, in float _index){
            _index = fract(((_index-0.5)*2.0));
            if (_index > 0.75) {
                _st = vec2(1.0) - _st;
            } else if (_index > 0.5) {
                _st = vec2(1.0-_st.x,_st.y);
            } else if (_index > 0.25) {
                _st = 1.0-vec2(1.0-_st.x,_st.y);
            }
            return _st;
        }`
    },
    random: {
        type: 'util',
        glsl: `
            float random (in vec2 _st) {
                return fract(sin(dot(_st.xy, vec2(12.9898,78.233)))* 43758.5453123 + abs(time * .125));
        }`
    },
    checker: {
        type: 'util',
            glsl: `
                float checker(vec2 coord) {
                    coord = mod(floor(coord), 2.0);
                    return mod(coord.x + coord.y, 2.0);
                }
                `
    },
    circle: {
        type: 'util',
        glsl: ` float circle(in vec2 _st, in float _radius){
            vec2 dist = _st-vec2(0.5);
            return 1.-smoothstep(_radius-(_radius*0.01), _radius+(_radius*0.01), dot(dist,dist)*4.0);
}
`
    },
  _hsvToRgb: {
    type: 'util',
    glsl: `vec3 _hsvToRgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }`
  }
}
