"use strict";

const ewgl_tactile = 
{
	continuous_update : false,
	scene_camera : null,
	scene_manip : null,
	fps : 0,

	launch_3d: function()
	{
		ui_resize = ui_resize_3d;
		ewgl_common.launch();
		ewgl_tactile.launch_tactile();
	},

	launch_2d: function()
	{
		ui_resize = ui_resize_2d;
		ewgl_common.launch();
		ewgl_tactile.launch_tactile();
	},


	console:
	{
		color_info:'#8F8',
		color_error:'#F88',
		color_warning:'#FF8',
		color_def:'#FFF',
		color_bg:'#000B',
		cons: document.getElementById("console"),
		contents: [""],
		internal_on_off : false,
		nb_max_lines : 60,
		
		set_bg_color: function(bg)
		{
			ewgl_tactile.cons_elt.style.backgroundColor = bg;
		},

		set_dark_theme: function()
		{
			this.color_info='#4F4';
			this.color_error='#F44';
			this.color_warning='#FF4';
			this.color_def='#FFF';
			ewgl_tactile.cons_elt.style.backgroundColor = '#444B';
		},

		set_light_theme: function()
		{
			this.color_info='#080';
			this.color_error='#800';
			this.color_warning='#880';
			this.color_def='#888';
			ewgl_tactile.cons_elt.style.backgroundColor = '#BBBB';
		},

		clear: function()
		{
			this.contents = [""];
			this.cons.innerHTML = this.contents.join();
		},
	
		toggle: function(c)
		{
			if (c===undefined)
			{
				c = !this.internal_on_off;
			}
			this.internal_on_off = c;
			ewgl_tactile.console.cons.style.zIndex = (this.internal_on_off) ? 2 : -2;
		}
		, 

		rewind: function(n)
		{
			for (let i=0; i<n; ++i)
			{
				this.contents.pop();
			}
		},
	
		set_max_nb_lines: function(nb)
		{
			while (nb<this.contents.length)
			{
				this.contents.shift();
			}
			this.nb_max_lines = nb;
		},
	
		custom: function(text)
		{
			this.contents.push(text);
			if (this.contents.length > this.nb_max_lines)
			{
				this.contents.shift();
			}
			this.cons.innerHTML = this.contents.join('');
		},
	
		gen: function(pre,br)
		{
			let param = arguments[2];
			if (param === undefined)
			{
//				this.custom("<par style='color:"+this.color_def+"'> UNDEFINED </par>");
				return;
			}
			else if (param.is_matrix)
			{
				switch (param.dim())
				{
					case 2:
					this.gen(pre,br, param.data[0].toFixed(3)+' '+param.data[2].toFixed(3));
					this.gen(pre,br, param.data[1].toFixed(3)+' '+param.data[3].toFixed(3));
					break;
					case 3:
					this.gen(pre,br, param.data[0].toFixed(3)+' '+param.data[3].toFixed(3)+' '+param.data[6].toFixed(3));
					this.gen(pre,br, param.data[1].toFixed(3)+' '+param.data[4].toFixed(3)+' '+param.data[7].toFixed(3));
					this.gen(pre,br, param.data[2].toFixed(3)+' '+param.data[5].toFixed(3)+' '+param.data[8].toFixed(3));
					break;
					case 4:
					this.gen(pre,br, param.data[0].toFixed(3)+' '+param.data[4].toFixed(3)+' '+ param.data[8].toFixed(3)+' '+param.data[12].toFixed(3));
					this.gen(pre,br, param.data[1].toFixed(3)+' '+param.data[5].toFixed(3)+' '+ param.data[9].toFixed(3)+' '+param.data[13].toFixed(3));
					this.gen(pre,br, param.data[2].toFixed(3)+' '+param.data[6].toFixed(3)+' '+ param.data[10].toFixed(3)+' '+param.data[14].toFixed(3));
					this.gen(pre,br, param.data[3].toFixed(3)+' '+param.data[7].toFixed(3)+' '+ param.data[11].toFixed(3)+' '+param.data[15].toFixed(3));
					break;
				}
				return;
			}
			else 
			{
				let str= '';
				for (let i=2; i<arguments.length;++i)
				{
					let p=arguments[i];
					if (p && p.is_vector)
					{
						str += '(' +p.data + ') ';
					}
					else if (typeof p === 'string')
					{
						str += p+' ';
					}
					else
					{
						str += JSON.stringify(p) + ' ';
					}
				}
				this.custom(pre + str + br+ "</par>");
				this.cons.scrollTop = this.cons.scrollHeight;
			}
		},
	
		info: function()
		{
			this.gen("<par style='color:"+this.color_info+"'>", "", ...arguments);
		},
	
		warning: function()
		{
			this.toggle(true);
			this.gen("<par style='color:"+this.color_warning+"'>", "", ...arguments);
		},
	
		error: function()
		{
			this.toggle(true);
			this.gen("<par style='color:"+this.color_error+"'>", "", ...arguments);
		},

		info_nl: function()
		{
			this.gen("<par style='color:"+this.color_info+"'>", "<br>", ...arguments);
		},
	
		warning_nl: function()
		{
			this.toggle(true);
			this.gen("<par style='color:"+this.color_warning+"'>", "<br>", ...arguments);
		},
	
		error_nl: function()
		{
			this.toggle(true);
			this.gen("<par style='color:"+this.color_error+"'>", "<br>", ...arguments);
		},
	}
	,
	enable_img_process: function()
	{
		ProcessImage.enable();
		ProcessImage.add_interface();
	}
	,
	enable_sub_sampling: function(s)
	{
		ProcessImage.enable_sub_sampling(s);
	}
	,
	label_over: function(label,x,y,col)
	{
		let la = document.createElement("label");
		la.innerText = label;
		la.style.position='absolute';
		la.style.Zindex='-9';
		la.style.top = y;
		la.style.left = x;
		la.style.color = col;
		la.style.fontFamily = 'monospace'
		la.style.fontSize = '8';
		ewgl_tactile.canv_cons_elt.appendChild(la);
	},

	ts_start : null,
	acc_fps : 0,
	nb_frames : 0,
	code_editors:[],
	update_needed : true,
	ortho2D : null,
	ortho2D_2 : null,
	subsample : 1,
	canv_cons_elt : document.getElementById("canv_cons"),
	cons_elt : document.getElementById("console"),
	is_elt : document.getElementById("IS"),
	interf_elt : document.getElementById("Interface"),
	interf_toggler_elt : document.getElementById("InterfaceToggler"),
	console_toggler_elt : document.getElementById("ConsoleToggler"),
	shader_zone_elt : document.getElementById("ShaderZone"),
    fs_she: null,
    


	launch_tactile: function()
	{
		if (gl === null)
		{
			ewgl_tactile.console.error("Web GL2 is not supported by this browser");
			return;
		}
		this.ortho2D = Mat4();
		this.ortho2D_2 = Mat2();

		ewgl_tactile.current_time = 0.0;
		init_scene3d();
		init_wgl();
		document.body.onresize = () => {ui_resize();update_wgl();};
		ui_resize();
		internal_update_wgl();
		ewgl_tactile.console.info_nl("<B>WebGL2 context OK</B>");
		const gldebugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		if (gldebugInfo)
		{
			ewgl_tactile.console.info_nl('<B>Vendor:</B> '+ gl.getParameter(gldebugInfo.UNMASKED_VENDOR_WEBGL));
			ewgl_tactile.console.info_nl('<B>Renderer:</B> '+ gl.getParameter(gldebugInfo.UNMASKED_RENDERER_WEBGL));	
		}
	},
}

