# EasyWebGL

Easy WGL est une librairie Javascript qui simplifie au maximum la syntaxe des appels OpenGL, mais sans cacher aucun concept ni mécanisme. Cela se fait principalement par l'intermédiare d'objet javascipt créé par des fonction génératrices.

## Browser supportés

Actuellement WebGL 2 n'est supporté que par Google-Chrome, Firefox et Opera

Conseil:

* toujours garder la console de debug ouverte
* désactiver le cache en mode debug

## Travailler local

Installer la librairie de la manière suivante:
* créer un répertoire (par exemple WebGL), qui sera votre server local
* installer la librarie dedans (dans son répertoire easywebgl)
* installer vos scripts (et les launchers voir plus loin) à la racine ou dans un répertoire.


Pour travailler sans serveur web dédié plusieurs solutions:

* `python3 -m http.server`
* `python2 -m SimpleHTTPServer`
* installer _Apache_
* Sous Windows: tinyweb
* ou utiliser __VisualStudio Code & l'extension liver server__


Avec le serveur python il suffit alors d'ouvrir l'URL _localhost:8000_

__Attention__ travailler avec file:// en local ne marche que
dans certaine condition avec qq version spécifique de certains
browser. __A éviter__


## index.html launcher html & launcher_tactile

Copier ces 3 fichiers dans le répertoires ou vous placer vos
scripts. 

Index doit être modifié avec la liste des scripts présents (voir commentaires).
Il générera automatiquement les bons liens.

Si vous utilier index.html?XXX ou ?XXX, il vous redirigera 
directement vers launch.html?XXX ou launch_tactile.html?XXX
Ce qui lancera le script XXX.js

```javascript
let NBP = script_params[0] ? parseInt(script_params[0]) : 250;
```

## Interface

### Widgets

L'interface utilisateur se crée en javascript et apparait à gauche de la fenêtre de rendu. On peut la faire apparaitre/disparaitre en cliquant dans coin haut-gauche de la fenêtre.

### Console

Une console en bas affiche les messages envoyés dans:

* `ewgl.console.info(xxxxx)`
* `ewgl.console.warning(xxxxx)`
* `ewgl.console.error(xxxxx)`.  

les mêmes avec saut de ligne

* `ewgl.console.info_nl(xxxxx)`
* `ewgl.console.warning_nl(xxxxx)`
* `ewgl.console.error_nl(xxxxx)`.  

On peut la faire apparaitre/disparaitre en cliquant dans le coin bas-gauche de la fenêtre de rendu avec le bouton gauche. LE bouton droit efface la console (appel de è `ewgl.console.clear()`)

### callback à implémenter (si nécessaire)

* `init_wgl()` appelé une fois avant draw
* `draw_wgl()` appelé pour retracer
* `resize_wgl(w,h)` appelé si redimensionnement
* `onkeydown_wgl(k)` appelé si touche appuyé (k=chaine de la touche)
* `onkeyup_wgl(k)` appelé si touche relachée (k=chaine de la touche)
* `mousemove_wgl(ev)` appelé si la souris a bougée
* `mousedown_wgl(ev)` appelé si un bouton est appuyé
* `mouseup_wgl(ev)` appelé si un bouton est relaché

ev contient:

* clientX, clientY: position souris
* shiftKey, ctrlKey, altKey booléen touche enfoncée?
* button: bouton enfoncé (0,1,2)
* ...

### Affichage en continu

Par défaut l'affichage n'est rafraichi que si on déplace les objets à la souris ou par un appel explicite à _update\_wgl_
Pour afficher une animation en continu, il est possible de forcerle rafraichissement en continu en fixant la variable `ewgl.continuous_update` à _true_. (_false_ pour arrêter)
La variable `ewgl.current_time` contient le temps qui s'écoule en seconde (_double_)
La variable `ewgl.fps` contient la vitesse courante de rafraichissement.
La fonction `pause_wgl()` permet de stopper le rendu, qui sera relancer oar un appel à `update_wgl()` qui
demande la mise à jour de l'affichage. La pause est pratique pour empêcher le rendu pendant un chargement.
`resize_update_wgl()` force l'appel à resize avant de faire une mise à jour.

### Image process option

L'appel de ewgl.enable_img_process() fait apparaitre un menu qui permet de choisir le sous-échantillonnage
de l'image ainsi que contraste et luminosité.

