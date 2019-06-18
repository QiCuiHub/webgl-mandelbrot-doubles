const fragment = `
/* Adapted from http://andrewthall.org/papers/df64_qf128.pdf */

precision highp float;

uniform vec2 scale;
uniform vec2 offset;
uniform vec4 center;
uniform vec2 zero;

vec2 quickTwoSum(float a, float b){
    float s = (a + b) + zero.x; // Stop compiler optimization
    float e = b - (s - a);
    
    return vec2(s, e);
}

vec4 twoSumComp(vec2 a, vec2 b){
    vec2 s = (a + b) + zero; // Stop compiler optimization
    vec2 v = (s - a) + zero; // Stop compiler optimization
    
    vec2 e = (a - (s - v)) + (b - v);

    return vec4(s.x, e.x, s.y, e.y);
}

vec2 df64_add(vec2 a, vec2 b){
    vec4 st;
    st = twoSumComp(a, b);
    
    st.y += st.z;
    st.xy = quickTwoSum(st.x, st.y);
    
    st.y += st.w;
    st.xy = quickTwoSum(st.x, st.y);
 
    return st.xy;
}

vec2 df64_mult(vec2 a, vec2 b){
    vec2 p;
    
    p = vec2(a.x * b.x, a.y * b.y);
    p.y += a.x * b.y;
    p.y += a.y * b.x;
    p = quickTwoSum(p.x, p.y);
    
    return p;
}

void main() {
    
    vec4 z = vec4(0.0); 
    
    // center + (gl_FragCoord.xy - offset) * scale
    vec4 f = vec4(gl_FragCoord.x - offset.x, 0.0, gl_FragCoord.y - offset.y, 0.0);
    vec4 s = vec4(df64_mult(f.xy, scale), df64_mult(f.zw, scale)); 
    vec4 c = vec4(df64_add(center.xy, s.xy), df64_add(center.zw, s.zw));  
    
    float iter = 0.0;
    for(int i = 0; i < 256; i++)
    { 
        // Real
        vec2 real = df64_add(
             df64_mult(z.xy, z.xy),
            -df64_mult(z.zw, z.zw)
        );

        // Complex
        vec2 complex = df64_mult(
            vec2(2.0, 0.0),
            df64_mult(z.zw, z.xy)
        );

        // z' = (z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        z = vec4(df64_add(real, c.xy), df64_add(complex, c.zw));
            
        iter += 1.0;
        if (z.x * z.x + z.z * z.z >= 4.0) break;
    }

    vec3 col = iter < 256.0 ? vec3(iter / 256.0) : vec3(0.9);
    gl_FragColor = vec4(col, 1.0);
}

`;

const vertex = `

precision highp float;

attribute vec2 aVertexPosition;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;


void main() {
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}

`;
