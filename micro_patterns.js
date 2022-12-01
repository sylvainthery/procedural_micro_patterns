"use strict"

var prg_compute_compact = null;
var prg_compute_aniso_compact = null;

var prg_new_noise = null;
var prg_blur = null;
var prg_copy = null;
var prg_glob = null;
var prg_mean = null;
var prg_inputs = null;
var tex_n1 = null;
var tex_n2 = null;
var tex_nvnv = null;
var tex_nv_ani = null;
var tex_cm = null;
var object = null;			
var selected_shader = 0;
var rot_speed = 0;
var filtering_sel=0;
const par_filtering=[gl.NEAREST,gl.LINEAR,gl.NEAREST_MIPMAP_NEAREST,gl.LINEAR_MIPMAP_NEAREST,gl.LINEAR_MIPMAP_LINEAR];


var sc = 4.0;
var tr = [0.0,0.0];
var dtr = [0.0,0.0];
var aniso = 1.0;

var show_inputs=true;

var config = [
	["stone","noise_pierre_1", "noise_pierre_2","cm11"],
	["bark","noise_ecorce_1", "noise_ecorce_2","cm10"],
	["camouflage","noise_1024_2", "noise_1024_4","cm1"],
	["green","noise_1024_4", "noise_1024_2","cm2"],
	["blue","noise_256_2", "noise_256_4","cm5"],
	["lava","noise_1024_2", "noise_1024_4","cm8"],
	["water","n1", "n2","eau_cm"],
	["hexa","n1", "n2","hexa_cm"],
	["phasor_sand","noise_sin_3","noise_cos_3", "colormap_phasor_sand"],
	["phasor_sin","noise_sin_1","noise_cos_1", "colormap_phasor_sin"],
	["phasor_square","noise_sin_1","noise_cos_1", "colormap_phasor_square"],
];

var config_names=[]



var tcolormap = null;
var render_out = 0;

const StorageTexFormat = [gl.RGBA32F, gl.RGBA16F, gl.RGBA8];
var indStorFilter=2;
var indNoiseFilter=2;
var indCMFilter=2;
var NB_CM=7;


var last_time=0;;
var alphaZ=0;

var canvas_ratio = 1.0;

function precompute_blur(cm_tex_img, cm_tex_array)
{
	let widthCM = NB_CM;
	let width = cm_tex_img.width;
	tex_cm.alloc(width,width,widthCM*widthCM,StorageTexFormat[indCMFilter]);
	
	let column = [];
	for(let i=0;i<widthCM;++i)
	{
		column.push(Texture2d());
		column[i].alloc(width,width,gl.RGBA32F);
	}

	let tex_ba = Texture2d();
	tex_ba.alloc(width,width,gl.RGBA32F);
	let tex_bb = Texture2d();
	tex_bb.alloc(width,width,gl.RGBA32F);
	let fbos=[FBO(tex_ba),FBO(tex_bb)];
	let fbo_readers=[FBO_READ(tex_ba),FBO_READ(tex_bb)];

	let tex_buffer = Texture2d();
	tex_buffer.alloc(width,width,StorageTexFormat[indCMFilter]);
	let fbo_buffer=FBO(tex_buffer);
	let fbo_buffer_read = FBO_READ(tex_buffer);

	let in_reader = FBO_READ(cm_tex_img);
	
	in_reader.bind();
	fbos[1].texture(0).bind();
	gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,width);

	gl.disable(gl.DEPTH_TEST);
	push_fbo();
	prg_blur.bind();
	Uniforms.coord = 1;
	let k=0;
	//for(let i=0;i<widthCM-1;++i)
	for(let i=0;i<widthCM;++i)
	{
		let p2i = 1<<(2*i);
		while(k<p2i)
		{
			fbos[k%2].bind();
			Uniforms.TU_input = fbos[(k+1)%2].texture(0).bind(0);
			gl.drawArrays(gl.TRIANGLES,0,3);
			++k;
		}
		fbo_readers[(k-1)%2].bind();
		column[i].bind();
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,width);
	}

	// fbos[k%2].bind();
	// prg_mean.bind();
	// Uniforms.coord=1;
	// Uniforms.TU_input = fbos[(k+1)%2].texture(0).bind(0);
	// gl.drawArrays(gl.TRIANGLES,0,3);
	// ++k;

	// fbo_readers[(k-1)%2].bind();
	// column[widthCM-1].bind();
	// gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,width);

	prg_blur.bind();
	Uniforms.coord = 0;
	let id_cm = 0;
	for(let j=0;j<widthCM;++j)
	{
		in_reader = FBO_READ(column[j]);
		in_reader.bind();
		fbos[1].texture(0).bind();
		gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,width);
		k=0;
		// for(let i=0;i<widthCM-1;++i)
		for(let i=0;i<widthCM;++i)
		{
			let p2i = 1<<(2*i);
			while(k<p2i)
			{
				fbos[k%2].bind();
				prg_blur.bind();
				Uniforms.TU_input = fbos[(k+1)%2].texture(0).bind(0);
				gl.drawArrays(gl.TRIANGLES,0,3);
				++k;
			}
			fbo_buffer.bind();
			prg_copy.bind();
			Uniforms.TU_input = fbos[(k-1)%2].texture(0).bind(0);
			gl.drawArrays(gl.TRIANGLES,0,3);
			fbo_buffer_read.bind();
			cm_tex_array.bind();
			gl.copyTexSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,id_cm++,0,0,width,width);
		}

		// fbos[k%2].bind();
		// prg_mean.bind();
		// Uniforms.coord=0;
		// Uniforms.TU_input = fbos[(k+1)%2].texture(0).bind(0);
		// gl.drawArrays(gl.TRIANGLES,0,3);
		// ++k;
		// fbo_buffer.bind();
		// prg_copy.bind();
		// Uniforms.TU_input = fbos[(k-1)%2].texture(0).bind(0);
		// gl.drawArrays(gl.TRIANGLES,0,3);
		// fbo_buffer_read.bind();
		// cm_tex_array.bind();
		// gl.copyTexSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,id_cm++,0,0,width,width);
	}

	pop_fbo();
}



