#version 300 es

precision highp float;
uniform sampler2D TU_in1;
uniform sampler2D TU_in2;
uniform int l;
uniform int lp2;  // 2^l

out vec4 frag_out;
void main()
{
	ivec2 p = ivec2(gl_FragCoord.xy);
	float El1 = texelFetch(TU_in1,p,l).r;
	float El2 = texelFetch(TU_in2,p,l).r;
	p *= lp2; // for level 0 access
	float var1 = 0.0;
	float var2 = 0.0;
	for (int j=0; j<lp2; ++j)
		for (int i=0; i<lp2; ++i)
		{
			ivec2 q = p + ivec2(i,j);
			float v1 = texelFetch(TU_in1,q,0).r - El1;
			var1 += v1*v1;
			float v2 = texelFetch(TU_in2,q,0).r - El2;
			var2 += v2*v2;
		}
	// /16 car var*16 pour pour étaler sur 8bits
	float nb = float(lp2*lp2)/16.0;
	frag_out = vec4(El1,El2,var1/nb,var2/nb);
}