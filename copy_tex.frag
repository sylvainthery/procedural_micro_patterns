#version 300 es
precision highp float;
uniform sampler2D TU_input;
uniform int coord;
out vec4 frag_out;

void main()
{
	ivec2 tc=ivec2(gl_FragCoord.xy);
	vec3 val = vec3(0);
	frag_out = vec4(texelFetch(TU_input,tc,0).rgb,1);
}