function precompute_compacted(in_n1, in_n2, out_compact)
{	
	let level = 0;
	let lp2 = 1;
	let w = in_n1.width;
	let tex_b = Texture2d();
	tex_b.alloc(w,w,StorageTexFormat[indNoiseFilter]);
	let fbo = FBO(tex_b);
	let fbor = FBO_READ(tex_b);
	push_fbo();
	gl.disable(gl.DEPTH_TEST);
	prg_compute_compact.bind();
	while(w>=1)
	{
		fbo.bind();
		gl.viewport(0,0,w,w);
		Uniforms.l = level;
		Uniforms.lp2 = lp2;
		Uniforms.TU_in1 = in_n1.bind(0);
		Uniforms.TU_in2 = in_n2.bind(1);
		gl.drawArrays(gl.TRIANGLES,0,3);
		out_compact.alloc(w,w,StorageTexFormat[indNoiseFilter],null,level);
		out_compact.bind();
		fbor.bind();
		gl.copyTexSubImage2D(gl.TEXTURE_2D,level,0,0,0,0,w,w);
		w /= 2;
		level++;
		lp2 *= 2;
	}
	pop_fbo();
}
	

function load_config(id)
{
	let proms = [];
	proms.push(tex_n1.load("data/"+config[id][1]+".png",gl.R8));
	proms.push(tex_n2.load("data/"+config[id][2]+".png",gl.R8));
	proms.push(tcolormap.load("data/colormap/"+config[id][3]+".png",gl.RGBA32F));
	Promise.all(proms).then(()=>
		{
			let t0 = performance.now();
			precompute_compacted(tex_n1,tex_n2,tex_nvnv);
			tex_nvnv.simple_params(gl.REPEAT,gl.LINEAR_MIPMAP_LINEAR);
//			gl.flush();
			let t1 = performance.now();
			ewgl.console.info_nl("Precomputed  variance mipmaps in "+(t1-t0)+" ms");
			precompute_blur(tcolormap,tex_cm);
			let t2 = performance.now();
			ewgl.console.info_nl("Precomputed filtering colormap in "+(t2-t1)+" ms");
			update_wgl();
		});
}



