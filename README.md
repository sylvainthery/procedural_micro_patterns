# Color-mapped noise vector fields for generating procedural micro-patterns

Interactive WebGL demonstration code of article
[Color-mapped noise vector fields for generating procedural micro-patterns](http://igg.unistra.fr/People/grenier/micro-patterns/)
Presented at [Pacific Graphic 2022](https://pg2022.org/)



# Description

The software is a WebGL implementation of our real-time generation and
filtering of structured procedural micro-patterns. After loading, the
main part of the screen show different things: the rendered texture on a
plan in the background and input data (noises and colormap) in the
foreground.


# Graphic interface

On the left, the interactive options are the following:
- "Choose noise/colormap"
     * list: list of the possible choice of patterns;
     * "show" button: radio button to show/hide the input noises and the
color-map used;
- "Scale texture coordinate": modify the scale of the patterns;
- "Animation"
     * "Reset": reset button to withdraw the animations;
     * "Rotation": animating the textured plan with a rotation around z
axis
     * "Translation_U": animating the textured plan with a translation
along u axis
     * "Translation_V": animating the textured plan with a translation
along v axis
- "Aniso": control the anisotropy of the filtering footprint;
- "Render": choose to render either the patterns, the x noise, or the y
noise;
- "Camera": different points of view for the scene;


# Requirement

As it is a WebGL implementation, it runs on every operating system. It
just needs a compatible web browser (Microsoft Edge, Firefox, Google
Chrome or Safari for example) and a live server to run
(the Live Server extension on Visual Studio Code or local webserver launch with `python3 -m http.server`)

It should run on any configuration, but of course de discrete graphic GPU (with dedicated memory), will provide you better performance


# Reproduce Figure

The final figure of the article (Figure 15) where obtain by taking
screenshots of the rendering without changing the parameters (only
hiding the input data and the graphic interface by clicking on the top
left of the web page).