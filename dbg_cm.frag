#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray TU_cm;
uniform int id_cm;
in vec2 tc;
in vec3 P;
out vec4 frag_out;

void main()
{
	vec3 texel = texture(TU_cm,vec3(tc,id_cm)).rgb;
	frag_out = vec4(texel,1);
}