L'appel de ewgl.enable_sub_sampling(N) fait le rendu dans une définition divisée par N
fait apparaitre un menu qui permet de choisir le sous-échantillonnage
de l'image ainsi que contraste et luminosité.


### Interface 2D 3D

La dernière ligne du script permet de lancer la boucle événementielle.

* `launch_2d()` simple
* `launch_3d()` avec camera gérée à la souris. La variable scene_camera fournit l'interface suivante:
  * `scene_camera.set_scene_radius(R)` fixe le rayon de la sphère englobante de la scène
  * `scene_camera.set_scene_center(C)` fixe le centre de la sphère englobante de la scène
  * `scene_camera.get_projection_matrix()` renvoit la matrice de projection
  * `scene_camera.get_view_matrix()` renvoit la matrice de vue

Pour charger des ssssscripts ou css avant le démarrage utiliser:
```javascript
ewgl.loadRequiredFiles(liste,callback)
```
Exemple:
```javascript
ewgl.loadRequiredFiles(["advanced.js","special.css"],ewgl.launch_3d);
```

### Couleur

On peut changer (globalement) les couleurs de l'interface

```javascript
UserInterface.set_colors(bg,fg)
```

* __bg__ couleur de fond des widgets
* __fg__ couleur de dessin

Ou directement choisir un thème 

```javascript
UserInterface.set_dark_theme()
UserInterface.set_light_theme()
```

### Initialisation

Pour créer une interface on commence par:

```javascript
UserInterface.begin("Interface",[shader_edit],[show_fps]);
```

* __shader_edit__ booléen: accès à l'edition interactive des shaders
* __show_fps__ booléen: affiche la vitesse de rafraichissement.

Et on finit par:

```javascript
UserInterface.end();
```

### Slider (range-input) 

```javascript
let sl = UserInterface.add_slider(label,min,max,val,func,funcval,dec);
```

* __min,max,val__ valeurs min, max, initiale (__entière uniquement__)
* __func__: fonction (avec la valeur en paramètre) appelée si changement
* __funcval__: function de conversion pour affichage
* __dec__ : nombre de décimales affichées
* `s1.value` -> valeur entiere dans une chaine (attention, utiliser _parseFloat_)
* `sl.easy_value()` -> valeur affichée

### Checkbox

```javascript
let cb = UserInterface.add_check_box(label, val, func);
```

* __val_: valeur booléenne initiale
* __func__: fonction avec la valeur booléenne en paramètre appelée si changement
* `cb.checked` -> valeur booléenne 

### Boutons

```javascript
let b = UserInterface.add_button(label,func);
```

* __label__: chaines de caractères
* __func__: fonction appelée si clic
* `b.value` -> numéro du bouton selectionné

### Boutons-radio

```javascript
let rah = UserInterface.add_horizontal_radio(labels, i, func);
let rav = UserInterface.add_vertical_radio(labels, i, func);
```

* __labels__: Array de chaines de caractères
* __i__: num du bouton selectionné initialement
* __func__: fonction (numéro de selection en paramètre) appelée si changement
* `rav.value` -> numéro du bouton selectionné

### Entrée de texte

```javascript
let cb = UserInterface.add_text_input(text);
```

### Selection dans une liste

```javascript
let liste = UserInterface.add_list_input(items, i, func);
```

* __items__ liste des labels
* __i__ index de la liste initialement sélectionnée
* __func__: fonction (numéro de selection en paramètre) appelée si changement
* `liste.value` -> numéro du bouton selectionné

### Groupe

On peut grouper les widgets avec les méthodes `use_group(dir)` et `end_use()`
`use_field_set(dir,label)` permet de grouper en ajouant une bordure et un label.
Le paramètre __dir__ peut prendre les valeurs __'H'__ ou __'V'__.

### Saut de ligne automatique

Lors de l'ajout de tout widget, on passe automatiquement à la ligne suivante. On peut contrarier cette fonctionnalité en fixant la propriété __auto\_br__ à _false_.

## Vecteurs & Matrices

### Fonctions génératrices des différents types

#### des vecteurs:

* `Vec2()`
* `Vec3()`
* `Vec4()`

les paramètres peuvent être:

* aucun revoit un vecteur nul
* une valeur (qui remplit toutes les composantes)
* _n_  valeurs
* un vecteur
* un mélange vecteurs valeur

