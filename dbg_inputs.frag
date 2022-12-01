#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D TU;
uniform int channel;
in vec2 tc;
out vec4 frag_out;

void main()
{
	vec4 texel = texture(TU,tc);
	
	if (channel<0)
		frag_out = vec4(texel.rgb,1);
	else 
		frag_out = vec4(vec3(texel[channel]),1);
}