ewgl_common.console = ewgl_tactile.console;

Matrix.ortho2D = function() 
{
	return ewgl_tactile.ortho2D;
}

Matrix.ortho2D_2 = function() 
{
	return ewgl_tactile.ortho2D_2;
}


//
// INTERFACE
//


function ewgl_rgb_color(col)
{
	let r1=col.charCodeAt(1)-87;
	let r2=col.charCodeAt(2)-87;
	let r = 16 * ((r1<0)?(r1+39):r1) + ((r2<0)?(r2+39):r2);

	let g1=col.charCodeAt(3)-87;
	let g2=col.charCodeAt(4)-87;
	let g = 16 * ((g1<0)?(g1+39):g1) + ((g2<0)?(g2+39):g2);

	let b1=col.charCodeAt(5)-87;
	let b2=col.charCodeAt(6)-87;
	let b = 16 * ((b1<0)?(b1+39):b1) + ((b2<0)?(b2+39):b2);

	ewgl_tactile.console.info(r,g,b, Vec3(r,g,b));
	return Vec3(r,g,b);
}



const UserInterface = 
{
	internal_parents_widgets: [],
	internal_group_direction:['V'],
	fps_txt: null,

	set_widget_color: function(node,col,bg)
	{
		node = node.use_for_color?node.use_for_color:node 
		if (node.style)
		{
			node.style.borderColor = col;
			node.style.color = col;
			node.style.background = bg;
		}
	},

	toggle: function(i)
	{
		if (i===undefined)
		{
			i = !ewgl_common.interface_on_off;
		}
		ewgl_common.interface_on_off = i
		ewgl_tactile.interf_elt.style['z-index'] = (ewgl_common.interface_on_off) ? 4 : -4;
		resize_update_wgl();
	},

	set_colors: function(bg,fg)
	{
		ewgl_tactile.is_elt.style.setProperty('--bgcol',bg);
		ewgl_tactile.is_elt.style.setProperty('--fgcol',fg);
	},

	set_dark_theme: function()
	{
		ewgl_tactile.is_elt.style.setProperty('--bgcol','#222A');
		ewgl_tactile.is_elt.style.setProperty('--fgcol','#DDD');
	},

	set_light_theme: function()
	{
		ewgl_tactile.is_elt.style.setProperty('--bgcol','#DDDA');
		ewgl_tactile.is_elt.style.setProperty('--fgcol','#222');
	},

	parent: function()
	{
		return this.internal_parents_widgets[this.internal_parents_widgets.length-1];
	},

	end()
	{
	},

	begin: function(shader_editor=true,show_fps=false)
	{
		ewgl_common.interface_on_off = true;
		ewgl_tactile.interf_elt = document.getElementById("Interface");
		this.internal_parents_widgets.length=0;
		this.internal_parents_widgets.push(ewgl_tactile.interf_elt);
		while (ewgl_tactile.interf_elt.lastChild)
		{
			ewgl_tactile.interf_elt.removeChild(ewgl_tactile.interf_elt.lastChild);
		}
		ewgl_tactile.code_editors.length = 0;
		if (shader_editor)
		{
			// this.internal_group_direction.push('H');
			this.add_shader_editor_selector();
			this.internal_group_direction.push('V');
		}
		this.edited_shader_parent = null;
		if (show_fps)
		{
			this.fps_txt = this.add_text_input("0.0");
		}
	},

	add_br: function()
	{
		if (this.internal_group_direction[this.internal_group_direction.length-1] === 'V')
		{
			this.parent().appendChild(document.createElement("br"));
		}
	},

	add_hspace: function(nb=1)
	{
		let t = document.createElement("div");
		t.style.width = 10*nb+'px';
		t.style.height='auto';
		t.style.display='inline-block';
		this.parent().appendChild(t);
	},

	add_label: function(label)
	{
		let sp = document.createElement("div");
		let noB = document.createElement("b");
		let lab = document.createTextNode(label);
		noB.appendChild(lab);
		sp.appendChild(noB);
		this.parent().appendChild(sp);
		this.add_br();
		return sp;
	},

	add_field_set: function(label)
	{
		let fs = document.createElement("fieldset");
		this.parent().appendChild(fs);
		if (label && label.length>0)
		{
			let la = document.createElement("legend");
			la.innerText = label;
			fs.appendChild(la);
		}
		return fs;
	},

	use_field_set: function(dir, label)
	{
		let f = this.add_field_set(label);
		this.internal_parents_widgets.push(f);
		this.internal_group_direction.push(dir);
		return f;
	},

	add_group: function()
	{
		let fs = document.createElement("div");
		fs.style.display='inline';
		this.parent().appendChild(fs);
		return fs;
	},

	use_group: function(dir)
	{
		let f = this.add_field_set();
		f.style.borderWidth = '0px';
		f.style.background = '#0000';
		f.style.margin = '2px' 
		this.internal_parents_widgets.push(f);
		this.internal_group_direction.push(dir);
		return f;
	},

	end_use: function()
	{
		if (this.internal_parents_widgets.length>1)
		{
			this.internal_parents_widgets.pop();
			this.internal_group_direction.pop();
		}
		this.add_br();
	},

	add_slider: function(label, min, max, val, func, func_val, dec=2)
	{
		let fs = document.createElement("fieldset");
		this.parent().appendChild(fs);
		this.add_br();

		let la = document.createElement("legend");
		la.innerText = label;
		fs.appendChild(la);

		let sl = document.createElement("input");
		sl.type="range";
		sl.min=min;
		sl.max=max;
		sl.value=val;
		sl.id = make_unique_id();
		fs.appendChild(sl);

		if (typeof func !== "function")
		{
			func = () => {};
		}

		if (typeof func_val !== "function")
		{
			func_val = v => v;
			sl.oninput = () => { func(sl.value);}
		}
		else
		{
			let lm = Math.trunc(func_val(max)).toString().length;
			if (dec>0)
			{
				lm += dec+1;
			}
			let leftJustify = (str) => {let res = ' '.repeat(lm - str.length) + str; return res;};
			let conv = v => leftJustify(parseFloat(v).toFixed(dec));
			let va_la = document.createElement("label");
			va_la.Htmlfor = sl.id;
			va_la.innerText = conv(func_val(sl.value));
			fs.appendChild(va_la);
			sl.oninput = () => { func(sl.value); va_la.innerText = conv(func_val(sl.value));}
			sl.easy_value=function() {return func_val(sl.value);}
		}
		return sl;
	},

	add_check_box: function(label, val, func)
	{
		let fs = document.createElement("fieldset");
		this.parent().appendChild(fs);
		this.add_br();

		let cb = document.createElement("input");
		cb.type="checkbox";
		cb.checked=val;
		
		let la = document.createElement("label");
		la.Htmlfor = cb.id;
		la.innerText = label;
		fs.appendChild(la);
		fs.appendChild(cb);
		if (typeof func == "function")
			{ cb.onclick = () => {func(cb.checked,la);}; }
		cb.use_for_color = fs;
		return cb;
	},

	add_radio: function(dir,title, labels, val, func)
	{
		let fs = this.use_field_set(dir,title);
		let sel = ewgl_make_ref(0);
		let rads = [];
		let name = '';
		labels.forEach( l => {name += l;});
		name.replace(" ","");
		for (let i=0; i<labels.length; i++)
		{
			let ra = document.createElement("input");
			ra.type="radio";
			ra.name=name;
			if (val===i)
			{
				ra.checked = "checked";
			}
			ra.id = make_unique_id();
			let la = document.createElement("label");
			la.Htmlfor = ra.id;
			la.innerText = labels[i];
			fs.appendChild(la);
			fs.appendChild(ra);
			if (dir==='H') { this.add_hspace();}
			else {this.add_br();}
			ra.onclick = ()=> { sel.value = i; if (typeof func == "function") {func(i);} };
			rads.push(ra);
		}
		this.end_use();
		return sel;
	},

	remove_shader_edit: function()
	{
		// ewgl_tactile.shader_zone_elt.removeChild(ewgl_tactile.fs_she.nextSibling);
		ewgl_tactile.shader_zone_elt.removeChild(ewgl_tactile.fs_she);
		ewgl_tactile.code_editors.pop();
		ewgl_tactile.code_editors.pop();
		ewgl_tactile.fs_she = null;
	},

	add_shader_edit: function(prg)
	{
		let compil_func = () => 
		{
			ewgl_tactile.console.toggle(true);
			ewgl_tactile.console.info_nl('<i>Compilation de '+prg.sh_name+"</i>");
			if (prg.compile())
			{
				ewgl_tactile.console.info_nl(prg.sh_name + ' : compilation OK');
				setTimeout( () => {ewgl_tactile.console.toggle(false); },2000)
			}
			prg.update_interf_unif.forEach((f) => { f();});
			update_wgl();
		};



		if (ewgl_tactile.fs_she != null)
		{
			this.remove_shader_edit();
		}

		CodeMirror.commands.autocomplete = function(cm) 
		{
			cm.showHint({hint: CodeMirror.hint.anyword});
		}

		// ewgl_tactile.shader_zone_elt = document.getElementById("ShaderZone");
		this.internal_parents_widgets.push(ewgl_tactile.shader_zone_elt)


		ewgl_tactile.fs_she = this.use_field_set('V','');

		this.use_group("H");
		this.add_button('compile', () => { 
			prg.v_src = code_edit_v.getValue();
			if (prg.f_src)
			{
				prg.f_src = code_edit_f.getValue();
			}
			compil_func(); });

		let fname = this.add_text_input(prg.sh_name)
		this.add_button('save', () => { 
		save_text(code_edit_v.getValue(), fname.value + ".vert");
		save_text(code_edit_f.getValue(), fname.value + ".frag");});

		this.add_button('add uniform interf.', () =>
		{
			let sel = code_edit_v.getSelection();
			if (sel)
			{
				this.add_uniform_interface(prg,sel);
			}
			if (code_edit_f)
			{
				sel = code_edit_f.getSelection();
				if (sel)
				{
					this.add_uniform_interface(prg,sel);
				}
			}
		});
		this.add_button('X', this.remove_shader_edit); 
		this.end_use();


		
		let lab = this.add_label(prg.sh_name +'.vert');
		lab.style.color='var(--fgcol);';

		let code_edit_v = CodeMirror(ewgl_tactile.fs_she,{ value:prg.v_src,
			theme: "monokai", 
			mode: "text/x-glsl-es3",
			indentUnit: 4,
			lineNumbers: true,
			indentWithTabs: true,
			matchBrackets: true,
//			comment: true,
			extraKeys: {"Ctrl-Space": "autocomplete"},
		});
		ewgl_tactile.code_editors.push(code_edit_v);

		let code_edit_f = null;
		if (prg.f_src)
		{
			lab = this.add_label(prg.sh_name +'.frag');
			lab.style.color='var(--fgcol);';
			code_edit_f = CodeMirror(ewgl_tactile.fs_she,{ value:prg.f_src,
				theme: "monokai",
				mode: "text/x-glsl-es3",
				indentUnit: 4,
				lineNumbers: true,
				indentWithTabs: true,
				matchBrackets: true,
//				comment: true,
				extraKeys: {"Ctrl-Space": "autocomplete"},
			});

			ewgl_tactile.code_editors.push(code_edit_f);
		}
		else
		{
			lab = this.add_label('no fragment');
			lab.style.color='var(--fgcol';
			ewgl_tactile.code_editors.push(nulls);
		}

		// let foc;
		// code_edit_v.on('focus', () => {	foc = code_edit_v;});
		// code_edit_f.on('focus', () => {	foc = code_edit_f;});

		//  this.use_group('H');
		// // this.parent().style.display='flex';
		// // this.parent().style.justifyContent = 'space-between';

		// this.add_button('compile', () => { 
		// 	prg.v_src = code_edit_v.getValue();
		// 	if (prg.f_src)
		// 	{
		// 		prg.f_src = code_edit_f.getValue();
		// 	}
		// 	compil_func(); });

		// let fname = this.add_text_input(prg.sh_name)
		// this.add_button('save', () => { 
		// 	save_text(code_edit_v.getValue(), fname.value + ".vert");
		// 	save_text(code_edit_f.getValue(), fname.value + ".frag");});

		// this.add_button('add uniform interf.', () =>
		// {
		// 	let sel = code_edit_v.getSelection();
		// 	if (sel)
		// 	{
		// 		this.add_uniform_interface(prg,sel);
		// 	}
		// 	if (code_edit_f)
		// 	{
		// 		sel = code_edit_f.getSelection();
		// 		if (sel)
		// 		{
		// 			this.add_uniform_interface(prg,sel);
		// 		}
		// 	}
		// });

		// this.add_button('X', this.remove_shader_edit); 

		// this.end_use();
		this.end_use();
		this.internal_parents_widgets.pop(); //

	},


	add_shader_editor_selector: function()
	{
		let li = this.add_list_input( () => {
			let l = ['edit shader'];
			for (let i=0; i<ewgl_common.prg_list.length; ++i)
			{
				l.push(ewgl_common.prg_list[i].sh_name);
			}
			return l; }
		,0, () => {
			let i = li.value - 1;
			if (i>=0)
			{
				this.add_shader_edit(ewgl_common.prg_list[i]);
			}
			li.value = 0;
			this.end();
		});

		this.add_br();
	},

	add_button: function(label, func)
	{
		let b = document.createElement("button");
		b.type="button";
		if (typeof func == "function")
		{
			b.onclick = func;
		}
		b.innerText = label;
		this.parent().appendChild(b);
		this.add_br();
		return b;
	},

	add_text_input: function(text)
	{
		let inptext = document.createElement("input");
		inptext.type="text";
		inptext.value=text;
		inptext.id = make_unique_id();
		this.parent().appendChild(inptext);
		this.add_br();
		return inptext;
	},
	
	add_list_input: function(items, i, func)
	{
		let fs = document.createElement("fieldset");
		fs.className ='FieldSetBorder';
		this.parent().appendChild(fs);
		this.add_br();

		let sel = fs.appendChild(document.createElement('select'));

		if (typeof items === 'function')
		{
			sel.onfocus = () =>
			{
				while(sel.childElementCount !== 0)
				{
					sel.removeChild(sel.lastChild);
				}
				let its = items();
				for (let i=0; i< its.length; ++i)
				{
					let option = sel.appendChild(document.createElement('option'));
					option.value = i;
					option.text = its[i];
				}

			};

			sel.onfocus();

		}
		else
		{
			for (let i=0; i< items.length; ++i)
			{
				let option = sel.appendChild(document.createElement('option'));
				option.value = i;
				option.text = items[i];
			}
		}
		sel.value=i;
		sel.onchange = () => func(1*sel.value,sel.text);
		return sel;
	},

	add_uniform_interface: function(prg, uname, f)
	{
		let sl0 = null;
		let sl1 = null;
		let sl2 = null;
		let sl3 = null;
		let cb = null;

		if (f === undefined)
		{
			f = (v) => v;
		}
		let label = prg.sh_name+'::'+uname;

		switch(prg.uniform_type[uname])
		{
			case 'float':
				sl0 = this.add_slider(label,0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= f(v*0.01);
					unbind_shader();
					update_wgl();
				});
				prg.bind();
				prg.uniform[uname] = f(0.5);
				unbind_shader();
				prg.update_interf_unif.push(() => { sl0.oninput()});
			break;
			case 'int':
				sl0 = this.add_slider(label,0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= f(v*1);
					unbind_shader();
					update_wgl();
				});
				prg.bind();
				prg.uniform[uname] = f(50);
				unbind_shader();
				prg.update_interf_unif.push(() => { sl0.oninput()});
			break;
			case 'bool':
				cb = this.add_check_box(label,false, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= v;
					unbind_shader();
					update_wgl();
				});
				prg.bind();
				prg.uniform[uname]= 0;
				unbind_shader();
				prg.update_interf_unif.push(() => { cb.oninput()});
			break;
			case 'vec2':
				sl0 = this.add_slider(label+'_0',0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01)];
					unbind_shader();
					update_wgl();
				});
				sl1 = this.add_slider(label+'_1',0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01)];
					unbind_shader();
					update_wgl();
				});
				prg.bind();
				prg.uniform[uname]= [f(0.5),f(0.5)];
				unbind_shader();
				prg.update_interf_unif.push(() => { sl0.oninput()});
			break;
					case 'vec3':
					sl0 = this.add_slider(label+'_0',0,100,50, (v) => 
					{
						prg.bind();
						prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01)];
						unbind_shader();
						update_wgl();
					});
					sl1 = this.add_slider(label+'_1',0,100,50, (v) => 
					{
						prg.bind();
						prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01)];
						unbind_shader();
						update_wgl();
					});
					sl2 = this.add_slider(label+'_2',0,100,50, (v) => 
					{
						prg.bind();
						prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01)];
						unbind_shader();
						update_wgl();
					});
					prg.bind();
					prg.uniform[uname]= [f(0.5),f(0.5),f(0.5)];
					unbind_shader();
					prg.update_interf_unif.push(() => { sl0.oninput()});
			break;
			case 'vec4':
				sl0 = this.add_slider(label+'_0',0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01),f(sl3.value*0.01)];
					unbind_shader();
					update_wgl();
				});
				sl1 = this.add_slider(label+'_1',0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01),f(sl3.value*0.01)];
					unbind_shader();
					update_wgl();
				});
				sl2 = this.add_slider(label+'_2',0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01),f(sl3.value*0.01)];
					unbind_shader();
					update_wgl();
				});
				sl3 = this.add_slider(label+'_3',0,100,50, (v) => 
				{
					prg.bind();
					prg.uniform[uname]= [f(sl0.value*0.01),f(sl1.value*0.01),f(sl2.value*0.01),f(sl3.value*0.01)];
					unbind_shader();
					update_wgl();
				});
				prg.bind();
				prg.uniform[uname]= [f(0.5),f(0.5),f(0.5)];
				unbind_shader();
				prg.update_interf_unif.push(() => { sl0.oninput()});
			break;
		}
		prg.update_interf_unif.forEach((f) => { f();});
	},

};