On a des _geteurs_: x,y,z,w, xy, xyz
Et des _seteurs_: x,y,z

Exemple:

```javascript
let u = Vec2(3,4);
let v = Vec3(u,5);
let w = Vec4(2,u,5);

w.x = 9;
let s = w.x + w.y + w.z + w.w;
u = w.xy;
```

#### des matrices:

* `Mat2()` : renvoit la matrice identité
* `Mat3()`
* `Mat4()`

* `zeroMat2()` renvoit un matrice remplie de 0
* `zeroMat3()`
* `zeroMat4()`

### Méthodes

* `x.add(y)` _(vecteurs et matrices)_
* `x.sub(y)` _(vecteurs et matrices)_
* `x.mult(y)` _(vecteurs membre à membre et matrices)_
* `x.dot(y)`_produit scalaire sur les vecteurs_
* `x.cross(y)` _produit vectoriel (Vec2 & Vec3)_
* `m.inverse()` _(matrices)_
* `m4.inverse3transpose()` transposée de l'inverse _(matrices 4x4 revoit une 3x3)_
* `m4.rotation3()` renvoit une sous-matrice 3x3   _(matrices 4x4 revoit une 3x3)_
* `m4.column3(i)` ieme colonne d'une matrice 4x4 sou la forme d'un Vec3 (données partagées)
* `m4.position` équivaut à column3(3)
* `m4.Xaxis` équivaut à column3(0)
* `m4.Yaxis` équivaut à column3(1)
* `m4.Zaxis` équivaut à column3(2)

### Fonctions statiques de l'objet Matrix

* `mult(...)` : renvoit la multiplication de plusieurs Matrices. On peut même finir par un vecteur.
* `translate(tx,ty,tz)` génère la matrice de translation 
* `scale(sx,sy,sz)` génère la matrice d'homotéhtie
* `rotateX(b)` génère la matrice de rotation autour de l'axe X d'angle b en degre
* `rotateY(b)` génère la matrice de rotation autour de l'axe Y d'angle b en degre
* `rotateZ(b)` génère la matrice de rotation autour de l'axe Z d'angle b en degre
* `rotate(b,a)` génère la matrice de rotation autour de l'axe a d'angle b en degre
* `ortho(aspect, near, far)` génère la matrice de projection orthogonale
  * aspect ratio x/y
  * near: near plane distance to camera
  * far: far plane distance to camera
* `perspective (fov, aspect, near, far)` génère la matrice de projection perspective
  * fov: field of view, angle/2 in radian (typical PI/4)
  * aspect: ratio x/y
  * near: near plane distance to camera
  * far: far plane distance to camera
* `look(eye, dir, up)` génère une matrice de vue
  * eye: position de la camera
  * dir: direction du visée
  * up: direction verticale de la camera
* `to_quat(m)` convertit la partie orientation de la matrice de transformation m en un quaternion
* `from_quat(q,p)` convertir le quaternion q et la postion p en une matrice de tranformation
* `slerp(qa,qb,t)` interpole les quaternions: _schématiquement (1-t).qa + t.qb_

Exemple:
Soit un point P(1,1,0)
Comment se projète-t-il sur un écran défini par une caméra 16/9 avec focale de 90°,et un Z compris entre 1 et 10, placée en (0,0,5) regardant vers le fond de l'écran:

```javascript
var P = Vec3(1,1,0);
var proj = Matrix.perspective(3.1416/4,16/9,1,10);
var view = Matrix.look(Vec3(0,0,5),Vec3(0,0,-1), Vec3(0,1,0));
var Q4 = Matrix.mult(proj, view, Vec4(P,1));
var Q3 = Q4.xyz.scalarmult(1.0/Q4.w);
console.log('Coordonnees ecran [-1,1]:', Q3.x, Q3.y);
console.log('profondeur:', Q3.z);
```
### Simplification d'écriture (plus lisible)
On ne peut pas surcharger les opérateurs en JS, il est donc impossible d'écrire
```javascript
let P = Vec4(1,1,0,1);
let R = Matrix.rotateZ(20);
let T = Matrix.translate(1,2,0);
let Q = R*T*P;
```
Mais ici on pourra écrire:
```javascript
let P = Vec4(1,1,0,1);
let R = Matrix.rotateZ(20);
let T = Matrix.translate(1,2,0);
let Q = R ['*'] (T) ['*'] (P);
```
`['*'](X)` est équivalent à mult(X)

