#version 300 es

void main()
{
	uint id = uint(gl_VertexID);
	gl_Position = vec4(4.0*vec2(id%2u,id/2u)-1.0, 0, 1);
}