let MouseManipulator2D_ops =
{
	init()
	{
		gl.canvas.addEventListener('contextmenu', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
		});

		gl.canvas.addEventListener('dblclick', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
			if (typeof mousedblclick_wgl === 'function')
			{
				mousedblclick_wgl(ev);
			}
		});

		gl.canvas.addEventListener('mouseup', ev =>
		{
			if (typeof mouseup_wgl === 'function')
			{
				if (mouseup_wgl(ev)) return;
			}
		});

		gl.canvas.addEventListener('mousemove', ev =>
		{
			if (typeof mousemove_wgl === 'function')
			{
				if (mousemove_wgl(ev)) return;
			}
		});


		gl.canvas.addEventListener('mousedown', ev =>
		{
			// ev.preventDefault();
			// ev.stopImmediatePropagation();
			this.button = ev.button;
			if (typeof mousedown_wgl === 'function')
			{
				if (mousedown_wgl(ev)) return;
			}
		});
		
		ewgl_tactile.canv_cons_elt.addEventListener('mousedown', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();

			if (ev.clientX <15)
			{
				if (ev.clientY <15)
				{
					UserInterface.toggle();
				}
				if (ev.clientY > ewgl_tactile.canv_cons_elt.clientHeight-15)
				{
					console.log(ev.button);
					if (ev.button==0)
					{
						ewgl_tactile.console.toggle();
					}
					else
					{
						ewgl_tactile.console.clear();
					}
				}
			}
		});

	}
}