On peut utiliser `['+'] ['-'] ['+='] ['-='] ['*'] ['/'] ['*='] ['/=']`

Attention légère perte de performance, par rapport à l'utilisation des méthodes.


## OPENGL ES 3.0

### Shader Program

#### Création

```javascript
prg = ShaderProgram(vert, frag, name, first_line_number)
```

* __vert__: variable chaine de caractères du vertex-shader
* __frag__: variable chaine de caractères du vertex-shader
* __name__: nom affiché en cas d'erreur de compilation
* __first_line_number__: numéro de la première ligne de code dans le source, optionnel

#### Création pour Transform-Feedback (pas de fragment shader)

```javascript
prg = ShaderTransformFeedbackProgram(vert, outs, name, first_line_number)
```

* __vert__: variable chaine de caractères du vertex-shader
* __outs__; tableau de chaines des variable en sortie
* __name__: nom affiché en cas d'erreur de compilation
* __first_line_number__: numéro de la première ligne de code dans le source, optionnel


#### Envoit de constantes (uniform):

```javascript
Uniforms.name = v;
```

Envoit la variable/valeur v dans l'uniform name (chaine du nom). Le shader doit être lié (bind)
Envoit n'importe quel type: nombres tableau de nombres, vecteur, matrice, ...

Pour les vecteurs on peut envoyé un VecX ( même dimension) ou un array de JS `[1,1,0]`.

#### attributs

##### identifiant

Récupération de l'id d'un attribut _name_ du shader _prg_:

```javascript
let att_id = prg.in.name
```

Pour plus facilité on utilisera la directive _layout_ de _glsl_ qui permet de fixer 
soit même l'identifiant de l'attribut (_location_) dans le code du shader:

```javascript
layout(location=7) in vec3 position_in;
```


##### standardisés

Afin de pouvoir les utiliser automatiquement pour les afficher les maillages, on utilisera toujours les 
chaines suivantes pou définir les attributs de position, normale, coordonnées de texture et couleurs.

* position_in
* normal_in
* texcoord_in
* color_in

### Buffer de données de sommets (VBO)

#### Création

```javascript
let vbo = VBO(data,nb_floats)
```

* __data__: données à copier FloatArray32 ou Array (null par defaut)
* __nb_floats__: taille du vecteur (2,3,4)

#### Allocation

```javascript
vbo.alloc(nbv) : allocation de __nbv__ vecteurs
```

#### Mise à jour

```javascript
vbo.update(buffer, [offset_dst]): m.a.j. des données
```

* __buffer__: donnée à envoyer (_Float32Array_)
* __offset_dst__: décalage dans la destination en sommet(valeur par défaut 0)

### Buffer d'indices

#### Création

```javascript
let ebo = EBO(buffer)
```

* __buffer__: Uint32Array ou Array 

### Vertex Array Object

#### Création

Un Vertex Array Object VAO fait le lien entre un ensemble de VBO et les attributs du _Vertex_Shader_ dans lequel les données vont arriver.

```javascript
let vao = VAO([id_attribut,vbo], [id_attribut,vbo], ....)
let vao = VAO([id_attribut,vbo,divisor], [id_attribut,vbo,divisor], ....)
let vao = VAO([id_attribut,vbo,divisor,pas,decalage,taille],  ....)
```

Permière syntaxe simple, on passe pour chaque VBO utilisé, un couple identifiant,vbo.
La deuxième syntaxe est à utiliser avec les fonctions de tracer avec _instancing_.
La troisième permet l'tuilisation de VBO entrelacés.

### Texture 2d

#### Création

```javascript
let t = Texture2d([param,value],[param,value], ....)
```

