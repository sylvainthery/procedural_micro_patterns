#version 300 es
precision highp float;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

layout(location=0) in vec3 position_in;
layout(location=1) in vec2 texcoord_in;

out vec2 tc;


void main()
{
	vec4 P4 = viewMatrix * vec4(position_in, 1.0);
	gl_Position = projectionMatrix * P4;
	tc = texcoord_in;
}