function MouseManipulator2D()
{
	let o = Object.assign(Object.create(MouseManipulator2D_ops), {interf_move:false,console_move:false});
	o.init();
	return o;
}


let MouseManipulator3D_ops =
{
	set_camera: function(c)
	{
		this.camera = c;
		this.inv_cam = null;
		this.obj = null;
	},

	manip: function(obj)
	{
		this.obj = obj;
		this.inv_cam = this.camera.frame.inverse();	
	},

	init()
	{
		gl.canvas.addEventListener('contextmenu', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
		});

		// gl.canvas.addEventListener('dblclick', ev =>
		// {
		// 	let stop = false;
		// 	if (typeof mousedblclick_wgl === 'function')
		// 	{
		// 		if (mousedblclick_wgl(ev)) return;
		// 	}

		// 	ev.preventDefault();
		// 	ev.stopImmediatePropagation();
		// 	this.button = ev.button;
		// 	if (ev.button === 0)
		// 	{
		// 		this.speed = 0;
		// 		if (this.obj)
		// 		{
		// 			this.spin_set.delete(this.obj);
		// 			this.obj.frame.realign();
		// 		}
		// 		else
		// 		{
		// 			this.spin_set.delete(this.camera);
		// 			this.camera.frame.realign();
		// 		}
		// 	}

		// 	// if (this.spin_set.size == 0)
		// 	// {
		// 	// 	update_wgl();
		// 	// }

		// 	ewgl_tactile.update_needed = true;
		// });

		gl.canvas.addEventListener('touchstart', ev =>
		{
			ev.stopImmediatePropagation();
			if (typeof mousedown_wgl === 'function')
			{
				if (mousedown_wgl(ev)) return;
			}
			
			// if (this.client_mousedown) {return;}

			this.button = 2*ev.touches.length-2
			if (this.button === 0)
			{
				this.speed = 0;
				if (this.obj)
				{
					this.spin_set.delete(this.obj);
				}
				else
				{
					this.spin_set.delete(this.camera);
				}
			}

			this.last_X = 0;
			this.last_Y = 0;
			for (let i=0; i<ev.touches.length; ++i)
			{
				this.last_X += ev.touches[i].clientX;
				this.last_Y += ev.touches[i].clientY;
			}
			this.last_X /= ev.touches.length;
			this.last_Y /= ev.touches.length;

			if (ev.touches.length === 2)
			{
				const tp0 = Vec2(ev.touches[0].clientX,ev.touches[0].clientY);
				const tp1 = Vec2(ev.touches[1].clientX,ev.touches[1].clientY);
				this.last_dist = tp1.sub(tp0).length();
			}
		});
	
		gl.canvas.addEventListener('touchend', ev =>
		{
			const fake_button = 2 * ev.touches.length -2;

			if (typeof mouseup_wgl === 'function')
			{
				const nev = {button:fake_button,clientX:ev.clientX,clientY:ev.clientY,}
				if (mouseup_wgl(nev)) return;
			}

			ewgl_tactile.interf_elt_move = false;
			this.console_move = false;
			if (this.button!==0)
			{
				return;
			}
			if ((ewgl_tactile.current_time-this.move_time)<0.1)
			{
				if (this.obj)
				{
					this.spin_set.add(this.obj);
				}
				else
				{
					this.spin_set.add(this.camera);
				}
			}
			else
			{
				if (this.obj)
				{
					this.spin_set.delete(this.obj);
				}
				else
				{
					this.spin_set.delete(this.camera);
				}
			}
			ewgl_tactile.update_needed = true;
		});

		gl.canvas.addEventListener('touchmove',   ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
			const fake_button = 2 * ev.touches.length -2;
			let fake_ev = {	button : fake_button, clientX : 0, clientY : 0};
			for (let i=0; i<ev.touches.length; ++i)
			{
				fake_ev.clientX += ev.touches[i].clientX;
				fake_ev.clientY += ev.touches[i].clientY;
			}
			fake_ev.clientX /= ev.touches.length;
			fake_ev.clientY /= ev.touches.length;
			fake_ev.movementX = fake_ev.clientX - this.last_X;
			fake_ev.movementY = fake_ev.clientY - this.last_Y;

			
			this.last_X = fake_ev.clientX;
			this.last_Y = fake_ev.clientY;
			this.move_time = ewgl_tactile.current_time;

			let touch_dist = 0 ;
			let diff_dist = 0 ;
			ewgl_tactile.update_needed = true;

			if (ev.touches.length === 2)
			{
				const tp0 = Vec2(ev.touches[0].clientX,ev.touches[0].clientY);
				const tp1 = Vec2(ev.touches[1].clientX,ev.touches[1].clientY);
				touch_dist = tp1.sub(tp0).length();
				diff_dist = touch_dist - this.last_dist;
				this.last_dist = touch_dist;
			}


			if (typeof mousemove_wgl === 'function')
			{
				if (mousemove_wgl(fake_ev)) return;
			}
			
			const cam = this.camera;
			// if (ev.chan === 0)
			// {
			// 	return;
			// }

			let v = Vec3(fake_ev.movementY,fake_ev.movementX,0);
			this.speed =v.length()*0.1;
			if (this.speed==0)
			{
				return;
			}

			let u = Vec3( fake_ev.clientX/gl.canvas.clientWidth -0.5 , 0.5 - fake_ev.clientY/gl.canvas.clientHeight, 0);
			let s = 2*u.dot(v.normalized());
			let n = -2;
			if (s<0)
			{
				s = -s;
				n = -n;
			}
			this.axis = lerp(v,Vec3(0,0,n),s);

			if (this.obj)
			{
				switch(fake_ev.button)
				{
				case 0:
					const sm = Matrix.rotate(2*this.speed,this.axis);
					this.obj.spin_matrix = this.inv_cam.mult(sm).mult(cam.frame);
					this.obj.frame = this.obj.frame.pre_mult3(this.obj.spin_matrix);
					break;
				case 2:
					let ntr = this.inv_cam.mult(Matrix.translate(0,0,0.25*diff_dist)).mult(cam.frame);
					this.obj.frame = ntr.mult(this.obj.frame);

					const a = 1.0 - cam.frame.data[14]/cam.zcam/cam.s_radius
					let tx = 1 * fake_ev.movementX / gl.canvas.clientWidth * cam.width * cam.s_radius*a;
					let ty = - 1 * fake_ev.movementY / gl.canvas.clientHeight * cam.height * cam.s_radius*a;
					ntr = this.inv_cam.mult(Matrix.translate(tx,ty,0)).mult(cam.frame);
					this.obj.frame = ntr.mult(this.obj.frame);
					break;
				}
			}
			else
			{
				switch(fake_ev.button)
				{
				case 0:
					cam.spin_matrix = Matrix.rotate(0.5*this.speed,this.axis);
					cam.frame = cam.frame.pre_mult3(Matrix.rotate(this.speed,this.axis));
					break;
				case 2:
					const a = 1.0 - cam.frame.data[14]/cam.zcam/cam.s_radius;
					let ntr = Math.max(0.0001,0.005 * a * cam.s_radius);
					ntr *= diff_dist;
					cam.frame.data[14] += ntr;
	
					let nx = 1 * fake_ev.movementX / gl.canvas.clientWidth * cam.width * cam.s_radius*a;
					let ny = - 1 * fake_ev.movementY / gl.canvas.clientHeight * cam.height * cam.s_radius*a;
					cam.frame.data[12] += nx;
					cam.frame.data[13] += ny;
					break;
				}
			}
			ewgl_tactile.update_needed = true;
		});

		ewgl_tactile.interf_toggler_elt.addEventListener('touchend', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
			UserInterface.toggle();
		});

		ewgl_tactile.console_toggler_elt.addEventListener('touchend', ev =>
		{
			ev.preventDefault();
			ev.stopImmediatePropagation();
			ewgl_tactile.console.toggle();
		});
	}
}


