#version 300 es
precision highp float;
uniform highp sampler2D TU_noises;
uniform highp sampler2DArray TU_cm;
uniform float sc;
uniform vec2 tr;
uniform int NB_CM;
uniform int render_out;
in vec2 tc;
uniform int level_max;
uniform float aniso_level;

out vec4 frag_out;

void TriangleGrid(vec2 uv, out vec3 Bi,	out ivec2 vertex1, out ivec2 vertex2, out ivec2 vertex3)
{
	uv *= 3.464; // 2 * sqrt(3)

	const mat2 gridToSkewedGrid = mat2(1.0, 0.0, -0.57735027, 1.15470054);
	vec2 skewedCoord = gridToSkewedGrid * uv;

	ivec2 baseId = ivec2(floor(skewedCoord));
	vec3 temp = vec3(fract(skewedCoord), 0);
	temp.z = 1.0 - temp.x - temp.y;
	if (temp.z > 0.0)
	{
		Bi = temp.zyx;
		vertex1 = baseId;
		vertex2 = baseId + ivec2(0, 1);
		vertex3 = baseId + ivec2(1, 0);
	}
	else
	{
		Bi = vec3(0,1,1) - temp.zyx;
		vertex1 = baseId + ivec2(1, 1);
		vertex2 = baseId + ivec2(1, 0);
		vertex3 = baseId + ivec2(0, 1);
	}
}

vec2 hash(vec2 p)
{
	return fract(sin((p) * mat2(127.1, 311.7, 269.5, 183.3) )*43758.5453);
}

vec3 niceGradiant(float u)
{
	float v = 2.0*u;
	return mix(vec3(0,v,1.0-v),vec3(v-1.0,2.0-v,0),step(1.0,v));
}


void Tile_n_blend_NoAniso(in vec2 uv, out vec2 mean, out vec2 variance)
{
	vec3 B;
	ivec2 vertex1, vertex2, vertex3;
	TriangleGrid(uv, B,//b1, b2, b3,
		vertex1, vertex2, vertex3);

	// Assign random offset to each triangle vertex
	vec2 uv1 = uv + hash(vec2(vertex1));
	vec2 uv2 = uv + hash(vec2(vertex2));
	vec2 uv3 = uv + hash(vec2(vertex3));

	vec2 duvdx = dFdx(uv);
	vec2 duvdy = dFdy(uv);

	vec4 n1 = textureGrad(TU_noises, uv1, duvdx, duvdy);
	vec4 n2 = textureGrad(TU_noises, uv2, duvdx, duvdy);
	vec4 n3 = textureGrad(TU_noises, uv3, duvdx, duvdy);
	vec2 nu = texelFetch(TU_noises, ivec2(0), level_max).xy; 

	B = normalize(B);
	mat3x2 M = mat3x2(n1.xy-nu,n2.xy-nu,n3.xy-nu);
	mean = M*B + nu;

	B *= B;
	mat3x2 S = mat3x2(n1.zw ,n2.zw,n3.zw)/16.0; // because *16 in mipmap creation
	variance = S * B; 
}


void Tile_n_blend_Aniso_X(in vec2 uv, out vec2 mean, out vec2 variance)
{
	vec3 B;
	ivec2 vertex1, vertex2, vertex3;
	TriangleGrid(uv, B,//b1, b2, b3,
		vertex1, vertex2, vertex3);

	// Assign random offset to each triangle vertex
	vec2 uv1 = uv + hash(vec2(vertex1));
	vec2 uv2 = uv + hash(vec2(vertex2));
	vec2 uv3 = uv + hash(vec2(vertex3));

	vec2 duvdx = dFdx(uv);
	vec2 duvdy = dFdy(uv);

	float Px = length(duvdx);
	float Py = length(duvdy);
	float Pmax = max(Px,Py);
	float TW = float(textureSize(TU_noises,0).x);
	float Pmin = min(Px,Py);
	float N = min(ceil(Pmax/Pmin),aniso_level);
	float lod = log2(Pmax/N*TW);

	N = min(N,ceil(Pmax*TW));
	int NB = int (N);
	B = normalize(B);
	vec3 B2 = B*B;

	N = float(NB+1);
	vec2 sum_mean= vec2(0);
	vec2 sum_ms = vec2(0);
	vec2 dUV = (Px>Py)?duvdx:duvdy;
	for (int i=1;i<=NB;++i)
	{
		vec2 dw = dUV*(float(i)/N-0.5);
		vec4 n1 = textureLod(TU_noises, uv1+dw, lod);
		vec4 n2 = textureLod(TU_noises, uv2+dw, lod);
		vec4 n3 = textureLod(TU_noises, uv3+dw, lod);
		vec2 nu = texelFetch(TU_noises, ivec2(0), level_max).xy;

		mat3x2 M = mat3x2(n1.xy-nu,n2.xy-nu,n3.xy-nu);
		vec2 l_mean = M*B + nu;
		sum_mean += l_mean;
		mat3x2 S = mat3x2(n1.zw ,n2.zw,n3.zw)/16.0; // because *16 in mipmap creation
		sum_ms += l_mean*l_mean + S * B2; 
	}
	N=float(NB);
	mean = sum_mean / N;
	variance = sum_ms / N - mean*mean;
	
}

vec3 proceduralNoise(vec2 uv)
{
	vec2 uv_cm;
	vec2 sigm2;
	if (aniso_level<=1.0)
		Tile_n_blend_NoAniso(uv, uv_cm, sigm2);
	else
		Tile_n_blend_Aniso_X(uv, uv_cm, sigm2);
	vec2 sigma = sqrt(sigm2);
	vec2 var = clamp(sigma*256.0 ,vec2(1.0),vec2(pow(2.0,float(NB_CM))-0.1));
	vec2 flod = log2(var);
	ivec2 ilod = ivec2(floor(flod));
	vec2 t = fract(flod);
	ivec2 ilodr = ivec2(round(flod));
/*
	int il = NB_CM*ilod.y+ilod.x;
	vec3 Col0 = mix(texture(TU_cm,vec3(uv_cm,il)).rgb,texture(TU_cm,vec3(uv_cm,il+1)).rgb,t.x);
	il += NB_CM;
	vec3 Col1 = mix(texture(TU_cm,vec3(uv_cm,il)).rgb,texture(TU_cm,vec3(uv_cm,il+1)).rgb,t.x);
	vec3 Col = mix(Col0,Col1,t.y);
*/
	switch(render_out)
	{
		case 0:
			return texture(TU_cm,vec3(uv_cm, NB_CM*ilodr.y+ilodr.x)).rgb; //Col;
		case 1:
			return vec3(uv_cm.x);
		case 2:
			return vec3(uv_cm.y);
		default:
			return vec3(1,1,1);
	}
	return vec3(1,1,1);
}

void main()
{
	vec3 texel = proceduralNoise((tc+tr)*sc);

	frag_out = vec4(texel,1);
}