function ihm()
{
	UserInterface.begin(false,true); 
	UserInterface.use_field_set("H","Choose noises/colormap");
	UserInterface.add_list_input(config_names, 0, x=>{load_config(parseInt(x)); update_wgl();});
	UserInterface.add_check_box("show",show_inputs, x=>{show_inputs = x; update_wgl();});
	UserInterface.end_use()

	UserInterface.add_slider("scale texture coordinates",1,32,sc,(x) => { sc = parseInt(x); update_wgl(); });
	
	UserInterface.use_field_set("V","Animation")
	UserInterface.add_button("Reset",() => {
		sl_rot.value = 0;
		sl_rot.oninput();
		sl_tx.value = 50;
		sl_tx.oninput();
		sl_ty.value = 50;
		sl_ty.oninput();
	});
	let sl_rot = UserInterface.add_slider("rotation",0,250,rot_speed*50,(x) => {
		 rot_speed = 0.02*x;
		 ewgl.continuous_update = (rot_speed>0) || (dtr[0]>0) || (dtr[1]>0) ;
		 update_wgl(); });

	let sl_tx = UserInterface.add_slider("translation_U",0,100,50,(x) => {
			dtr[0] = (x-50)/2000.0;
			ewgl.continuous_update = (rot_speed>0) || (dtr[0]!==0) || (dtr[1]!==0) ;
			update_wgl(); });
	let sl_ty = UserInterface.add_slider("translation_V",0,100,50,(x) => {
			dtr[1] = (x-50)/2000.0;
			ewgl.continuous_update = (rot_speed>0) || (dtr[0]!==0) || (dtr[1]!==0) ;	
			update_wgl(); });

	UserInterface.end_use();

	UserInterface.add_slider("Aniso",0,4,0, x => { aniso = Math.pow(2,x); update_wgl();},x => Math.pow(2,x));

	UserInterface.add_radio("V","Render",
	["patterns","noise x","noise y "],
	 render_out,(x) => {
		render_out = parseInt(x);
		update_wgl();});

	UserInterface.use_field_set("H","camera")
 	UserInterface.add_button("1",()=>{ ewgl.scene_camera.look(Vec3(0,-1,0.05),Vec3(0,1,-0.125),Vec3(0,0,1));update_wgl();})
	UserInterface.add_button("2",()=>{ ewgl.scene_camera.look(Vec3(0,-1,0.15),Vec3(0,1,-0.25),Vec3(0,0,1));update_wgl();})
	UserInterface.add_button("3",()=>{ ewgl.scene_camera.look(Vec3(0,-1,0.25),Vec3(0,1,-0.5),Vec3(0,0,1));update_wgl();})
	UserInterface.add_button("4",()=>{ ewgl.scene_camera.look(Vec3(0,-1,0.35),Vec3(0,1,-0.75),Vec3(0,0,1));update_wgl();})
	UserInterface.add_button("5",()=>{ ewgl.scene_camera.look(Vec3(0,-0.5,2),Vec3(0,0.1,-5),Vec3(0,0,1));update_wgl();})
	UserInterface.end_use();

	UserInterface.end();
}


function init_wgl()
{
	for (let  co of config)
	{
		config_names.push(co[0]);
	}
	tex_n1 = Texture2d();
	tex_n1.simple_params(gl.NEAREST_MIPMAP_NEAREST);
	tex_n2 = Texture2d();
	tex_n2.simple_params(gl.NEAREST_MIPMAP_NEAREST);
	tex_nvnv = Texture2d();
	tex_cm = Texture2dArray();
	tcolormap = Texture2d();
//	tcolormap.alloc(256,256,gl.RGBA32F);
	pause_wgl();
	Promise.all([ShaderProgramFromFiles("implicit_quad.vert","mipmap_compact.frag","compact"),
				ShaderProgramFromFiles("implicit_quad.vert","gauss_blur.frag","blur"),
				ShaderProgramFromFiles("textured_mesh.vert","micro_patterns.frag","new_noise"),
				ShaderProgramFromFiles("implicit_quad.vert","copy_tex.frag","copy_cm"),
				ShaderProgramFromFiles("implicit_quad.vert","mean.frag","mean_dir"),
				ShaderProgramFromFiles("textured_mesh.vert","dbg_inputs.frag","inputs"),
			]).then(([p0,p1,p2,p3,p4,p5])=>
				{
					prg_compute_compact = p0;
					prg_blur = p1;
					prg_new_noise = p2;
					prg_copy = p3
					prg_mean = p4;
					prg_inputs = p5;
					ihm();
					load_config(0);
					setTimeout( ()=> {ewgl.console.toggle(false);},3000);
				});


	object = Mesh.Grid(2).renderer(0,-1,1,-1);
	ewgl.scene_camera.set_scene_radius(4);

	ewgl.scene_camera.look(Vec3(0,-1,0.25),Vec3(0,1,-0.5),Vec3(0,0,1));

	ewgl.console.set_max_nb_lines(6);

	FileDroppedOnCanevas((files, mx, my)=>{
		let sc = 0.5*Math.min(canvas_ratio,1.0/canvas_ratio);

		let loaded = 0
		let proms = [];
		if (files.length > 1)
		{
			for (let f of files)
			{
				if (f.name.substr(0,8)==="colormap")
				{
					loaded |= 4;
					proms.push(tcolormap.load(f,gl.RGBA32F));
				}
				if (f.name.substr(0,6)==="noiseY")
				{
					loaded |= 2;
					proms.push(tex_n2.load(f,gl.R8));
				}
				if (f.name.substr(0,6)==="noiseX")
				{
					loaded |= 1;
					proms.push(tex_n1.load(f,gl.R8));
				}
			}
		}
		else
		{
			let f = files[0];
			// let sc = 0.5*Math.min(canvas_ratio,1.0/canvas_ratio);
			// let M = Vec2(mx,my);
			// let V = M.sub(Vec2(-sc,0));
			// let d = V.length()/1.2;
			// if (d <sc)
			// {
			// 	loaded |= 4;
			// 	proms.push(tcolormap.load(f,gl.RGBA32F));
			// }
			// V = M.sub(Vec2(sc*0.8,sc*0.8));
			// d = V.length()/0.96;
			// if (d<sc)
			// {
			// 	loaded |= 1;
			// 	proms.push(tex_n1.load(f,gl.R8));
			// }
			// V = M.sub(Vec2(sc*0.8,-sc*0.8));
			// d = V.length()/0.96;
			// if (d<sc)
			// {
			// 	loaded |= 2;
			// 	proms.push(tex_n2.load(f,gl.R8));
			// }
			if (mx<0)
			{
				loaded |= 4;
				proms.push(tcolormap.load(f,gl.RGBA32F));
			}
			else {
				if (my<0)
				{
					loaded |= 2;
					proms.push(tex_n2.load(f,gl.R8));
				}
				else
				{
					loaded |= 1;
					proms.push(tex_n1.load(f,gl.R8));
				}
			}
		}

		Promise.all(proms).then(()=>
		{
			if ((loaded&3) !== 0)
			{
				precompute_compacted(tex_n1,tex_n2,tex_nvnv);
			}
			if ((loaded&4) !== 0)
			{
				precompute_blur(tcolormap,tex_cm);
			}
			update_wgl();
		});
	})

}