function MouseManipulator3D(cam)
{
	let spin_set = new Set();
	let o = Object.assign(Object.create(MouseManipulator3D_ops), 
	{button:-2,last_X:-1,last_Y:-1,last_dist:0,axis:Vec3(0,0,1),speed:0,camera:cam,inv_cam:null,obj:null,zoom:1,spin_set});
	o.init();
	return o;
}


let Camera_ops = 
{

	get scene_radius()
	{
		return this.s_radius;
	},

	set_scene_radius: function(r)
	{
		this.s_radius = r;
	},

	set_scene_center: function(c)
	{
		this.s_center = c;
	},

	set_aspect: function(asp)
	{
		this.aspect = asp;
		if (asp > 1)
		{
			this.width = asp;
			this.height = 1;
		}
		else
		{
			this.width = 1;
			this.height = 1/asp;
		}
	},

	set_fov: function(f)
	{
		this.fov = f*Math.PI/180;
		this.zcam = 1.0/(Math.tan(this.fov/2));
	},

	// get_projection_matrix_neg: function()
	// {
	// 	const d = this.zcam*this.s_radius - this.frame.data[14];
	// 	let this_znear = d-this.s_radius;
	// 	let this_zfar = d+this.s_radius;
	// 	return perspective(this.zcam,this.aspect,this_znear,this_zfar);
	// },


	get_projection_matrix: function()
	{
		const d = this.zcam*this.s_radius - this.frame.data[14];
		this.znear = Math.max( 0.1,d-this.s_radius);
		this.zfar = (d+this.s_radius);
		return Matrix.perspective(this.zcam,this.aspect,this.znear,this.zfar);
	},


	get_projection_matrix_for_skybox: function()
	{
		const d = this.zcam*this.s_radius - this.frame.data[14];
		this.znear = 0.1;
		this.zfar = (d+this.s_radius*1024.0);
		return Matrix.perspective(this.zcam,this.aspect,this.znear,this.zfar);
	},

	get_projection_matrix_for_picking: function()
	{
		const d = this.zcam*this.s_radius - this.frame.data[14];
		this.znear = Math.max(0.1, d-this.s_radius);
		this.zfar = (d+this.s_radius);
		let ifov2 = 1.0/(Math.tan(this.fov/16));
		return Matrix.perspective(ifov2,this.aspect,this.znear,this.zfar);
	},

	get_view_matrix: function()
	{
		return Matrix.translate(0,0,-this.zcam*this.s_radius).mult(this.frame).mult(Matrix.translate(-this.s_center.x,-this.s_center.y,-this.s_center.z));
	},

	get_view_matrix_for_skybox: function()
	{
		return Matrix.translate(0,0,-this.zcam*0.25).mult(this.frame.orientation());
	},

	get_static_matrix_for_skybox: function()
	{

		const d = this.zcam*this.s_radius - this.frame.data[14];
		this.znear = 0.1;
		this.zfar = (d+this.s_radius*1024.0);

		let view =  Matrix.translate(0,0,-this.zcam*0.25);
		let proj = Matrix.perspective(this.zcam,this.aspect,this.znear,this.zfar);
		return Matrix.mult(proj,view);
	},


	/**
	 * 
	 * @param {*} E Eye pos 
	 * @param {*} D direction of view
	 * @param {*} U up vector
	 */
	look: function(E,D,U)
	{
		let m = Matrix.look_dir(E,D,U);
		this.frame = Matrix.translate(0,0,this.zcam*this.s_radius).mult(m).mult(Matrix.translate(this.s_center));
	},

	save: function()
	{
		this.frame_save.copy(this.frame);
	},
	
	restore: function()
	{
		this.frame.copy(this.frame_save);
	},

	/**
	 * return Eye, direction, At,Up
	 */
	get_look_info()
	{
		let iv = this.get_view_matrix().inverse();
		let E = iv.mult(Vec4(0,0,0,1)).xyz;
		let ivo = iv.orientation();
		let D = ivo.mult(Vec4(0,0,-1,1)).xyz;
		let dist = this.zfar-this.s_radius;
		let A = E.add((D.scalarmult(dist)));
		let U = ivo.mult(Vec4(0,1,0,1)).xyz;
		return [E,D,A,U];
	
	},

	show_scene: function()
	{
		if (arguments.length === 2)
		{
			this.s_center = arguments[0]; 
			this.s_radius = arguments[1];
		}
		if (arguments.length === 1)
		{
			this.s_center = arguments[0].center; 
			this.s_radius = arguments[0].radius;
		}
		this.frame.data[12] = 0;
		this.frame.data[13] = 0;
		this.frame.data[14] = 0;

		update_wgl();
	},

	zoom_in_scene: function(ratio)
	{
		this.frame.data[12] = 0;
		this.frame.data[13] = 0;
		this.frame.data[14] = this.zcam * this.s_radius * ratio;
		update_wgl();
	},

}