Couples __param,value__:  voir [la documentation de gl.texParameter](https://developer.mozilla.org/fr/docs/Web/API/WebGLRenderingContext/texParameter)

#### Paramétrage simplié

```javascript
t.simple_params(value,value);
```

Déduit le paramètre à mettre à jour depuis la valeur. 
Exemple, pour utiliser le filtrage linéaire (pour les deux cas MIN et MAG) et rendre la texture cyclique dans toutes les directions:
On utilisera:

```javascript
t.simple_params(gl.LINEAR, gl.REPEAT);
```

#### Allocation

```javascript
t.alloc(w, h, internal_format, buffer)
```

* __w__: largeur
* __h__: hauteur
* __internal_format__: format de stockage interne dans la carte (_gl.RGB8_)
* __buffer__: TypedArray (Uint8Array, Float32Array ...) à copier  ou null

Le format externe et le type des données sont déduits depuis le format interne

Les formats reconnus sont:

* classiques sur 1 octet:`gl.R8`, `gl.RG8`,`gl.RGB8`,`gl.RGBA8`
* les variantes 16bits: `gl.R16`, `gl.RG16`,`gl.RGB16`,`gl.RGBA16`
* les variantes flottante: `gl.R32F`, `gl.RG32F`,`gl.RGB32F`,`gl.RGBA32F`
* les variantes float16 `16F ...`
* les variantes entière (8 16 32 bit) `8I,16I,32I`
* les variantes entière non signé (8 16 32 bit) `8UI,16UI,32UI`
* les textures de profondeurs `gl.DEPTH_COMPONENT32F`

#### Initialisation & resize

On peut séparer l'initialisation de l'allocation/resize.
Utilisation uniquement dans le cadre des FBO.

```javascript
t.init(internal_format)
t.resize(w,h)
```

#### Mise à jour

```javascript
t.update(buffer,level=0):
```

```javascript
t.update_sub(x,y,w,h,buffer,level=0):
```

Le paramètre level définit le niveau de mipmapping à mettre à jour.

#### Chargement image

```javascript
t.load(url, internal_format,[external_format])
```

* url: adresse de l'image (format supporté par html)
* internal_format: format de stockage interne dans la carte
* retourne une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Utiliser_les_promesses)

#### Utilisation

Pour utiliser une texture dans un shader, il faut lier la texture, activer le moteur de texture et passer le numéro du moteur à l'uniform de type _sampler2D_.
La méthode bind lie, active le moteur et renvoit le numéro.

```javascript
Uniforms.TUcolor = t.bind(e)
```

* __e__: numéro de l'unité de texture à activer et utiliser (0,1,2,3,...)
Ici associéé au sampler2D TUcolor du shader.

Attention à toujours utiliser des moteurs de textures distincts dans un même shader !


### Texture 3d

#### Création

```javascript
let t = Texture3d([param,value],[param,value], ....)
```

#### Allocation

```javascript
t.alloc(w, h, d, internal_format, external_format, buffer)
```

* __w__: largeur
* __h__: hauteur
* __d__: profondeur
* __internal_format__: format de stockage interne dans la carte
* __external_format__: format des données à copier (buffer)
* __buffer__: TypedArray (Uint8Array, Float32Array ...) à copier

#### Mise à jour

```javascript
t.update(w,h,buffer)
```

### Texture 2d Array

#### Création

```javascript
let t = Texture2dArray([param,value],[param,value], ....)
```

