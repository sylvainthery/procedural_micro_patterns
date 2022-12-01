#version 300 es
precision highp float;
uniform sampler2D TU_input;
uniform int coord;
out vec4 frag_out;

const float kernel[5]=float[](0.0625,0.25,0.375,0.25,0.0625);
void main()
{
	ivec2 tc=ivec2(gl_FragCoord.xy);
	tc[coord] -= 2;

	vec3 val = vec3(0);

	for(int i=0;i<5;++i)
	{
		ivec2 ctc = clamp(tc,ivec2(0),textureSize(TU_input,0)-1);
		val += kernel[i]*texelFetch(TU_input,ctc,0).rgb;
		tc[coord]++;
	}
	
	frag_out = vec4(val,1);
}