function Camera(pcenter,pradius,pfov,asp)
{
	let s_center = pcenter || Vec3(0);
	let s_radius = pradius || 1;
	let fov = pfov || 50*Math.PI/180;
	let aspect = asp || 1;
	let zcam = 1.0/(Math.tan(fov/2));

	let frame = Mat4();
	let frame_save = Mat4();
	let width = 1;
	let height = 1;
	if (aspect > 1)
	{
		width *= aspect;
	}
	else
	{
		height /= aspect;
	}
	return Object.assign(Object.create(Camera_ops),
	{s_center, s_radius, aspect, fov, zcam, znear:0, zfar:0, frame, frame_save, width, height, is_camera_type:true});
}


function init_scene3d()
{
	ewgl_tactile.scene_camera = Camera();
	ewgl_tactile.scene_camera.set_aspect( gl.canvas.clientWidth/ gl.canvas.clientHeight);
	ewgl_tactile.scene_manip = MouseManipulator3D(ewgl_tactile.scene_camera);
}


function make_unique_id()
{
	return 'id_' + Math.random().toString(36).substr(2, 9);
}


function save_text(text, filename)
{
	let bytes = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i++) 
	{
		bytes[i] = text.charCodeAt(i);
	}

	saveAs( new Blob([bytes]), filename );
}

