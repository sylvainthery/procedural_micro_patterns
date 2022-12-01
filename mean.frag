#version 300 es
precision highp float;
uniform sampler2D TU_input;
uniform int coord;
out vec4 frag_out;

void main()
{
	ivec2 tc=ivec2(gl_FragCoord.xy);
	tc[coord] = 0;
	int nb = textureSize(TU_input,0).x;
	vec3 val = texelFetch(TU_input,tc,0).rgb;
	for(int i=1;i<nb;++i)
	{
		tc[coord]++;
		val += texelFetch(TU_input,tc,0).rgb;
	}
	
	frag_out = vec4(val/float(nb),1);
}