function draw_wgl()
{
	let dt = ewgl.current_time - last_time;
	last_time = ewgl.current_time;
	tr[0] += dt * dtr[0];
	tr[1] += dt * dtr[1];
	alphaZ += rot_speed*dt;
	const proj = ewgl.scene_camera.get_projection_matrix();
	const view = ewgl.scene_camera.get_view_matrix();

	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.1,0.1,0.2,1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	tex_cm.simple_params(gl.LINEAR);
	tex_nvnv.simple_params(gl.LINEAR_MIPMAP_LINEAR);

	prg_new_noise.bind();
	Uniforms.projectionMatrix = proj;
	Uniforms.TU_noises = tex_nvnv.bind(0);
	Uniforms.TU_cm = tex_cm.bind(1);
	Uniforms.level_max = Math.log2(tex_nvnv.width);
	Uniforms.aniso_level = aniso;
	Uniforms.sc = sc;
	Uniforms.tr = tr;
	Uniforms.NB_CM = NB_CM
	Uniforms.render_out = render_out;

	const vm =view.mult(Matrix.rotateZ(alphaZ).mult(Matrix.scale(2,2,1)));
	Uniforms.viewMatrix = vm;
		object.draw(gl.TRIANGLES);

	if (show_inputs)
	{
		prg_inputs.bind();
		Uniforms.projectionMatrix =  Matrix.ortho2D();
		let sc = 0.5*Math.min(canvas_ratio,1.0/canvas_ratio);
		Uniforms.viewMatrix = Matrix.scale(sc,sc,1).mult(Matrix.translate(-1.0,0,0));
		Uniforms.TU = tcolormap.bind(0);
		Uniforms.channel = -1;
		object.draw(gl.TRIANGLES);
		Uniforms.viewMatrix = Matrix.scale(sc,sc,1).mult(Matrix.translate(1.0,1.0,0).mult(Matrix.scale(0.8,0.8,1)));
		Uniforms.TU = tex_nvnv.bind(0);
		Uniforms.channel = 0;
		object.draw(gl.TRIANGLES);
		Uniforms.viewMatrix = Matrix.scale(sc,sc,1).mult(Matrix.translate(1.0,-1.0,0).mult(Matrix.scale(0.8,0.8,1)));
		Uniforms.TU = tex_nvnv.bind(0);
		Uniforms.channel = 1;
		object.draw(gl.TRIANGLES);

	}

}

function onkeydown_wgl(k)
{
	if (k=='s')
	{
		[tex_n1,tex_n2] = [tex_n2,tex_n1];
		precompute_compacted(tex_n1,tex_n2,tex_nvnv);
		update_wgl();
	}

}

function resize_wgl(w,h)
{
	canvas_ratio = h/w;
}
ewgl.launch_3d();