function pause_wgl()
{
	ewgl_common.pause_mode = true;
}


function update_wgl()
{
	if (ewgl_tactile)
	{
		ewgl_tactile.update_needed = true;
	}
	ewgl_common.pause_mode = false;
}

function internal_update_wgl()
{
	requestAnimationFrame( (ts) => 
	{
		if (ewgl_common.pause_mode)
		{
			internal_update_wgl();
			return;
		}
		ewgl_tactile.current_time = ts/1000.0;
		ewgl_tactile.nb_frames++; 
		if (ewgl_tactile.nb_frames>=20)
		{
			const progress = ts - ewgl_tactile.ts_start;
			ewgl_tactile.fps = 1000*ewgl_tactile.nb_frames /progress;
			ewgl_tactile.ts_start = ts;
			ewgl_tactile.nb_frames = 0;
		}


		if (ewgl_tactile.scene_manip)
		{
			ewgl_tactile.scene_manip.spin_set.forEach((o) =>
			{
				if (o.spin_matrix)
				{
					o.frame = o.frame.pre_mult3(o.spin_matrix);
					ewgl_tactile.update_needed = true;
				}
				else
				{
					console.log(" WHYYYYYYYYYYYYYYYYYYY");
				}
			});
		}

		// if (!ewgl_tactile.pause && (ewgl_tactile.update_needed || ewgl_tactile.continuous_update))
		if ((ewgl_tactile.update_needed || ewgl_tactile.continuous_update))
		{
			ewgl_tactile.update_needed = false;

			if (UserInterface.fps_txt)
			{
				UserInterface.fps_txt.value = ewgl_tactile.fps.toFixed(3) + ' fps';
			}

			if (ProcessImage.on)
			{
				ProcessImage.begin(); draw_wgl(); ProcessImage.end();
			}
			else
			{
				draw_wgl();
			}

			ewgl_tactile.update_needed = false;
		}
		internal_update_wgl();
	});
}