Couples __param,value__:  voir [la documentation de gl.texParameter](https://developer.mozilla.org/fr/docs/Web/API/WebGLRenderingContext/texParameter)


#### Allocation

```javascript
t.alloc(w, h, n, internal_format, external_format, buffer)
```

* __w__: largeur
* __h__: hauteur
* __n__: nombre
* __internal_format__: format de stockage interne dans la carte (_gl.RGB8_)
* __buffer__: TypedArray (Uint8Array, Float32Array ...) à copier

#### Mise à jour

```javascript
t.update_sub(i,x,y,w,h,external_format, buffer):
```

* __i__ numero de la texture
* __x__: position
* __y__: position
* __w__: largeur
* __h__: hauteur
* __buffer__: TypedArray (Uint8Array, Float32Array ...) à copier


## TextureCubeMap

#### Création

```javascript
let t = TextureCubeMap([param,value],[param,value], ....)
```

Couples __param,value__:  voir [la documentation de gl.texParameter](https://developer.mozilla.org/fr/docs/Web/API/WebGLRenderingContext/texParameter)

#### Chargement images

```javascript
t.load(urls, internal_format)
```

* url: adresses des 6 images (format supporté par html)
* internal_format: format de stockage interne dans la carte
* retourne une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Guide/Utiliser_les_promesses)

#### Utilisation

```javascript
prg.uniform.TU = t.bind(e) 
```

### Frame Buffer Object

Un FBO permet de _rediriger_ la sortie d'un fragment shader vers une ou plusieurs textures (MRT).

#### Création sans tampon de profondeur

```javascript
let fbo = FBO(colors_attach)
```

* __colors_attach__: texture ou tableau de textures (_2d_)

#### Création avec tampon de profondeur (Z_Buffer)

```javascript
let fbo = FBO_Depth(colors_attach,fbo_depth_shared)
```

* __colors_attach__: texture ou tableai de textures (2d)
* __fbo_depth_shared__: autre fbo avec lequel on partage le Z_Buffer (optionnel)

#### Création avec texture tampon de profondeur (Z_Buffer)

Si on veut  utiliser la texture de profondeur, il faut utiliser ce générateur. Le précédent utilise un _RenderBuffer_ et pas une _Texture_.
Remarque: d'après la documentation, cette version sera plus lente.

```javascript
let fbo = FBO_DepthTexture(colors_attach,fbo_depth_shared)
```

* __colors_attach__: texture ou tableai de textures (2d)
* __fbo_depth_shared__: autre fbo avec lequel on partage le Z_Buffer ou texture (optionnel)

#### re-dimensionnement

Attention il faut souvent redimensionner les textures du FBO quand la taille de la fenêtre change (tuilisation dans le callback _resize_wgl_)

```javascript
fbo.resize(w,h);
```

#### récupération des informations

* `t.width`
* `t.height`
* `t.textures(i)` : ieme texture (si plusieurs)
* `t.depth_texture` : texture de profondeur si elle existe.

### Binding

Permet de choisir l'objet utilisé par OpenGL.  
Pour les utiliser (paramétrage ou tracé) il faut _bindé_:

* les shader-program
* les VBO
* les VAO
* les EBO
* les textures
* les FBO

```javascript
obj.bind()
```

### Unbinding:

Il n'est pas toujours nécessaire de _unbindé_ un obj (sauf pour les FBO). Le _bind_ suivant s'en charge. 
Mais cela simplifie grandement le debugage

```javascript
unbind_shader()
unbind_vbo()
unbind_ebo()
unbind_vao()
unbind_texture2d()
unbind_texture2dArray()
unbind_textureCubeMap()
unbind_texture3d()
unbind_fbo()
```

### Destruction

Si vous créer des objets ailleur que dans _init\_wgl_, il faut absolument détruire les objet créer (sinon pénurie de mémoire GPU !). 
La plupart des objets créés ont une méthode `gldelete()`.



### Appel OpenGL-ES 3.0

On peut appeler directement toute les fonctions OpenGL, soit:

* en bindant l'objet
* en récupérant l'id OpenGL: `obj.id`

### Transform Feedback

#### création


## MAILLAGES

### Création de primitives

```javascript
let m1 = Mesh.CubePosOnly()
let m1 = Mesh.Cube()
let m2 = Mesh.Sphere(s1)
let m3 = Mesh.Cylinder(s1,s2)
let m4 = Mesh.Tore(s1,r1,s2,r2)
let m5 = Mesh.Wave(s1)
```

* s1,s2: paramètre de subdivision optionnel pour s2
* r1,r2: paramètre de rayon

### Création par lecture de fichier off, obj

#### Par drag n drop

```javascript
let m = Mesh.load(blob).then ( (mesh) => { ... });
```

A utiliser avec FileDroppedOnCanevas, voir exemple.

#### Par lecture directe de fichier

```javascript
let m = Mesh.loadFile(filename).then ( (mesh) => { ... });
```

### Accès à la Bounding-Box (Axis-Aligned)

```javascript
let bb = mesh.BB
```

L'objet __bb__ contient alors __center__ (_Vec3_) __radius__  ainsi que les points __min__ et __max__

### Génération d'un Renderer

Le renderer contient tout ce qu'il faut pour faire l'affichage (VBO,VAO,EBO).

```javascript
let rend = mesh.renderer(p,n,tc,tg,c)
```

* __p__: id d'attibut de position, -1 sinon
* __n__: id d'attibut de normales, -1 sinon
* __tc__: id d'attibut de coordonnées de texture, -1 sinon
* __tg__: id d'attibut de coordonnées de texture, -1 sinon
* __c__: id d'attibut de couleurs , -1 sinon,  ajouter _à la main_ le buffer `mesh.colors`

### Tracer

```javascript
sh_prg.bind();
rend.draw(prim)
shader.bind();
```

* __prim__: gl.POINTS ou gl.LINES ou gl.TRIANGLES

Tout appel à draw doit se faire après avoir lier un programme shader.