function internal_ui_resize_common()
{
	gl.canvas.width  = gl.canvas.clientWidth * window.devicePixelRatio / ewgl_tactile.subsample;
	gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio / ewgl_tactile.subsample;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


function resize_update_wgl()
{
	if (ProcessImage.on)
	{
		ProcessImage.fbo1.resize(gl.canvas.width/ProcessImage.subsample, gl.canvas.height/ProcessImage.subsample);
		if (typeof resize_wgl === "function")
		{
			resize_wgl(ProcessImage.fbo1.width, ProcessImage.fbo1.height);
		}
	}
	else
	{
		if (typeof resize_wgl === "function")
		{
			resize_wgl(gl.canvas.width, gl.canvas.height);
		}
	}
	ewgl_tactile.ts_start = performance.now();
	ewgl_tactile.update_needed = true;

}

function ui_resize_2d()
{
	internal_ui_resize_common();

	const aspect = gl.canvas.height / gl.canvas.width;

	ewgl_tactile.ortho2D.data[0] = aspect<1 ? aspect : 1;
	ewgl_tactile.ortho2D.data[5] = aspect<1 ? 1 : 1/aspect;

	ewgl_tactile.ortho2D_2.data[0] = ewgl_tactile.ortho2D.data[0];
	ewgl_tactile.ortho2D_2.data[3] = ewgl_tactile.ortho2D.data[5];


	resize_update_wgl();
}


function ui_resize_3d()
{
	internal_ui_resize_common();
	
	const aspect = gl.canvas.width / gl.canvas.height;
	ewgl_tactile.scene_camera.set_aspect(aspect);

	ewgl_tactile.ortho2D.data[0] = aspect<1 ? 1/aspect : 1;
	ewgl_tactile.ortho2D.data[5] = aspect<1 ? 1 : aspect;

	ewgl_tactile.ortho2D_2.data[0] = ewgl_tactile.ortho2D.data[0];
	ewgl_tactile.ortho2D_2.data[3] = ewgl_tactile.ortho2D.data[5];

	resize_update_wgl();
}


function restore_viewport()
{
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


let ui_resize = null;







let ProcessImage = 
{

	fbo1:null, tex1:null, prg_fs:null,
	a:0, b:1, c:1,
	subsample:1,
	fs:null,
	on:false,

fullscreen_vert:
`#version 300 es
out vec2 tc;
void main()
{
	uint ID = uint(gl_VertexID);
	tc = vec2((ID%2u)*2u, (ID/2u)*2u);
	vec2 p = tc*2.0 - 1.0;
	gl_Position = vec4(p, 0, 1);
}
`,
fullscreen_frag : `#version 300 es
precision highp float;
uniform highp sampler2D TU0;
uniform float a;
uniform float b;
uniform float c;
in vec2 tc;
out vec4 frag_out;

void main()
{
//	frag_out = vec4(vec3(a) + b*vec3(pow(texture(TU0,tc).r,c),pow(texture(TU0,tc).g,c),pow(texture(TU0,tc).b,c)),1.0);
	frag_out = vec4(vec3(a) + b*pow(abs(texture(TU0,tc).rgb),vec3(c)),1.0);
}`,

enable: function()
{
	if (this.on) { return; }
	this.prg_fs = ShaderProgram(this.fullscreen_vert,this.fullscreen_frag,'post_process');
	this.tex1 = Texture2d();
	this.tex1.simple_params(gl.NEAREST);
	this.tex1.init(gl.RGB8);
	this.fbo1 = FBO_Depth(this.tex1);
	this.on = true;
	resize_update_wgl();
},

enable_sub_sampling: function(s)
{
	if (!this.on)
	{
		this.prg_fs = ShaderProgram(this.fullscreen_vert,this.fullscreen_frag,'post_process');
		this.tex1 = Texture2d();
		this.tex1.simple_params(gl.NEAREST);
		this.tex1.init(gl.RGB8);
		this.fbo1 = FBO_Depth(this.tex1);
		this.on = true;
	}
	this.subsample = s;
	resize_update_wgl();
},


begin: function()
{
	this.fbo1.bind();
	gl.viewport(0,0,this.fbo1.width,this.fbo1.height);
},
end: function()
{
	// disable FBO, not use unbind_fbo !!
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.drawBuffers([gl.BACK]);
	
	gl.disable(gl.DEPTH_TEST);
	this.prg_fs.bind();
	this.prg_fs.uniform.TU0 = this.tex1.bind(0);
	this.prg_fs.uniform.a=this.a;
	this.prg_fs.uniform.b=this.b;
	this.prg_fs.uniform.c=this.c;
	gl.drawArrays(gl.TRIANGLES,0,3);
	unbind_texture2d();
	unbind_shader();
},
add_interface: function()
{
	const ss = this.subsample;
	if (this.fs) { return; }
	this.fs = UserInterface.use_field_set('V','post-process');
	let sl_a = UserInterface.add_slider('luminosity',-100,100,0, (v) => { this.a = 0.01*v; update_wgl();});
	let sl_b = UserInterface.add_slider('contrast',-200,200,0, (v) => { this.b = 1+0.01*v; update_wgl();});
	let sl_c = UserInterface.add_slider('power',-100,100,0, (v) => { this.c = 1+0.01*v; update_wgl();});
	let sl_z = UserInterface.add_slider('subsampling',1,32,0, (v) => { this.subsample = parseInt(v); resize_update_wgl();});
	UserInterface.add_button('reset', () =>
	{
		this.a = 0; sl_a.value = 0;
		this.b = 1; sl_b.value = 0;
		this.c = 1; sl_c.value = 0;
		this.subsample = 1; sl_z.value = 1;
		resize_update_wgl();
	});
	UserInterface.end_use();
	UserInterface.end();
	this.subsample = ss;
	sl_z.value = ss;
}
};



let PickerPoints_ops =
{
	down: function(mat,vao,ev)
	{
		this.fbo_pick.bind();
		gl.clearColor(1,1,1,1);
		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.prg.bind();
		this.prg.uniform.projviewMatrix = mat;
		this.prg.uniform.ps=5.0*window.devicePixelRatio;
		vao.bind();
		gl.drawArrays(gl.POINTS,0,vao.length);
		unbind_fbo();
		this.fbo_read_pick.bind();
		let selected = new Uint8Array(4);
		let XX = Math.round(ev.clientX/gl.canvas.clientWidth*gl.canvas.width)/2;
		let YY = Math.round((gl.canvas.clientHeight-ev.clientY)/gl.canvas.clientHeight*gl.canvas.height)/2;
		gl.readPixels(XX,YY,1,1,gl.RGBA,gl.UNSIGNED_BYTE,selected);
		unbind_fbo_read();
		unbind_vao();
		unbind_shader();
		let id = ((selected[3]*256+selected[2])*256+selected[1])*256+selected[0];

		if (id <  this.positions.length/3)
		{
			let O = Vec4(this.positions[3*id],this.positions[3*id+1],this.positions[3*id+2],1);
			let P = mmult(mat,O);
			this.currentZ = P.z/P.w;
			this.invMat = mat.inverse();
			this.currentID = id;
		}
		else
		{
			this.invMat = null;
		}
		return this.currentID !== 4294967296;
	},

	move: function(ev, update = true)
	{
		if (this.invMat) 
		{
			let X = (ev.clientX/gl.canvas.clientWidth)*2-1;
			let Y = ((gl.canvas.clientHeight-ev.clientY)/gl.canvas.clientHeight)*2-1;

			let P = mmult(this.invMat,Vec4(X,Y,this.currentZ,1))
			this.last_position = Vec3(P.x/P.w,P.y/P.w,P.z/P.w);
			if (update)
			{
				PC[3*this.currentID] = this.last_position.x;
				PC[3*this.currentID+1] = this.last_position.y;
				PC[3*this.currentID+2] = this.last_position.z;
			}
			return true;
		}
		return false;
	},

	up: function(ev)
	{
		this.invMat = null;
	},

	resize: function(w,h)
	{
		this.fbo_pick.resize(w/2,h/2);
	}
}

function PickerPoints(points)
{
	const vert_pick=`#version 300 es
	uniform mat4 projviewMatrix;
	layout(location=0) in vec3 position_in;
	uniform float ps;
	flat out vec4 colID;
	void main()
	{
		gl_PointSize = ps;
		gl_Position = projviewMatrix*vec4(position_in,1);
		uint id = uint(gl_VertexID);
		uint idr =  id%256u;
		uint idg =  (id/256u)%256u;
		uint idb =  (id/65536u)%256u;
		uint ida =  (id/16777216u)%256u;
		colID = vec4(idr,idg,idb,ida)/256.0;
	}
	`;

	const frag_pick=`#version 300 es
	precision highp float;
	flat in vec4 colID;
	out vec4 frag_out;
	void main()
	{
		frag_out = colID;
	}
	`;

	let prg = ShaderProgram(vert_pick,frag_pick,'pick_points');
	let tex_pick = Texture2d();
	tex_pick.init(gl.RGBA8);
	let fbo_pick = FBO(tex_pick,true);
	let fbo_read_pick = FBO_READ(tex_pick);
	return Object.assign(Object.create(PickerPoints_ops),{prg,fbo_pick,fbo_read_pick,last_position:null,invMat:null,currentZ:0,currentID:-1,positions:points}); 
}

// just for no exec error
function FileDroppedOnCanevas(func)
{
}

const ewgl = ewgl_tactile;

