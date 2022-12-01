"use strict";

var canvas = document.getElementById("webgl-canvas");
var gl = canvas.getContext("webgl2");

const video_capture =
{
	capturer : null
	,
	init:function(tar_name='video.tar', fps=30)
	{
		this.capturer = new CCapture({framerate: fps, format:'png', name:tar_name});
	}
	,
	start: function()
	{
		capturer.start();
	}
	,
	stop: function()
	{
		this.capturer.stop();
		this.capturer.save();
	}
}

const ewgl_common =
{
	console: null,
	pause_mode : false,
	binded_prg:null,
	path: null,
	interface_on_off:true,
	console_on_off:false,
	attach_enum : [],
	gl_type_of_array : [],
	gl_texture_formats : [],
	prg_list : [],
	FBO_Stack: [],

    ab2str:function(buf)
    {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    ,
    str2ab:function(str)
    {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++)
        {
          bufView[i] = str.charCodeAt(i);
        }
        return bufView;
    }
    ,

    crypt: function(str)
    {
        let n = str.length;

        let src = this.str2ab(str);
        let dst = new Uint16Array(n);
        let j = 0;
        let k = n-1;
        for(let i = 0; i< n; i+=2)
        {
            dst[j] = src[i];
            if (k!=j) {dst[k] = src[i+1];}
            k--;
            j++;
        }
        return this.ab2str(dst);
    }
    ,
    uncrypt:function(str)
    {
        let n = str.length;

        let src = this.str2ab(str);
        let dst = new Uint16Array(n);
        let j = 0;
        let k = n-1;
        for(let i = 0; i< n; i+=2)
        {
            dst[i] = src[j];
            if (k!=j) {dst[i+1] = src[k];}
            k--;
            j++;
        }
        return this.ab2str(dst);
    }
	,
		/**
	 * Load scripts or css (array of file path) then call the callback
	 * @param {*} files
	 * @param {*} callback
	 */
	loadRequiredFiles: function (files,callback)
	{
		let loadRqFi = function(file,callback)
		{
			let ext = file.substr(file.lastIndexOf('.'));
			switch(ext)
			{
				case '.css':
				let style = document.createElement('link');
				style.rel = 'stylesheet';
				style.href = file;
				style.type = 'text/css';
				style.onload = callback;
				document.head.appendChild(style);
				break;
				case '.js':
				let script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = file;
				script.onload = callback;
				document.body.appendChild(script);
				break;
			}
		};

		let first = files.shift();
		if (files.length > 0)
		{
			loadRqFi(first, () => { this.loadRequiredFiles(files,callback);});
		}
		else
		{
			loadRqFi(first, callback);
		}
	},


	launch: function()
	{
		gl = gl = document.getElementById("webgl-canvas").getContext("webgl2");

		this.gl_type_of_array = gl?new Map([['Float32Array',gl.FLOAT],
			['Uint32Array',gl.UNSIGNED_INT],['Int32Array',gl.INT],
			['Uint16Array',gl.UNSIGNED_SHORT],['Int16Array',gl.SHORT],
			['Uint8Array',gl.UNSIGNED_BYTE],['Int8Array',gl.BYTE]]):null;

		this.gl_texture_formats = gl?new Map([
			[gl.R8,[gl.RED,gl.UNSIGNED_BYTE]],
			[gl.RG8,[gl.RG,gl.UNSIGNED_BYTE]],
			[gl.RGB8,[gl.RGB,gl.UNSIGNED_BYTE]],
			[gl.RGBA8,[gl.RGBA,gl.UNSIGNED_BYTE]],
			[gl.R16,[gl.RED,gl.UNSIGNED_SHORT]],
			[gl.RG16,[gl.RG,gl.UNSIGNED_SHORT]],
			[gl.RGB16,[gl.RGB,gl.UNSIGNED_SHORT]],
			[gl.RGBA16,[gl.RGBA,gl.UNSIGNED_SHORT]],
			[gl.R16F,[gl.RED,gl.HALF_FLOAT]],
			[gl.RG16F,[gl.RG,gl.HALF_FLOAT]],
			[gl.RGB16F,[gl.RGB,gl.HALF_FLOAT]],
			[gl.RGBA16F,[gl.RGBA,gl.HALF_FLOAT]],
			[gl.R32F,[gl.RED,gl.FLOAT]],
			[gl.RG32F,[gl.RG,gl.FLOAT]],
			[gl.RGB32F,[gl.RGB,gl.FLOAT]],
			[gl.RGBA32F,[gl.RGBA,gl.FLOAT]],
			[gl.R16I,[gl.RED_INTEGER,gl.SHORT]],
			[gl.RG16I,[gl.RG_INTEGER,gl.SHORT]],
			[gl.RGB16I,[gl.RGB_INTEGER,gl.SHORT]],
			[gl.RGBA16I,[gl.RGBA_INTEGER,gl.SHORT]],
			[gl.R32I,[gl.RED_INTEGER,gl.INT]],
			[gl.RG32I,[gl.RG_INTEGER,gl.INT]],
			[gl.RGB32I,[gl.RGB_INTEGER,gl.INT]],
			[gl.RGBA32I,[gl.RGBA_INTEGER,gl.INT]],
			[gl.R8UI,[gl.RED_INTEGER,gl.UNSIGNED_BYTE]],
			[gl.RG8UI,[gl.RG_INTEGER,gl.UNSIGNED_BYTE]],
			[gl.RGB8UI,[gl.RGB_INTEGER,gl.UNSIGNED_BYTE]],
			[gl.RGBA8UI,[gl.RGBA_INTEGER,gl.UNSIGNED_BYTE]],
			[gl.R16UI,[gl.RED_INTEGER,gl.UNSIGNED_SHORT]],
			[gl.RG16UI,[gl.RG_INTEGER,gl.UNSIGNED_SHORT]],
			[gl.RGB16UI,[gl.RGB_INTEGER,gl.UNSIGNED_SHORT]],
			[gl.RGBA16UI,[gl.RGBA_INTEGER,gl.UNSIGNED_SHORT]],
			[gl.R32UI,[gl.RED_INTEGER,gl.UNSIGNED_INT]],
			[gl.RG32UI,[gl.RG_INTEGER,gl.UNSIGNED_INT]],
			[gl.RGB32UI,[gl.RGB_INTEGER,gl.UNSIGNED_INT]],
			[gl.RGBA32UI,[gl.RGBA_INTEGER,gl.UNSIGNED_INT]],
			[gl.RGB10_A2,[gl.RGBA,gl.UNSIGNED_INT_2_10_10_10_REV]],
			[gl.DEPTH_COMPONENT,  [gl.DEPTH_COMPONENT,gl.UNSIGNED_INT]],
			[gl.DEPTH_COMPONENT16,[gl.DEPTH_COMPONENT,gl.UNSIGNED_SHORT]],
			[gl.DEPTH_COMPONENT24,[gl.DEPTH_COMPONENT,gl.GL_UNSIGNED_INT]],
			[gl.DEPTH_COMPONENT32F,[gl.DEPTH_COMPONENT,gl.FLOAT]]
		]):null;

		this.attach_enum = [gl.COLOR_ATTACHMENT0,
			gl.COLOR_ATTACHMENT1,
			gl.COLOR_ATTACHMENT2,
			gl.COLOR_ATTACHMENT3,
			gl.COLOR_ATTACHMENT4,
			gl.COLOR_ATTACHMENT5,
			gl.COLOR_ATTACHMENT6,
			gl.COLOR_ATTACHMENT7,
			gl.COLOR_ATTACHMENT8,
			gl.COLOR_ATTACHMENT9],


		gl.getExtension('EXT_color_buffer_float' );
		gl.getExtension('EXT_float_blend');
		gl.getExtension('OES_texture_float_linear' ); // non dispo sous mobile
		const ext_aniso=gl.getExtension('EXT_texture_filter_anisotropic');
		if (ext_aniso !== null)
		{
			gl.MAX_TEXTURE_MAX_ANISOTROPY_EXT = ext_aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
			gl.TEXTURE_MAX_ANISOTROPY_EXT = ext_aniso.TEXTURE_MAX_ANISOTROPY_EXT;
		}

	},


	gl_error: function()
	{
		let e = gl.getError();
		switch(e)
		{
			case gl.NO_ERROR:
				return 'NO_ERROR';
			case gl.INVALID_ENUM:
				return 'INVALID_ENUM';
			case gl.INVALID_VALUE:
				return 'INVALID_VALUE';
			case gl.INVALID_OPERATION:
				return 'INVALID_OPERATION';
			case gl.INVALID_FRAMEBUFFER_OPERATION:
				return 'INVALID_FRAMEBUFFER_OPERATION';
			case gl.OUT_OF_MEMORY:
				return 'OUT_OF_MEMORY';
			case gl.CONTEXT_LOST_WEBGL:
				return 'CONTEXT_LOST_WEBGL';
		}
		return 'UNKNOWN_ERROR'
	}
	,
};


function prepareWASM(ta)
{
	let nDataBytes = ta.length * ta.BYTES_PER_ELEMENT;
	const dataPtr = Module._malloc(nDataBytes);
	let dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
	return {
		original:ta,
		heapMem:dataHeap,
		ptr:dataHeap.byteOffset,
		send: function()
		{
			this.heapMem.set(new Uint8Array(this.original.buffer));
		},
		receive: function ()
		{
			this.original.set(new this.original.constructor(this.heapMem.buffer, this.heapMem.byteOffset, this.original.length));
		},
		freeWASM: function() { Module._free(this.heapMem.byteOffset);}
	};
}


function sleep_rendering()
{
	ewgl_common.pause_mode = true;
}


function wakeup_rendering()
{
	ewgl_common.pause_mode = false;
}

function ewgl_make_ref(cst)
{
	return {value:cst};
}


////////////////////////////////////////////////////////////////////////
//	BUFFER
////////////////////////////////////////////////////////////////////////

const BufferVec =
{
	dim:0,
	v_cstr:null,
	last: 0,

	affect_at: function(i,v)
	{
		let j = i*this.dim;

		for (let k=0; k<v.data.length; k++)
		{
			this[j++] = v.data[k];
		}
	}
	,
	push: function(v)
	{
		let d = (Array.isArray(v))?v:v.data;
		for (let k =0; k< d.length; k++)
		{
			this[this.last++] = d[k];
		}
	}
	,
	at: function(i)
	{
		let d = this.subarray(this.dim*i,this.dim*(i+1));
		return Object.assign(Object.create(Vec_ops), {data:d,Vec:this.v_cstr});
	},

};

const BufferScalar =
{
	last: 0
	,
	push: function(v)
	{
		this[this.last++] = v;
	}
};

// const create_Vec_buffer = (dim,nb) =>
// {
// 	let o = Object.assign(new Float32Array(dim*nb), BufferVec);
// 	o.dim = dim;
// 	o.v_cstr = this['Vec'+dim];
// 	return o;
// }

function create_Vec_buffer(dim,nb)
{
	let o = Object.assign(new Float32Array(dim*nb), BufferVec);
	o.dim = dim;
	switch(dim)
	{
		case 2: o.v_cstr = Vec2; break;
		case 3: o.v_cstr = Vec3; break;
		case 4: o.v_cstr = Vec4; break;
	}
	return o;
}

function create_uint32_buffer(nb)
{
	return Object.assign(new Uint32Array(nb), BufferScalar);
}

function create_float_buffer(nb)
{
	return Object.assign(new Float32Array(nb), BufferScalar);
}



/**
 * @typedef {this} NewType
 */

////////////////////////////////////////////////////////////////////////
//	MATRICE / VECTEUR
////////////////////////////////////////////////////////////////////////

const Vec_ops =
{
	get is_vector()
	{
		return true;
	},
	copy: function(v)
	{
		const src = v.data;
		const n = src.length;
		let dst = this.data;
		for ( let i=0; i<n; ++i)
		{
			dst[i]=src[i];
		}
		return this;
	},

	deep_clone: function()
	{
		let clone  = this.Vec();
		clone.data.set(this.data,0);
		return clone;
	},


	forEach: function(f)
	{
		this.data.forEach(f);
	},

	length: function()
	{
		return Math.sqrt(this.dot(this));
	},

	normalized: function()
	{
		const no = this.length();
		if (no < 0.000001)
		{
			return  this;
		}
		const vc = this.scalarmult(1.0/no);
		return vc;
	},


	add: function(vb)
	{
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] + b[i];
		}
		return vc;
	},

	self_add: function(vb)
	{
		let a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			a[i] += b[i];
		}
	},

	sub: function(vb)
	{
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] - b[i];
		}
		return vc;
	},

	self_sub: function(vb)
	{
		let a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			a[i] -= b[i];
		}
	},

	scalarmult: function(s)
	{
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] * s;
		}
		return vc;
	},

	self_scalarmult: function(s)
	{
		const a = this.data;
		const n = a.length;

		for (let i = 0; i < n; i++)
		{
			a[i] *= s;
		}
	},


	mult: function(vb)
	{
		if (Number.isFinite(vb))
		{
			return this.scalarmult(vb);
		}
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] * b[i];
		}
		return vc;
	},

	self_mult: function(vb)
	{
		if (Number.isFinite(vb))
		{
			this.self_scalarmult(vb);
		}

		const a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			 a[i] *= b[i];
		}
	},

	div: function(vb)
	{
		if (Number.isFinite(vb))
		{
			return this.scalarmult(1/vb);
		}
		const a = this.data;
		const n = a.length;
		let vc = this.Vec();
		let c = vc.data;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			c[i] = a[i] / b[i];
		}
		return vc;
	},


	self_div: function(vb)
	{
		if (Number.isFinite(vb))
		{
			this.self_scalarmult(1.0/vb);
		}

		const a = this.data;
		const n = a.length;
		const b = vb.data;

		for (let i = 0; i < n; i++)
		{
			 a[i] /= b[i];
		}
	},


	neg: function(res)
	{
		return this.scalarmult(-1);
	},

	dot: function(vb)
	{
		const a = this.data;
		const n = a.length;
		const b = vb.data;
		let d = 0;

		for (let i = 0; i < n; i++)
		{
			d += a[i] * b[i];
		}
		return d;
	},



	at: function(i)
	{
		return this.data[i];
	},

	get xyz()
	{
		return  Vec3(this.data[0] ,this.data[1], this.data[2]);
	},

	get xy()
	{
		return  Vec2(this.data[0] ,this.data[1]);
	},
	get x()
	{
		return this.data[0];
	},
	get y()
	{
		return this.data[1];
	},
	get z()
	{
		return this.data[2];
	},
	get w()
	{
		return this.data[3];
	},
	set x(v)
	{
		this.data[0] = v;
	},
	set y(v)
	{
		this.data[1] = v;
	},
	set z(v)
	{
		this.data[2] = v;
	},
	set w(v)
	{
		this.data[3] = v;
	}
};

Vec_ops['+'] = Vec_ops.add;
Vec_ops['+='] = Vec_ops.self_add;
Vec_ops['-'] = Vec_ops.sub;
Vec_ops['-='] = Vec_ops.self_sub;
Vec_ops['*'] = Vec_ops.mult;
Vec_ops['*='] = Vec_ops.self_mult;
Vec_ops['/'] = Vec_ops.div;
Vec_ops['/='] = Vec_ops.self_div;
Vec_ops['.'] = Vec_ops.dot;

let Vec2_ops = Object.assign(Object.create(Vec_ops),
{
	cross: function(v)
	{
		return this.data[0]*v.data[1] - this.data[1]*v.data[0];
	}
});
Vec2_ops['^'] = Vec2_ops.cross;


let Vec3_ops = Object.assign(Object.create(Vec_ops),
{
	cross: function(v)
	{
		const x = this.data[1]*v.data[2] - this.data[2]*v.data[1];
		const y = this.data[2]*v.data[0] - this.data[0]*v.data[2];
		const z = this.data[0]*v.data[1] - this.data[1]*v.data[0];
		return Vec3(x,y,z);
	}
});
Vec3_ops['^'] = Vec3_ops.cross;

function Vec2()
{
	let data = new Float32Array(2);

	if (arguments.length == 1 && arguments[0].data === undefined)
	{
		data[0] = arguments[0];
		data[1] = arguments[0];
	}
	else
	{
		let j = 0;
		for (let i=0; i<arguments.length; i++)
		{
			if (arguments[i].data != undefined)
			{
				arguments[i].data.forEach( e => {data[j++]=e;});
			}
			else
			{
				data[j++] = arguments[i];
			}
		}
	}

	return Object.assign(Object.create(Vec2_ops), {data,Vec:Vec2});
}

function Vec3()
{
	let data = new Float32Array(3);

	if (arguments.length == 1 && arguments[0].data === undefined)
	{
		data[0] = arguments[0];
		data[1] = arguments[0];
		data[2] = arguments[0];
	}
	else
	{
		let j = 0;
		for (let i=0; i<arguments.length; i++)
		{
			if (arguments[i].data != undefined)
			{
				arguments[i].data.forEach( e => {data[j++]=e;});
			}
			else
			{
				data[j++] = arguments[i];
			}
		}
	}

	return Object.assign(Object.create(Vec3_ops), {data,Vec:Vec3});
}

function Vec3_buff(buff,i)
{
	let data = buff.subarray(3*i, 3*i+3);
	return Object.assign(Object.create(Vec3_ops), {data,Vec:Vec3});
}

function Vec4()
{
	let data = new Float32Array(4);

	if (arguments.length == 1 && arguments[0].data === undefined)
	{
		data[0] = arguments[0];
		data[1] = arguments[0];
		data[2] = arguments[0];
		data[3] = arguments[0];
	}
	else
	{
		let j = 0;
		for (let i=0; i<arguments.length; i++)
		{
			if (arguments[i].data != undefined)
			{
				arguments[i].data.forEach( e => {data[j++]=e;});
			}
			else
			{
				data[j++] = arguments[i];
			}
		}
	}

	return Object.assign(Object.create(Vec_ops), {data,Vec:Vec4});
}




const Mat_ops =
{
	get is_matrix()
	{
		return true;
	},

	copy: function(v)
	{
		const src = v.data;
		let dst = this.data;
		const n = dst.length;
		for ( let i=0; i<n; ++i)
		{
			dst[i]=src[i];
		}
		return this;
	},

	deep_clone: function()
	{
		let clone  = this.Vec();
		clone.data.set(this.data,0);
		return clone;
	},


	forEach: function(f)
	{
		this.data.forEach(f);
	},

	id: function()
	{
		const n = this.dim();
		this.data[0] = 1;
		let j = 0;
		for (let i=1;i<n;++i)
		{
			j += n+1;
			this.data[j] = 1;
		}
		return this;
	},

	add: function(mb)
	{
		const n = this.dim();
		let mc = this.Mat();
		let c = mc.data;
		let a = this.data;
		let b = mb.data;

		let nb = n*n;
		for (let i = 0; i < nb; i++)
		{
			c[i] = a[i] + b[i];
		}
		return mc;
	},

	sub: function(mb)
	{
		const n = this.dim();
		let mc = this.Mat();
		let c = mc.data;
		let a = this.data;
		let b = mb.data;

		let nb = n*n;
		for (let i = 0; i < nb; i++)
		{
			c[i] = a[i] - b[i];
		}
		return mc;
	},

	scalarmult: function(s)
	{
		let mc = this.Mat();
		let c = mc.data;
		const a = this.data;

		const nb = a.length;
		for (let i = 0; i < nb; i++)
		{
			c[i] = a[i] * s;
		}
		return mc;
	},

	transpose: function()
	{
		let transp = this.Mat();
		let mt = transp.data;
		let m = this.data;
		const n = this.dim();
		const nb = m.length;
		for (let i = 0; i < nb; i++)
		{
			const c = ~~(i/n);
			const l = i%n;
			mt[c*n+l] = m[l*n+c];
		}
		return transp;
	}
}
Mat_ops['+'] = Mat_ops.add;
Mat_ops['+='] = Mat_ops.self_add;
Mat_ops['-'] = Mat_ops.sub;
Mat_ops['-='] = Mat_ops.self_sub;


const Mat2_ops = Object.assign(Object.create(Mat_ops),
{
	vecmult: function(vb)
	{
		const a = this.data;
		const b = vb.data;
		let vc = Vec2();
		vc.data[0] = a[0]*b[0] + a[2]*b[1];
		vc.data = a[1]*b[0] + a[3]*b[1];

		return vc;
	},

	mult: function(mb)
	{
		if (mb.data == undefined)
			return this.scalarmult(mb);

		if (mb.data.length == 4)
		{
			let mc = Mat3();
			let c = mc.data;
			const a = this.data;
			const b = mb.data;

			for (let i = 0; i < 2; i++)
			{
				c[i]	= a[i]*b[0] +  a[i+2]*b[1];
				c[i+2]  = a[i]*b[2] +  a[i+2]*b[3];
			}
			return mc;
		}

		if (mb.data.length == 2)
		{
			return this.vectmult(mb);
		}
	},

	dim: function () { return 2;}
});
Mat2_ops['*'] = Mat2_ops.mult;



const Mat3_ops = Object.assign(Object.create(Mat_ops),
{
	vecmult: function(vb)
	{
		const a = this.data;
		const b = vb.data;
		let vc = Vec3();
		vc.data[0] = a[0]*b[0] + a[3]*b[1] + a[6]*b[2];
		vc.data[1] = a[1]*b[0] + a[4]*b[1] + a[7]*b[2];
		vc.data[2] = a[2]*b[0] + a[5]*b[1] + a[8]*b[2];
		return vc;
	},

	mult: function(mb)
	{
		if (mb.data == undefined)
			return this.scalarmult(mb);

		if (mb.data.length == 9)
		{
			let mc = Mat3();
			let c = mc.data;
			const a = this.data;
			const b = mb.data;

			for (let i = 0; i < 3; i++)
			{
				c[i]	= a[i]*b[0] +  a[i+3]*b[1] + a[i+6]*b[2];
				c[i+3]  = a[i]*b[3] +  a[i+3]*b[4] + a[i+6]*b[5];
				c[i+6]  = a[i]*b[6] +  a[i+3]*b[7] + a[i+6]*b[8];
			}
			return mc;
		}

		if (mb.data.length == 3)
		{
			return this.vecmult(mb);
		}
	},

	dim: function() { return 3;}
});
Mat3_ops['*'] = Mat3_ops.mult;



const Mat4_ops = Object.assign(Object.create(Mat_ops),
{
	vecmult: function (vb)
	{
		const a = this.data;
		const b = vb.data;
		let vc = Vec4();
		vc.data[0] = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] +  a[12]*b[3];
		vc.data[1] = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] +  a[13]*b[3];
		vc.data[2] = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14]*b[3];
		vc.data[3] = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15]*b[3];

		return vc;
	},

	mult: function(mb)
	{
		if (mb.data === undefined)
		{
			return this.scalarmult(mb);
		}

		if (mb.data.length == 16)
		{
			let mc = Mat4();
			let c = mc.data;
			const a = this.data;
			const b = mb.data;

			for (let i = 0; i < 4; i++)
			{
				c[i]	= a[i]*b[0] +  a[i+4]*b[1] +  a[i+8]*b[2] +  a[i+12]*b[3];
				c[i+4]  = a[i]*b[4] +  a[i+4]*b[5] +  a[i+8]*b[6] +  a[i+12]*b[7];
				c[i+8]  = a[i]*b[8] +  a[i+4]*b[9] +  a[i+8]*b[10] + a[i+12]*b[11];
				c[i+12] = a[i]*b[12] + a[i+4]*b[13] + a[i+8]*b[14] + a[i+12]*b[15];
			}
			return mc;
		}

		if (mb.data.length == 4)
		{
			return this.vecmult(mb);
		}
	},

	mult3: function(mb)
	{
		let mc = Mat4();
		let c = mc.data;
		const a = this.data;
		const b = mb.data;
		for (let i = 0; i < 3; i++)
		{
			c[i]	= a[i]*b[0] +  a[i+4]*b[1] +  a[i+8]*b[2];
			c[i+4]  = a[i]*b[4] +  a[i+4]*b[5] +  a[i+8]*b[6];
			c[i+8]  = a[i]*b[8] +  a[i+4]*b[9] +  a[i+8]*b[10];
		}
		c[3]=a[3]; c[7]=a[7]; c[11]=a[11]; c[15]=a[15];
		c[12]=a[12]; c[13]=a[13]; c[14]=a[14];
		return mc;
	},


	pre_mult3: function(mb)
	{
		let mc = Mat4();
		let c = mc.data;
		const b = this.data;
		const a = mb.data;
		for (let i = 0; i < 3; i++)
		{
			c[i]	= a[i]*b[0] +  a[i+4]*b[1] +  a[i+8]*b[2];
			c[i+4]  = a[i]*b[4] +  a[i+4]*b[5] +  a[i+8]*b[6];
			c[i+8]  = a[i]*b[8] +  a[i+4]*b[9] +  a[i+8]*b[10];
		}
		c[3]=b[3]; c[7]=b[7]; c[11]=b[11]; c[15]=b[15];
		c[12]=b[12]; c[13]=b[13]; c[14]=b[14];
		return mc;
	},

	inverse3: function()
	{
		let invm = Mat3();
		let inv = invm.data;
		const m = this.data;

		const t00 = m[1 * 4 + 1] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 1];
		const t10 = m[0 * 4 + 1] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 1];
		const t20 = m[0 * 4 + 1] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 1];
		const d = 1.0 / (m[0 * 4 + 0] * t00 - m[1 * 4 + 0] * t10 + m[2 * 4 + 0] * t20);
		inv[0] =   d * t00;
		inv[1] =  -d * t10;
		inv[2] =   d * t20;
		inv[3] =  -d * (m[1 * 4 + 0] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 0]);
		inv[4] =   d * (m[0 * 4 + 0] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 0]);
		inv[5] =  -d * (m[0 * 4 + 0] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 0]);
		inv[6] =   d * (m[1 * 4 + 0] * m[2 * 4 + 1] - m[1 * 4 + 1] * m[2 * 4 + 0]);
		inv[7] =  -d * (m[0 * 4 + 0] * m[2 * 4 + 1] - m[0 * 4 + 1] * m[2 * 4 + 0]);
		inv[8]=   d * (m[0 * 4 + 0] * m[1 * 4 + 1] - m[0 * 4 + 1] * m[1 * 4 + 0]);
		return invm
	},

	inverse3transpose: function()
	{
		let invm = Mat3();
		let inv = invm.data;
		const m = this.data;

		const t00 = m[1 * 4 + 1] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 1];
		const t10 = m[0 * 4 + 1] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 1];
		const t20 = m[0 * 4 + 1] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 1];
		const d = 1.0 / (m[0 * 4 + 0] * t00 - m[1 * 4 + 0] * t10 + m[2 * 4 + 0] * t20);
		inv[0] =   d * t00;
		inv[3] =  -d * t10;
		inv[6] =   d * t20;
		inv[1] =  -d * (m[1 * 4 + 0] * m[2 * 4 + 2] - m[1 * 4 + 2] * m[2 * 4 + 0]);
		inv[4] =   d * (m[0 * 4 + 0] * m[2 * 4 + 2] - m[0 * 4 + 2] * m[2 * 4 + 0]);
		inv[7] =  -d * (m[0 * 4 + 0] * m[1 * 4 + 2] - m[0 * 4 + 2] * m[1 * 4 + 0]);
		inv[2] =   d * (m[1 * 4 + 0] * m[2 * 4 + 1] - m[1 * 4 + 1] * m[2 * 4 + 0]);
		inv[5] =  -d * (m[0 * 4 + 0] * m[2 * 4 + 1] - m[0 * 4 + 1] * m[2 * 4 + 0]);
		inv[8]=   d * (m[0 * 4 + 0] * m[1 * 4 + 1] - m[0 * 4 + 1] * m[1 * 4 + 0]);
		return invm
	},

	inverse: function()
	{
		let invm = Mat4();
		let inv = invm.data;
		const m = this.data;
		const m00 = m[0];
		const m01 = m[1];
		const m02 = m[2];
		const m03 = m[3];
		const m10 = m[4];
		const m11 = m[5];
		const m12 = m[6];
		const m13 = m[7];
		const m20 = m[8];
		const m21 = m[9];
		const m22 = m[10];
		const m23 = m[11];
		const m30 = m[12];
		const m31 = m[13];
		const m32 = m[14];
		const m33 = m[15];
		const tmp0  = m22 * m33;
		const tmp1  = m32 * m23;
		const tmp2  = m12 * m33;
		const tmp3  = m32 * m13;
		const tmp4  = m12 * m23;
		const tmp5  = m22 * m13;
		const tmp6  = m02 * m33;
		const tmp7  = m32 * m03;
		const tmp8  = m02 * m23;
		const tmp9  = m22 * m03;
		const tmp10 = m02 * m13;
		const tmp11 = m12 * m03;
		const tmp12 = m20 * m31;
		const tmp13 = m30 * m21;
		const tmp14 = m10 * m31;
		const tmp15 = m30 * m11;
		const tmp16 = m10 * m21;
		const tmp17 = m20 * m11;
		const tmp18 = m00 * m31;
		const tmp19 = m30 * m01;
		const tmp20 = m00 * m21;
		const tmp21 = m20 * m01;
		const tmp22 = m00 * m11;
		const tmp23 = m10 * m01;

		const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
			(tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
		const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
			(tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
		const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
			(tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
		const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
			(tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

		const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

		inv[0] = d * t0;
		inv[1] = d * t1;
		inv[2] = d * t2;
		inv[3] = d * t3;
		inv[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
			  (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
		inv[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
			  (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
		inv[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
			  (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
		inv[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
			  (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
		inv[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
			  (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
		inv[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
			  (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
		inv[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
			  (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
		inv[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
			  (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
		inv[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
			  (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
		inv[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
			  (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
		inv[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
			  (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
		inv[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
			  (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));

		return invm;
	},

	transform: function(vb)
	{
		const a = this.data;
		const b = vb.data;

		const x = a[0]*b[0] + a[4]*b[1] + a[8]*b[2] +  a[12];
		const y = a[1]*b[0] + a[5]*b[1] + a[9]*b[2] +  a[13];
		const z = a[2]*b[0] + a[6]*b[1] + a[10]*b[2] + a[14];
		const w = a[3]*b[0] + a[7]*b[1] + a[11]*b[2] + a[15];
		let c = Vec3();
		c.data[0] = x/w;
		c.data[1] = y/w;
		c.data[2] = z/w;
		return c;
	},

	column3: function(i)
	{
		let d = this.data.subarray(4*i,4*i+3);
		return Object.assign(Object.create(Vec_ops), {data:d,Vec:Vec3});
	},

	position: function()
	{
		return Object.assign(Object.create(Vec_ops), {data:this.data.subarray(12,15),Vec:Vec3});
	},

	Xaxis: function()
	{
		let d = this.data.subarray(0,3);
		return Object.assign(Object.create(Vec_ops), {data:d,Vec:Vec3});
	},

	Yaxis: function()
	{
		let d = this.data.subarray(4,7);
		return Object.assign(Object.create(Vec_ops), {data:d,Vec:Vec3});
	},

	Zaxis: function()
	{
		let d = this.data.subarray(8,11);
		return Object.assign(Object.create(Vec_ops), {data:d,Vec:Vec3});
	},


	orientation: function()
	{
		const m = this.data;
		let ori = Mat4();
		let o = ori.data;
		for (let i=0;i<12;++i)
		{
			o[i]=m[i];
		}
		return ori;
	},


	distance: function()
	{
		const m = this.data;
		return Math.sqrt(m[12]*m[12]+m[13]*m[13]+m[14]*m[14]);
	},

	main_dir: function(d)
	{
		const x = Math.abs(this.data[d*4]);
		const y = Math.abs(this.data[d*4+1]);
		const z = Math.abs(this.data[d*4+2]);

		if ((x>y)&&(x>z))
		{
			return 0;
		}
		if (y>z)
		{
			return 1;
		}
		return 2;
	},

	realign: function()
	{
		let m = this.data;
		const xd = this.main_dir(0);
		let l = Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2]);
		for (let i=0; i<3; i++)
		{
			m[i] = (i ==xd) ? Math.sign(m[i])*l :0;
		}

		const yd = this.main_dir(1);
		l = Math.sqrt(m[4]*m[4]+m[5]*m[5]+m[6]*m[6]);
		for (let i=0; i<3; i++)
		{
			m[4+i] = (i ==yd) ? Math.sign(m[4+i])*l :0;
		}

		const zd = this.main_dir(2);
		l = Math.sqrt(m[8]*m[8]+m[9]*m[9]+m[10]*m[10]);
		for (let i=0; i<3; i++)
		{
			m[8+i] = (i ==zd) ? Math.sign(m[8+i])*l :0;
		}
	},

	dim: function()
	{
		return 4;
	},
});

Mat4_ops['*'] = Mat4_ops.mult;

function zeroMat2()
{
	return Object.assign(Object.create(Mat2_ops),{data:new Float32Array(4), Mat:Mat2});
}


function zeroMat3()
{
 	return Object.assign(Object.create(Mat3_ops),{data:new Float32Array(9), Mat:Mat3});
}


function zeroMat4()
{
	return Object.assign(Object.create(Mat4_ops),{data:new Float32Array(16), Mat:Mat4});
}

function Mat2()
{
	let o = Object.assign(Object.create(Mat2_ops),{data:new Float32Array(4), Mat:Mat2});
	if (arguments.length === 0)
	{
		return o.id();
	}
	else
	{
		for(let i=0; i<arguments.length; ++i)
		{
			o.data[i] = arguments[i];
		}
		return o;
	}
}


function Mat3()
{
	let o = Object.assign(Object.create(Mat3_ops),{data:new Float32Array(9), Mat:Mat3});
	if (arguments.length === 0)
	{
		return o.id();
	}
	else
	{
		for(let i=0; i<arguments.length; ++i)
		{
			o.data[i] = arguments[i];
		}
		return o;
	}
}


function Mat4()
{
	let o = Object.assign(Object.create(Mat4_ops),{data:new Float32Array(16), Mat:Mat4});
	if (arguments.length === 0)
	{
		return o.id();
	}
	else
	{
		for(let i=0; i<arguments.length; ++i)
		{
			o.data[i] = arguments[i];
		}
		return o;
	}
}


function Mat2_from_f32a(data)
{
	return Object.assign(Object.create(Mat2_ops),{data, Mat:Mat2});
}

function Mat3_from_f32a(data)
{
	return Object.assign(Object.create(Mat3_ops),{data, Mat:Mat3});
}

function Mat4_from_f32a(data)
{
	return Object.assign(Object.create(Mat4_ops),{data, Mat:Mat4});
}

const Matrix =
{
mult: function()
{
	let m = arguments[0];
	const n = arguments.length;
	for (let i=1; i<n; ++i)
	{
		m = m.mult(arguments[i]);
	}
	return m;
}
,
scale: function(sx,sy,sz)
{
	if (sx.data)
	{
		sz = tx.z;
		sy = tx.y;
		sx = tx.x;
	}
	let res = Mat4();
	let m = res.data;
 	m[0]=sx;
	m[5]=(sy!=undefined)?sy:sx;
	m[10]=(sz!=undefined)?sz:sx;
	return res;
}
,
translate: function(tx,ty,tz)
{
	if (tx.data)
	{
		tz = tx.z;
		ty = tx.y;
		tx = tx.x;
	}
	let res = Mat4();
	let m = res.data;
	if (ty === undefined)
	{
		m[12]=tx.data[0];
		m[13]=tx.data[1];
		m[14]=tx.data[2];
	}
	else
	{
		m[12]=tx;
		m[13]=ty;
		m[14]=tz;
	}
	return res;
}
,
rotateX: function(beta)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	m[5] = c;
	m[6] = s;
	m[9] = -s;
	m[10] = c;
	return res;
}
,
rotateY: function(beta)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	m[0] = c;
	m[2] = -s;
	m[8] = s;
	m[10] = c;
	return res;
}
,
rotateZ: function(beta)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	m[0] = c;
	m[1] = s;
	m[4] = -s;
	m[5] = c;
	return res;
}
,

 rotate: function(beta, axis)
{
	let alpha = Math.PI/180 * beta;
	let res = Mat4();
	let m = res.data;

	const an = axis.normalized();
	const na = an.data;

	const nn = an.mult(an).data;
	const c = Math.cos(alpha);
	const s = Math.sin(alpha);
	const omc = 1 - c;

	m[ 0] = nn[0] + (1 - nn[0]) * c;
	m[ 1] = na[0] * na[1] * omc + na[2] * s;
	m[ 2] = na[0] * na[2] * omc - na[1] * s;
	m[ 3] = 0;
	m[ 4] = na[0] * na[1] * omc - na[2] * s;
	m[ 5] = nn[1] + (1 - nn[1]) * c;
	m[ 6] = na[1] * na[2] * omc + na[0] * s;
	m[ 7] = 0;
	m[ 8] = na[0]* na[2] * omc + na[1] * s;
	m[ 9] = na[1] * na[2] * omc - na[0] * s;
	m[10] = nn[2] + (1 -nn[2]) * c;
	m[11] = 0;
	m[12] = 0;
	m[13] = 0;
	m[14] = 0;
	m[15] = 1;

	return res;
}
,

perspective: function(ifov2, aspect, near, far)
{
	let res = Mat4();
	let m = res.data;

	const rangeInv = 1.0 / (near - far);
	if (aspect>1)
	{
		m[0] = ifov2/aspect;
		m[5] = ifov2;
	}
	else
	{
		m[0] = ifov2;
		m[5] = ifov2*aspect;
	}


					 m[1] = 0; m[2] = 0;		m[3] = 0;
	m[4] = 0;				  m[6] = 0;			m[7] = 0;
	m[8] = 0;		m[9] = 0; m[10] = (near+far)*rangeInv; m[11] = -1.0;
	m[12] = 0;	   m[13]= 0; m[14] = 2*near*far*rangeInv; m[15] = 0;

	return res;
}
,

perspective_angle: function(fov, aspect, near, far)
{
	const ifv2 = 1.0/Math.tan(fov/2.0);
	return this.perspective(ifv2,aspect,near,far);
},

ortho: function(half_width, half_height, near, far)
{
	let res = Mat4();
	let m = res.data;

	const rangeInv = 1.0 / (near - far);
	m[0] = 1/half_width;
	m[5] = 1/half_height;

			   m[1] = 0; m[2] = 0;					m[3] = 0;
	m[4] = 0;			m[6] = 0;					m[7] = 0;
	m[8] = 0;  m[9] = 0; m[10] = 2*rangeInv;		  m[11] = 0;
	m[12] = 0; m[13]= 0; m[14] = (near+far)*rangeInv; m[15] = 1;

	return res;
}
,


look_dir: function(eye, dir, up)
{
	let zAxis = dir.scalarmult(-1).normalized();
	let xAxis = up.normalized().cross(zAxis).normalized();
	let yAxis = zAxis.cross(xAxis).normalized();

	let res = Mat4();
	let m = res.data;

	m[0]  = xAxis.x;
	m[4]  = xAxis.y;
	m[8]  = xAxis.z;
	m[12] = - xAxis.dot(eye);

	m[1]  = yAxis.x;
	m[5]  = yAxis.y;
	m[9]  = yAxis.z;
	m[13] = - yAxis.dot(eye);

	m[2]  = zAxis.x;
	m[6]  = zAxis.y;
	m[10] = zAxis.z;
	m[14] = - zAxis.dot(eye);;

	m[3]  = 0
	m[7]  = 0
	m[11] = 0
	m[15] = 1.0;

	return res;
}
,

look_at: function(eye, at, up)
{
	let zAxis = eye.sub(at).normalized();
	let xAxis = up.normalized().cross(zAxis).normalized();
	let yAxis = zAxis.cross(xAxis).normalized();

	let res = Mat4();
	let m = res.data;

	m[0]  = xAxis.x;
	m[4]  = xAxis.y;
	m[8]  = xAxis.z;
	m[12] = - xAxis.dot(eye);

	m[1]  = yAxis.x;
	m[5]  = yAxis.y;
	m[9]  = yAxis.z;
	m[13] = - yAxis.dot(eye);

	m[2]  = zAxis.x;
	m[6]  = zAxis.y;
	m[10] = zAxis.z;
	m[14] = - zAxis.dot(eye);;

	m[3]  = 0
	m[7]  = 0
	m[11] = 0
	m[15] = 1.0;

	return res;
}
,

from_Quat: function(q,p)
{
	let m = new Float32Array(16);
	m[0] = 1-2*(q.y*q.y+q.z*q.z);
	m[1] = 2*(q.x*q.y-q.w*q.z);
	m[2] = 2*(q.x*q.z+q.w*q.y);
	m[3] = 0
	m[4] = 2*(q.x*q.y+q.w*q.z);
	m[5] = 1-2*(q.x*q.x+q.z*q.z);
	m[6] = 2*(q.y*q.z -q.w*q.x);
	m[7] = 0
	m[8] = 2*(q.x*q.z - q.w*q.y);
	m[9] = 2*(q.y*q.z+q.w*q.x);
	m[10]= 1-2*(q.x*q.x+q.y*q.y);
	m[11]= 0
	m[12]= p.x;
	m[13]= p.y;
	m[14]= p.z;
	m[15]= 1;
	return Mat4_from_f32a(m);
}
,
to_Quat: function(ma)
{
	let m = ma.data;
	let w = Math.sqrt(1.0 + m[0] + m[5] + m[10]) / 2.0;
	let w4 = 4.0 * w;
	let x = (m[9] - m[6]) / w4 ;
	let y = (m[2] - m[8]) / w4 ;
	let z = (m[4] - m[1]) / w4 ;
	return [Vec4(x,y,z,w), Vec3(m[12],m[13],m[14])];
}

}

function lerp(pa, pb, t)
{
	return pa.mult(1-t).add(pb.mult(t));
}


function quat_slerp(qa, qb, t)
{
	let qm = Vec4();

	let cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
	if (Math.abs(cosHalfTheta) >= 1.0)
	{
		qm.w = qa.w;
		qm.x = qa.x;
		qm.y = qa.y;
		qm.z = qa.z;
		return qm;
	}

	let halfTheta = Math.acos(cosHalfTheta);
	let sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);
	if (Math.abs(sinHalfTheta) < 0.001)
	{
		qm.w = (qa.w * 0.5 + qb.w * 0.5);
		qm.x = (qa.x * 0.5 + qb.x * 0.5);
		qm.y = (qa.y * 0.5 + qb.y * 0.5);
		qm.z = (qa.z * 0.5 + qb.z * 0.5);
		return qm;
	}

	let ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
	let ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
	qm.w = (qa.w * ratioA + qb.w * ratioB);
	qm.x = (qa.x * ratioA + qb.x * ratioB);
	qm.y = (qa.y * ratioA + qb.y * ratioB);
	qm.z = (qa.z * ratioA + qb.z * ratioB);
	return qm;
}

function quat_to_Mat4(q)
{
	let m = new Float32Array(16);
	const sqw = q[3]*q[3];
	const sqx = q[0]*q[0];
	const sqy = q[1]*q[1];
	const sqz = q[2]*q[2];

	const invs = 1 / (sqx + sqy + sqz + sqw)
	m[0] = ( sqx - sqy - sqz + sqw)*invs ;
	m[5] = (-sqx + sqy - sqz + sqw)*invs ;
	m[10] = (-sqx - sqy + sqz + sqw)*invs ;

	let tmp1 = q[0]*q[1];
	let tmp2 = q[2]*q[3];
	m[1] = 2.0 * (tmp1 + tmp2)*invs ;
	m[4] = 2.0 * (tmp1 - tmp2)*invs ;

	tmp1 = q[0]*q[2];
	tmp2 = q[1]*q[3];
	m[2] = 2.0 * (tmp1 - tmp2)*invs ;
	m[8] = 2.0 * (tmp1 + tmp2)*invs ;
	tmp1 = q[1]*q[2];
	tmp2 = q[0]*q[3];
	m[6] = 2.0 * (tmp1 + tmp2)*invs ;
	m[9] = 2.0 * (tmp1 - tmp2)*invs ;
	m[15] = 1;

	return Mat4_from_f32a(m);
}



////////////////////////////////////////////////////////////////////////
//	GL
////////////////////////////////////////////////////////////////////////


let Uniforms = null;

let VBO_ops = {

update: function(buffer, offset_dst=0)
{
	let buff = (buffer.constructor.name === 'Array') ? new Float32Array(buffer) : buffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.bufferSubData(gl.ARRAY_BUFFER, offset_dst*4*this.nb_floats, buff);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
},

alloc: function(nbv)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
	gl.bufferData(gl.ARRAY_BUFFER, nbv*4*this.nb_floats, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	this.length = nbv;
},

bind: function()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
},

gldelete:function()
{
	gl.deleteBuffer(this.id);
}

}

function VBO(buffer=null, nb_floats,usage)
{
	let id = gl.createBuffer();
	let length=0;

	if (buffer !== null)
	{
		let buff = (buffer.constructor.name === 'Array') ? new Float32Array(buffer) : buffer;
		length = buff.length/nb_floats;

		gl.bindBuffer(gl.ARRAY_BUFFER, id);
		gl.bufferData(gl.ARRAY_BUFFER, buff, usage ? usage : gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}

	return Object.assign(Object.create(VBO_ops),{id,nb_floats,length});
}


// function cVBO(buffer=null, nb_floats=3)
// {
// 	this.id = gl.createBuffer();

// 	if (buffer !== null)
// 	{
// 		let buff = (buffer.constructor.name === 'Array') ? new Float32Array(buffer) : buffer;
// 		this.length = buff.length/nb_floats;

// 		gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
// 		gl.bufferData(gl.ARRAY_BUFFER, buff, gl.STATIC_DRAW);
// 		gl.bindBuffer(gl.ARRAY_BUFFER, null);
// 	}
// 	else
// 	{
// 		this.length = 0;
// 	}
// 	this.nb_floats = nb_floats;
// }

// cVBO.prototype = VBO_ops;

// function VBO(buffer=null, nb_floats=3)
// {
// 	return new cVBO(buffer, nb_floats);
// }

function unbind_vbo()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}


let EBO_ops = {

update: function(buffer, offset_dst=0)
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
	gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset_dst*4, buffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
},

alloc: function(nbe)
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, nbe, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
},

bind: function()
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
},

gldelete:function()
{
	gl.deleteBuffer(this.id);
}

}

function EBO(buffer)
{
	let id = gl.createBuffer();
	let length = 0;

	if (buffer !== null)
	{
		let buff = (buffer.constructor.name === 'Array') ? new Uint32Array(buffer) : buffer;
		length = buff.length;

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, id);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buff, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	return Object.assign(Object.create(EBO_ops),{id,length});
}

function unbind_ebo()
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}


let VAO_ops = {
	bind: function()
	{
		gl.bindVertexArray(this.id);
	},
	get length()
	{
		return this.vbos[0].length;
	},

	gldelete:function()
	{
		gl.deleteVertexArray(this.id);
	}
}

function VAO()
{
	let id = gl.createVertexArray();
	let length = 0;
	let vbos = [];
	gl.bindVertexArray(id);
	let n = arguments.length;
	for (let i=0;i<n;++i)
	{
		let a = arguments[i];
		if (a[1] != null && a[0]>=0)
		{
			vbos.push(a[1]);
			gl.enableVertexAttribArray(a[0]);
			gl.bindBuffer(gl.ARRAY_BUFFER, a[1].id);
			gl.vertexAttribPointer(a[0], a[5]?a[5]:a[1].nb_floats, gl.FLOAT, false, a[3]?a[3]*4:0, a[4]?a[4]*4:0);
			if (a[2])
			{
				gl.vertexAttribDivisor(a[0],a[2]);
			}
			else
			{
				gl.vertexAttribDivisor(a[0],0);
				length = a[1].length;
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	}
	gl.bindVertexArray(null);
	return Object.assign(Object.create(VAO_ops),{id,vbos});
}

function unbind_vao()
{
	gl.bindVertexArray(null);
}

let ShaderProgram_ops=
{
	bind: function ()
	{
		gl.useProgram(this.prg);
		ewgl_common.binded_prg = this;
		Uniforms = this.uniform;
	},

	// fix_attribute_loc: function(vsrc)
	// {
	// 	// this.sh_outs = [];
	// 	const lines = vsrc.match(/\sin\s.*;/g);
	// 	if (lines == undefined)
	// 		return;
	// 	for(let i= 0; i < lines.length; i++)
	// 	{
	// 		const attr = lines[i].match(/in\s*(\w*)\s*(\w*)/);
	// 		const aname = attr[2];
	// 		switch(aname)
	// 		{
	// 		case 'position_in':
	// 			gl.bindAttribLocation(this.prg,POSITION_ATTRIB,aname);
	// 			this.locations.set(aname,POSITION_ATTRIB);
	// 			break;
	// 		case 'normal_in':
	// 			gl.bindAttribLocation(this.prg,NORMAL_ATTRIB,aname);
	// 			this.locations.set(aname,NORMAL_ATTRIB);
	// 			break;
	// 		case 'color_in':
	// 			gl.bindAttribLocation(this.prg,COLOR_ATTRIB,aname);
	// 			this.locations.set(aname,COLOR_ATTRIB);
	// 			break;
	// 		case 'texcoord_in':
	// 			gl.bindAttribLocation(this.prg,TEXCOORD_ATTRIB,aname);
	// 			this.locations.set(aname,TEXCOORD_ATTRIB);
	// 			break;
	// 		default:
	// 			this.locations.set(aname,-1);
	// 		break;
	// 		}
	// 		const out = lines[i].match(/out\s*(\w*)\s*(\w*)/);
	// 		// if (out)
	// 		// {
	// 		// 	this.sh_outs.push(out[2])
	// 		// }
	// 	}
	// },

	search_attribute_loc: function(vsrc)
	{
		this.in = undefined;
		this.in = {};

		const lines = vsrc.match(/\sin\s.*;/g);
		if (lines == undefined)
		{
			return;
		}

		for(let i= 0; i < lines.length; i++)
		{
			const attr = lines[i].match(/in\s*(\w*)\s*(\w*)/);
			const aname = attr[2];
			this.locations.set(aname,-1);
			let loc = gl.getAttribLocation(this.prg,aname)
			this.locations.set(aname, loc);
			Object.defineProperty(this.in, aname, { value:loc });
		}
		Object.seal(this.in);
	},

	remove_comments: function(src)
	{
		let a = src.indexOf("/*");
		let b = (a===-1)?-1:src.indexOf("*/",a);
		while (a >= 0 && b>=0)
		{
			src = src.slice(0,a) + src.slice(b+2);
			a = src.indexOf("/*");
			b = (a===-1)?-1:src.indexOf("*/",a);
		}

		a = src.indexOf("//");
		b = (a===-1)?-1:src.indexOf("\n",a);
		while (a >= 0 && b>=0)
		{
			src = src.slice(0,a) + src.slice(b);
			a = src.indexOf("//");
			b = (a===-1)?-1:src.indexOf("\n",a);
		}
		return src;
	},

	set_uniform_func: function(uname, type, f)
	{
		if (typeof this.uniform [uname] === 'undefined')
		{
			Object.defineProperty(this.uniform,	uname, { set:f, get: () => gl.getUniform(this.prg,this['_unif_'+uname]) });
			Object.defineProperty(this.uniform_type, uname, { get: () => type });
		}
	},

	search_uniforms: function(vsrc,fsrc)
	{
		function uniform_lines(src)
		{
			let lines = src.match(/uniform\s.*;/g);
			return lines || [];
		}

		this.uniform = undefined;
		this.uniform = {};

		this.uniform_type = undefined;
		this.uniform_type = {};

		let lines= uniform_lines(vsrc).concat(uniform_lines(fsrc));

		for(let i= 0; i < lines.length; i++)
		{
			if (lines[i])
			{
				const unif = lines[i].match(/uniform\s*(\w*)\s*(\w*)\s*(\w*)/);

				let dec = (lines[i].indexOf('highp') < 0 && lines[i].indexOf('mediump') < 0 && lines[i].indexOf('lowp') < 0) ?0:1;

				const utype = unif[1+dec];
				const uname = unif[2+dec];
				const uniformIndices = gl.getUniformIndices(this.prg, [uname]);
				if (uniformIndices[0] <4000000000)
				{
					let uindice =  gl.getUniformLocation(this.prg,uname);
					this.locations.set(uname,uindice);
					const uniformSizes = gl.getActiveUniforms(this.prg, uniformIndices, gl.UNIFORM_SIZE);
					const sz = uniformSizes[0];
					switch (utype)
					{
					case 'bool':
					if (sz ==1)
							{this.set_uniform_func(uname,'bool', (v) =>  { gl.uniform1i(uindice,v); } );}
						else
							{this.set_uniform_func(uname,'', (v) =>  {  gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); } );}
						break;
					case 'int':
					if (sz ==1)
							{this.set_uniform_func(uname,'int', (v) =>  { gl.uniform1i(uindice,v); } );}
						else
							{this.set_uniform_func(uname,'', (v) =>  {  gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); } );}
						break;
					case 'sampler2D':
					case 'sampler2DShadow':
					case 'isampler2D':
					case 'usampler2D':
					case 'sampler2DArray':
					case 'sampler2DArrayShadow':
					case 'isampler2DArray':
					case 'usampler2DArray':
					case 'sampler3D':
					case 'sampler3DShadow':
					case 'isampler3D':
					case 'usampler3D':
					case 'samplerCube':
					case 'samplerShadow':
					if (sz ==1)
							{this.set_uniform_func(uname,'', (v) =>  { gl.uniform1i(uindice,v); } );}
						else
							{this.set_uniform_func(uname,'', (v) =>  {  gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); } );}
						break;
					case 'uint':
						if (sz ==1)
							{this.set_uniform_func(uname,'uint', (v) =>  { gl.uniform1ui(uindice,v); } );}
						else
							{this.set_uniform_func(uname, '', (v) =>  {  gl.uniform1uiv(uindice,(v.data==undefined)?v:v.data); } );}
						break;
					case 'float':
						if (sz ==1)
							{this.set_uniform_func(uname, 'float', (v) =>  { gl.uniform1f(uindice,v); } );}
						else
							{this.set_uniform_func(uname, '', (v) =>  {  gl.uniform1fv(uindice,(v.data==undefined)?v:v.data); } );}
						break;
					case 'vec2':
						this.set_uniform_func(uname, 'vec2', (v) =>  {
							if (v.data)
							{
								gl.uniform2fv(uindice,v.data);
								return;
							}
							if (Array.isArray(v))
							{
								if (v[0].data)
								{
									let length=Math.min(sz,v.length);
									let tempo = new Float32Array(length*2);
									for (let j = 0; j<length; j++)
									{
										tempo.set(v[j].data,j*2);
									}
									gl.uniform2fv(uindice,tempo);
									return;
								}
								let tempo = new Float32Array(v);
								gl.uniform2fv(uindice,tempo);
								return;
							}
							gl.uniform2fv(uindice,v);
						});
						break;
					case 'vec3':
						this.set_uniform_func(uname, 'vec3', (v) =>  {
							if (v.data)
							{
								gl.uniform3fv(uindice,v.data);
								return;
							}
							if (Array.isArray(v))
							{
								if (v[0].data)
								{
									let length=Math.min(sz,v.length);
									let tempo = new Float32Array(length*3);
									for (let j = 0; j<length; j++)
									{
										tempo.set(v[j].data,j*3);
									}
									gl.uniform3fv(uindice,tempo);
									return;
								}
								let tempo = new Float32Array(v);
								gl.uniform3fv(uindice,tempo);
								return;
							}
							gl.uniform3fv(uindice,v);
						});
						break;
					case 'vec4':
						this.set_uniform_func(uname, 'vec4', (v) =>  {
							if (v.data)
							{
								gl.uniform4fv(uindice,v.data);
								return;
							}
							if (Array.isArray(v))
							{
								if (v[0].data)
								{
									let length=Math.min(sz,v.length);
									let tempo = new Float32Array(length*4);
									for (let j = 0; j<length; j++)
									{
										tempo.set(v[j].data,j*4);
									}
									gl.uniform4fv(uindice,tempo);
									return;
								}
								let tempo = new Float32Array(v);
								gl.uniform4fv(uindice,tempo);
								return;
							}
							gl.uniform4fv(uindice,v);
						});
						break;

					case 'mat2':
						this.set_uniform_func(uname, 'mat2', (v) =>  {
							gl.uniformMatrix2fv(uindice,false,(v.data==undefined)?v:v.data); });
						break;
					case 'mat3':
						this.set_uniform_func(uname, 'mat3', (v) =>  {
							gl.uniformMatrix3fv(uindice,false,(v.data==undefined)?v:v.data); });
						break;
					case 'mat4':
						this.set_uniform_func(uname, 'mat4', (v) =>  {
							gl.uniformMatrix4fv(uindice,false,(v.data==undefined)?v:v.data); });
						break;

					case 'ivec2':
						this.set_uniform_func(uname, 'ivec2', (v) =>  {
							if (v.data)
							{
								gl.uniform2iv(uindice,v.data);
								return;
							}
							if (Array.isArray(v))
							{
								if (v[0].data)
								{
									let length=Math.min(sz,v.length);
									let tempo = new Int32Array(length*4);
									for (let j = 0; j<length; j++)
									{
										tempo.set(v[j].data,j*4);
									}
									gl.uniform2iv(uindice,tempo);
									return;
								}
								let tempo = new Int32Array(v);
								gl.uniform2iv(uindice,tempo);
								return;
							}
							gl.uniform2iv(uindice,v);
						});
						break;
					case 'ivec3':
						this.set_uniform_func(uname, 'ivec3', (v) =>  {
							if (v.data)
							{
								gl.uniform3iv(uindice,v.data);
								return;
							}
							if (Array.isArray(v))
							{
								if (v[0].data)
								{
									let length=Math.min(sz,v.length);
									let tempo = new Int32Array(length*4);
									for (let j = 0; j<length; j++)
									{
										tempo.set(v[j].data,j*4);
									}
									gl.uniform3iv(uindice,tempo);
									return;
								}
								let tempo = new Int32Array(v);
								gl.uniform3iv(uindice,tempo);
								return;
							}
							gl.uniform3iv(uindice,v);
						});
						break;

						break;
					case 'ivec4':
						this.set_uniform_func(uname, 'ivec4', (v) =>  {
							if (v.data)
							{
								gl.uniform4iv(uindice,v.data);
								return;
							}
							if (Array.isArray(v))
							{
								if (v[0].data)
								{
									let length=Math.min(sz,v.length);
									let tempo = new Int32Array(length*4);
									for (let j = 0; j<length; j++)
									{
										tempo.set(v[j].data,j*4);
									}
									gl.uniform4iv(uindice,tempo);
									return;
								}
								let tempo = new Int32Array(v);
								gl.uniform4iv(uindice,tempo);
								return;
							}
							gl.uniform4iv(uindice,v);
						});
						break;
					}
					this['_unif_'+uname] = uindice;
				}
			}
		}
		// Object.seal(this.uniform);
	},


	set_struct_uniform_func: function(ustrobjtype, uname, type, f)
	{
		if (typeof ustrobjtype.uobj[uname] === 'undefined')
		{
			Object.defineProperty(ustrobjtype.uobj,	uname, { set:f, get: () => gl.getUniform(this.prg,this['_unif_'+uname]) });
			Object.defineProperty(ustrobjtype.utype, uname, { get: () => type });
		}
	},

	add_struct_uniform: function(ustrname)
	{
		if (typeof this.uniform [ustrname] === 'undefined')
		{

			let X = {};
			this.uniform[ustrname] = X;
			let Y = {};
			this.uniform_type[ustrname] = Y;
		}
		return {uobj:this.uniform[ustrname], utype:this.uniform_type[ustrname]};
	},

	search_struct_uniforms: function(vsrc,fsrc)
	{
		function struct_uniform_lines(src)
		{
			let lines = src.match(/uniform\s*struct\s*\w*\s*\{(.*?)\}\s*(\w*)/sg);
			return lines || [];
		}

		this.struniform = undefined;
		this.struniform = {};

		this.struniform_type = undefined;
		this.struniform_type = {};

		let unif_lines= struct_uniform_lines(vsrc).concat(struct_uniform_lines(fsrc));


		for(let j= 0; j < unif_lines.length; j++)
		{
			if (unif_lines[j])
			{
				const struct_obj = unif_lines[j].match(/uniform\s*struct\s*\w*\s*\{(.*?)\}\s*(\w*)/s);
				const struct_name = struct_obj[2];
				const lines = struct_obj[1].split('\n');

				let ustruct_obj = this.add_struct_uniform(struct_name);

				for(let i= 0; i < lines.length; i++)
				{
					const unif = lines[i].match(/\s*(\w*)\s*(\w*)\s*;/);
					if (unif != null)
					{
						let dec = (lines[i].indexOf('highp') < 0 && lines[i].indexOf('mediump') < 0 && lines[i].indexOf('lowp') < 0) ?0:1;

						const utype = unif[1+dec];
						const uname = unif[2+dec];
						const gluname = struct_name+'.'+uname;
						const uniformIndices = gl.getUniformIndices(this.prg, [gluname]);
						if (uniformIndices[0] <4000000000)
						{
							let uindice =  gl.getUniformLocation(this.prg,gluname);
							this.locations.set(gluname,uindice);
							const uniformSizes = gl.getActiveUniforms(this.prg, uniformIndices, gl.UNIFORM_SIZE);
							const sz = uniformSizes[0];
							switch (utype)
							{
							case 'bool':
							if (sz ==1)
									{this.set_struct_uniform_func(ustruct_obj,uname,'bool', (v) =>  { gl.uniform1i(uindice,v); } );}
								else
									{this.set_struct_uniform_func(ustruct_obj,uname,'', (v) =>  {  gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); } );}
								break;
							case 'int':
							if (sz ==1)
									{this.set_struct_uniform_func(ustruct_obj,uname,'int', (v) =>  { gl.uniform1i(uindice,v); } );}
								else
									{this.set_struct_uniform_func(ustruct_obj,uname,'', (v) =>  {  gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); } );}
								break;
							case 'sampler2D':
							case 'sampler2DShadow':
							case 'isampler2D':
							case 'usampler2D':
							case 'sampler2DArray':
							case 'sampler2DArrayShadow':
							case 'isampler2DArray':
							case 'usampler2DArray':
							case 'sampler3D':
							case 'sampler3DShadow':
							case 'isampler3D':
							case 'usampler3D':
							case 'samplerCube':
							case 'samplerShadow':
							if (sz ==1)
									{this.set_struct_uniform_func(ustruct_obj,uname,'', (v) =>  { gl.uniform1i(uindice,v); } );}
								else
									{this.set_struct_uniform_func(ustruct_obj,uname,'', (v) =>  {  gl.uniform1iv(uindice,(v.data==undefined)?v:v.data); } );}
								break;
							case 'uint':
								if (sz ==1)
									{this.set_struct_uniform_func(ustruct_obj,uname,'uint', (v) =>  { gl.uniform1ui(uindice,v); } );}
								else
									{this.set_struct_uniform_func(ustruct_obj,uname, '', (v) =>  {  gl.uniform1uiv(uindice,(v.data==undefined)?v:v.data); } );}
								break;
							case 'float':
								if (sz ==1)
									{this.set_struct_uniform_func(ustruct_obj,uname, 'float', (v) =>  { gl.uniform1f(uindice,v); } );}
								else
									{this.set_struct_uniform_func(ustruct_obj,uname, '', (v) =>  {  gl.uniform1fv(uindice,(v.data==undefined)?v:v.data); } );}
								break;
							case 'vec2':
								this.set_struct_uniform_func(ustruct_obj,uname, 'vec2', (v) =>  {
									if (v.data)
									{
										gl.uniform2fv(uindice,v.data);
										return;
									}
									if (Array.isArray(v))
									{
										if (v[0].data)
										{
											let length=Math.min(sz,v.length);
											let tempo = new Float32Array(length*2);
											for (let j = 0; j<length; j++)
											{
												tempo.set(v[j].data,j*2);
											}
											gl.uniform2fv(uindice,tempo);
											return;
										}
										let tempo = new Float32Array(v);
										gl.uniform2fv(uindice,tempo);
										return;
									}
									gl.uniform2fv(uindice,v);
								});
								break;
							case 'vec3':
								this.set_struct_uniform_func(ustruct_obj,uname, 'vec3', (v) =>  {
									if (v.data)
									{
										gl.uniform3fv(uindice,v.data);
										return;
									}
									if (Array.isArray(v))
									{
										if (v[0].data)
										{
											let length=Math.min(sz,v.length);
											let tempo = new Float32Array(length*3);
											for (let j = 0; j<length; j++)
											{
												tempo.set(v[j].data,j*3);
											}
											gl.uniform3fv(uindice,tempo);
											return;
										}
										let tempo = new Float32Array(v);
										gl.uniform3fv(uindice,tempo);
										return;
									}
									gl.uniform3fv(uindice,v);
								});
								break;
							case 'vec4':
								this.set_struct_uniform_func(ustruct_obj,uname, 'vec4', (v) =>  {
									if (v.data)
									{
										gl.uniform4fv(uindice,v.data);
										return;
									}
									if (Array.isArray(v))
									{
										if (v[0].data)
										{
											let length=Math.min(sz,v.length);
											let tempo = new Float32Array(length*4);
											for (let j = 0; j<length; j++)
											{
												tempo.set(v[j].data,j*4);
											}
											gl.uniform4fv(uindice,tempo);
											return;
										}
										let tempo = new Float32Array(v);
										gl.uniform4fv(uindice,tempo);
										return;
									}
									gl.uniform4fv(uindice,v);
								});
								break;

							case 'mat2':
								this.set_struct_uniform_func(ustruct_obj,uname, 'mat2', (v) =>  {
									gl.uniformMatrix2fv(uindice,false,(v.data==undefined)?v:v.data); });
								break;
							case 'mat3':
								this.set_struct_uniform_func(ustruct_obj,uname, 'mat3', (v) =>  {
									gl.uniformMatrix3fv(uindice,false,(v.data==undefined)?v:v.data); });
								break;
							case 'mat4':
								this.set_struct_uniform_func(ustruct_obj,uname, 'mat4', (v) =>  {
									gl.uniformMatrix4fv(uindice,false,(v.data==undefined)?v:v.data); });
								break;

							case 'ivec2':
								this.set_struct_uniform_func(ustruct_obj,uname, 'ivec2', (v) =>  {
									if (v.data)
									{
										gl.uniform2iv(uindice,v.data);
										return;
									}
									if (Array.isArray(v))
									{
										if (v[0].data)
										{
											let length=Math.min(sz,v.length);
											let tempo = new Int32Array(length*4);
											for (let j = 0; j<length; j++)
											{
												tempo.set(v[j].data,j*4);
											}
											gl.uniform2iv(uindice,tempo);
											return;
										}
										let tempo = new Int32Array(v);
										gl.uniform2iv(uindice,tempo);
										return;
									}
									gl.uniform2iv(uindice,v);
								});
								break;
							case 'ivec3':
								this.set_struct_uniform_func(ustruct_obj,uname, 'ivec3', (v) =>  {
									if (v.data)
									{
										gl.uniform3iv(uindice,v.data);
										return;
									}
									if (Array.isArray(v))
									{
										if (v[0].data)
										{
											let length=Math.min(sz,v.length);
											let tempo = new Int32Array(length*4);
											for (let j = 0; j<length; j++)
											{
												tempo.set(v[j].data,j*4);
											}
											gl.uniform3iv(uindice,tempo);
											return;
										}
										let tempo = new Int32Array(v);
										gl.uniform3iv(uindice,tempo);
										return;
									}
									gl.uniform3iv(uindice,v);
								});
								break;

								break;
							case 'ivec4':
								this.set_struct_uniform_func(ustruct_obj,uname, 'ivec4', (v) =>  {
									if (v.data)
									{
										gl.uniform4iv(uindice,v.data);
										return;
									}
									if (Array.isArray(v))
									{
										if (v[0].data)
										{
											let length=Math.min(sz,v.length);
											let tempo = new Int32Array(length*4);
											for (let j = 0; j<length; j++)
											{
												tempo.set(v[j].data,j*4);
											}
											gl.uniform4iv(uindice,tempo);
											return;
										}
										let tempo = new Int32Array(v);
										gl.uniform4iv(uindice,tempo);
										return;
									}
									gl.uniform4iv(uindice,v);
								});
								break;
							}
							this['_unif_'+uname] = uindice;
						}
					}
				}
			}
		}
	},




	update_matrices: function(proj,view)
	{
		if (this._unif_projectionMatrix)
		{
			gl.uniformMatrix4fv(this._unif_projectionMatrix,false,(proj.data==undefined)?proj:proj.data);
		}
		if (this._unif_viewMatrix)
		{
			gl.uniformMatrix4fv(this._unif_viewMatrix,false,view.data);
		}
		if (this._unif_normalMatrix)
		{
			let m = view.inverse3transpose();
			gl.uniformMatrix3fv(this._unif_normalMatrix,false,m.data);
		}
	},

	compile_shader: function(src, type, shader_name,first_line)
	{
		let shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		let ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		let infolog = gl.getShaderInfoLog(shader);
		if (!ok)
		{
			ewgl_common.console.error_nl("<B>Erreur de compilation dans "+shader_name+"</B>");
			ewgl_common.console.error_nl(infolog);
			const errors = infolog.match(/ERROR: (\w*):(\w*):/);
			if (errors != null)
			{
				let num = parseInt(errors[2]);
				let ssrc = src.split('\n');
				let slines = '';
				let i0 = num>5 ? num -5 : 0;
				let ie = num+5 < ssrc.length ? num+5 : ssrc.length;
				for (let i=i0; i<ie; ++i)
				{
					let line = (first_line >1) ? ' '+(i+first_line) +  ' :' : '';
					line += (i+1);
					for (let j=1;j<11-line.length;++j)
					{
						line += ' ';
					}
					let col = (num===i+1)?"color:"+ewgl_common.console.color_error+"'>":"color:"+ewgl_common.console.color_info+"'>";
					slines += "<par style='" + col + line + ": " + ssrc[i] + "<br></par>";
				}
				ewgl_common.console.custom(slines);
			}
			gl.deleteShader(shader);
			return null;
		}
		else if (infolog.length > 0)
		{
			ewgl_common.console.warning("Attention a la compil de "+shader_name);
			ewgl_common.console.warning(infolog);
		}

		return shader;
	},

	compile: function(vsrc_name, fsrvc_name)
	{
		let attached = gl.getAttachedShaders(this.prg);
		attached.forEach( (s) =>
		{
			gl.detachShader(this.prg, s);
			gl.deleteShader(s);
		});

		if (this.f_src === undefined)
		{
			return this.compile_transform_feedback_program();
		}

		let vs = this.compile_shader(this.v_src, gl['VERTEX_SHADER'],vsrc_name?vsrc_name:this.sh_name+'.vert',this.src_first_line_vs);
		let fs = this.compile_shader(this.f_src, gl['FRAGMENT_SHADER'],fsrvc_name?fsrvc_name:this.sh_name+'.frag',this.src_first_line_fs);
		if (!vs || !fs)
		{
			return false;
		}

		gl.attachShader(this.prg, vs);
		gl.attachShader(this.prg, fs);

		let v_ncom = this.remove_comments(this.v_src);
		let f_ncom = this.remove_comments(this.f_src);

		// this.fix_attribute_loc(v_ncom);
		gl.linkProgram(this.prg);
		this.search_attribute_loc(v_ncom);
		this.search_uniforms(v_ncom,f_ncom);
		this.search_struct_uniforms(v_ncom,f_ncom);
		Object.seal(this.uniform);

		this.compilation_ok = gl.getProgramParameter(this.prg, gl.LINK_STATUS);

		let infolog = gl.getProgramInfoLog(this.prg);

		if (!this.compilation_ok)
		{
			gl.deleteProgram(this.prg);
			return false;
		}
		else if (infolog.length > 0)
		{
			ewgl_common.console.warning("Attention au link de "+this.sh_name);
			ewgl_common.console.warning(infolog);
		}
		// gl.detachShader(this.prg, vs);
		// gl.detachShader(this.prg, fs);
		return true;
	},


	// create_program: function()
	// {
	// 	this.prg = gl.createProgram();
	// 	this.compile();
	// },

/*
	load(v_url,f_url)
	{
		let p1 = new Promise((resolve,reject) => {
				let xhr1 = new XMLHttpRequest();
				xhr1.onload = () => {
					let v_src=xhr1.responseText;
					let xhr2 = new XMLHttpRequest();
					xhr2.onload = () => {
						let f_src=xhr2.responseText;
						this.create_program(v_src,f_src,v_url,f_url);
						resolve();
					};
					xhr2.open("GET", f_url, true);
					xhr2.send();
				};
				xhr1.open("GET", v_url, true);
				xhr1.send();
			});
		return p1;
	},
	*/

	compile_transform_feedback_program: function()
	{
		let vs = this.compile_shader(this.v_src, gl.VERTEX_SHADER, this.sh_name+'.vert', this.src_first_line_vs);
		if (!vs)
		{
			return false;
		}
		gl.attachShader(this.prg, vs);
		gl.transformFeedbackVaryings(this.prg, this.sh_outs, gl.SEPARATE_ATTRIBS);

		var fake_frag=`#version 300 es
		void main() {}`;
		let fs = this.compile_shader(fake_frag, gl.FRAGMENT_SHADER, 'fake.frag', 1);
		if (!fs)
		{
			return false;
		}
		gl.attachShader(this.prg, fs);

		gl.linkProgram(this.prg);

		let v_ncom = this.remove_comments(this.v_src);
		this.search_attribute_loc(v_ncom);
		this.search_uniforms(v_ncom,'');
		this.search_struct_uniforms(v_ncom,'');
		Object.seal(this.uniform);

		this.compilation_ok = gl.getProgramParameter(this.prg, gl.LINK_STATUS);
		let infolog = gl.getProgramInfoLog(this.prg);
		if (!this.compilation_ok)
		{
			ewgl_common.console.error(gl.getProgramInfoLog(this.prg));
			gl.deleteProgram(this.prg);
			return false;
		}
		else if (infolog.length > 0)
		{
			ewgl_common.console.warning("Attention au link de "+this.sh_name);
			ewgl_common.console.warning(infolog);
		}
		// gl.detachShader(this.prg, vs);
		return true;
	},

	gldelete:function()
	{
		gl.deleteProgram(this.prg);
	}

}

function ShaderEmptyProgram()
{
	let locations = new Map();
	let prg = null;
	let o = Object.assign(Object.create(ShaderProgram_ops),{locations, uniform:{}, uniform_type:{}, in:{}, prg});
	return o;
}

/**
 * Create a shader program
 * @param {string} vert the vertex-shader source
 * @param {string} frag the fragment-shader source
 * @param {string} name the name of program
 */
function ShaderProgram(vert, frag, name, first_line_vs=1,first_line_fs=1)
{
	let locations = new Map();
	let prg = gl.createProgram();

	let v_src = ewgl_common.crypt_mode? ewgl_common.uncrypt(vert) : vert;
	let f_src = ewgl_common.crypt_mode? ewgl_common.uncrypt(frag) : frag;

	let o = Object.assign(Object.create(ShaderProgram_ops),{v_src,f_src,locations, uniform:{}, uniform_type:{}, in:{}, prg,
	update_interf_unif:[], sh_name:name, src_first_line_vs:first_line_vs, src_first_line_fs:first_line_fs});
	o.compile();

	ewgl_common.prg_list.push(o);

	return o;
}


function ShaderProgramFromFiles(v_url,f_url,name="")
{
//	ewgl_common.pause_mode = true;
	let locations = new Map();
	let prg = gl.createProgram();
	let o = Object.assign(Object.create(ShaderProgram_ops),{locations, uniform:{}, uniform_type:{}, in:{}, prg,
	update_interf_unif:[], sh_name:name, src_first_line_vs:1, src_first_line_fs:1});

	ewgl_common.prg_list.push(o);

	let pr_v = new Promise( (resolve, reject) =>
	{
		fetch(v_url).then(res =>
		{
			res.blob().then( blob =>
			{
				let reader = new FileReader();
				reader.onload = () => {resolve(reader.result);}
				reader.readAsText(blob);
			})
		},()=>{ewgl_common.console.error('can not load '+v_url);reject();})
	});
	let pr_f = new Promise( (resolve, reject) =>
	{
		fetch(f_url).then(res =>
		{
			res.blob().then( blob =>
			{
				let reader = new FileReader();
				reader.onload = () => {resolve(reader.result);}
				reader.readAsText(blob);
			})
		},()=>{ewgl_common.console.error('can not load '+f_url);reject();})
	});

	return new Promise((resolve, reject) => {
		Promise.all([pr_v, pr_f]).then( ([v,f]) =>
		{
			if (o.name==="")
			{
				o.name = v_url;
			}
			o.v_src = v;
			o.f_src = f;
			o.compile(v_url,f_url);
			resolve(o);
		});
	}
//	, { console.log("Error while loading shader");}
	);
}



function ShaderTransformFeedbackProgram(vert, outs, name, first_line_vs=1)
{
	let locations = new Map();
	let prg = gl.createProgram();
	let v_src = ewgl_common.crypt_mode? ewgl_common.uncrypt(vert) : vert;

	let o = Object.assign(Object.create(ShaderProgram_ops),{v_src,locations, uniform:{}, uniform_type:{}, in:{}, prg,
	update_interf_unif:[], sh_outs:outs, sh_name: name, src_first_line_vs:first_line_vs});
	o.compile_transform_feedback_program();

	ewgl_common.prg_list.push(o);

	return o;
}


function unbind_shader()
{
	gl.useProgram(null);
	ewgl_common.binded_prg = null;
	Uniforms = null;
}


function load_img(url_blob)
{
	if (typeof url_blob === "string")
	{
		return new Promise((resolve,reject) =>
		{
			let img = new Image();
			img.src = url_blob;
			img.addEventListener('load', () =>
			{
				resolve(img);
			});
		});
	}
	else
	{
		return new Promise((resolve,reject) =>
		{
			let img = new Image();
			var reader = new FileReader();
			reader.onload = function(e) {
				img.src = e.target.result;
				resolve(img);
			}
			reader.readAsDataURL(url_blob);
		});
	}
}

let Texture2d_ops =
{
	alloc: function(w, h, iformat, data=null, level=0 )
	{
		let l2 = Math.pow(2,level);
		if (level===0)
		{
			this.iformat = iformat;
			[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat);
			this.width  = w;
			this.height = h;
		}
		else
		{
			if ((w != this.width/l2) || (h != this.height/l2))
			{
				console.log("Error wrong mipmap size");
			}
		}
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		gl.texImage2D(gl.TEXTURE_2D, level, this.iformat, this.width/l2, this.height/l2, 0, this.eformat, this.dt, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},

	init: function(iformat, level=0)
	{
		this.iformat = iformat;
		[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat);
		this.width  = 0;
		this.height = 0;
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		gl.texImage2D(gl.TEXTURE_2D, level, this.iformat, 0, 0, 0, this.eformat, this.dt, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},

	// for use in FBO resize
	resize: function(w,h,level=0)
	{
		this.width  = w;
		this.height = h;
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		gl.texImage2D(gl.TEXTURE_2D, level, this.iformat, w, h, 0, this.eformat, this.dt, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},


	update: function(data, level=0)
	{
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		let dt = ewgl_common.gl_type_of_array.get(data.constructor.name);
		let l2 = Math.pow(2,level);
		gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, this.width/l2,this.height/l2, this.eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},

	update_sub: function(x,y,w,h, data, level=0)
	{
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		let dt = ewgl_common.gl_type_of_array.get(data.constructor.name);
		gl.texSubImage2D(gl.TEXTURE_2D, level, x,y,w,h, this.eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
	},

	load: function(url_blob, iformat = gl.RGB8, eformat)
	{
		if (eformat == undefined)
		{
			this.iformat = iformat;
			[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat) ;
		}
		else
		{
			this.iformat = iformat;
			this.eformat = eformat;
			this.dt = gl.UNSIGNED_BYTE;
		}


		return new Promise((resolve,reject) =>
		{
			load_img(url_blob).then( img =>
			{
				this.width = img.width;
				this.height = img.height;
				gl.bindTexture(gl.TEXTURE_2D, this.id);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, this.iformat, this.eformat, this.dt, img);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.bindTexture(gl.TEXTURE_2D, null);
				resolve();
			});
		});
	},

	bind: function(unit)
	{
		if (unit !== undefined)
		{
			gl.activeTexture(unit + gl.TEXTURE0);
		}
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		return unit;
	},
	
	set_max_anisotropy: function(a)
	{
		this.bind();
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_ANISOTROPY_EXT,a);
		unbind_texture2d();
	},

	simple_params: function()
	{
		this.bind();
		for( let i=0; i<arguments.length; ++i)
		{
			const p = arguments[i];
			switch(p)
			{
				case gl.NEAREST:
				case gl.LINEAR:
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, p);
					break;
				case gl.NEAREST_MIPMAP_NEAREST:
				case gl.NEAREST_MIPMAP_LINEAR:
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
					break;
				case gl.LINEAR_MIPMAP_NEAREST:
				case gl.LINEAR_MIPMAP_LINEAR:
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					break;
				case gl.REPEAT:
				case gl.MIRRORED_REPEAT:
				case gl.CLAMP_TO_EDGE:
				case gl.CLAMP_TO_BORDER:
				case gl.MIRROR_CLAMP_TO_EDGE:
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, p);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, p);
					break;
			}
		}
	},


	from_float_buffer: function(float_buffer, dim, tex_width = 4096)
	{
		const formats = [gl.R32F,gl.RG32F,gl.RGB32F,gl.RGBA32F];
		let nsz = tex_width*dim;

		let nblines = float_buffer.length/nsz;
		let nbl1 = Math.ceil(nblines);
		nblines = Math.floor(nblines);
		this.alloc(tex_width,nbl1,formats[dim-1]);
		if (nblines>0)
		{
			this.update_sub(0,0,tex_width,nblines,float_buffer);
			if ( float_buffer.length%nsz > 0)
			{
				let buff =  new Float32Array(float_buffer.buffer,nblines*4*nsz);
				this.update_sub(0,nblines,(float_buffer.length%nsz)/dim,1,buff);
			}
		}
		else
		{
			this.update_sub(0,0,(float_buffer.length)/dim,1,float_buffer);
		}
	},

	from_index_buffer: function(index_buffer, tex_width = 4096)
	{
		let nblines = index_buffer.length/tex_width;
		let nbl1 = Math.ceil(nblines);
		nblines = Math.floor(nblines);
		this.alloc(tex_width,nbl1,gl.R32UI);
		if (nblines>0)
		{
			this.update_sub(0,0,tex_width,nblines,index_buffer);
			if ( index_buffer.length%tex_width > 0)
			{
				let buff =  new Uint32Array(index_buffer.buffer,nblines*4*tex_width);
				this.update_sub(0,nblines,index_buffer.length%tex_width,1,buff);
			}
		}
		else
		{
			this.update_sub(0,0,(index_buffer.length),1,index_buffer);
		}
	},

	gldelete:function()
	{
		gl.deleteTexture(this.id);
	}
}


function Texture2d()
{
	let id = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, id);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	for(let i=0; i<arguments.length; ++i)
	{
		gl.texParameteri(gl.TEXTURE_2D, arguments[i][0], arguments[i][1]);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);

	return Object.assign(Object.create(Texture2d_ops), {id,width:0,height:0});

}


function unbind_texture2d()
{
	gl.bindTexture(gl.TEXTURE_2D, null);
}


let Texture3d_ops =
{

	alloc: function(w,h,d, iformat, data = null)
	{
		this.iformat = iformat;
		this.width  = w;
		this.height = h;
		this.depth  = d;
		[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat);
		gl.bindTexture(gl.TEXTURE_3D, this.id);
		gl.texImage3D(gl.TEXTURE_3D, 0, iformat, w, h,d, 0, this.eformat, this.dt, data);
		gl.bindTexture(gl.TEXTURE_3D, null);
	},

	update: function(data)
	{
		gl.bindTexture(gl.TEXTURE_3D, this.id);
		let dt = ewgl_common.gl_type_of_array.get(data.constructor.name);
		gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, this.width, this.height, this.depth, this.eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_3D, null);
	},


	bind: function(unit)
	{
		if (unit !== undefined)
		{
			gl.activeTexture(unit + gl.TEXTURE0);
		}
		gl.bindTexture(gl.TEXTURE_3D, this.id);
		return unit;
	},



	simple_params: function()
	{
		this.bind();
		for( let i=0; i<arguments.length; ++i)
		{
			const p = arguments[i];
			switch(p)
			{
				case gl.NEAREST:
				case gl.LINEAR:
					gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, p);
					break;
				case gl.NEAREST_MIPMAP_NEAREST:
				case gl.LINEAR_MIPMAP_NEAREST:
				case gl.NEAREST_MIPMAP_LINEAR:
				case gl.LINEAR_MIPMAP_LINEAR:
					gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, p);
					break;
				case gl.REPEAT:
				case gl.MIRRORED_REPEAT:
				case gl.CLAMP_TO_EDGE:
				case gl.CLAMP_TO_BORDER:
				case gl.MIRROR_CLAMP_TO_EDGE:
					gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, p);
					gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, p);
					gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, p);
					break;
			}
		}
	},

	load_images: function(urls, iformat = gl.RGB8, eformat)
	{
		if (eformat == undefined)
		{
			this.iformat = iformat;
			[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat) ;
		}
		else
		{
			this.iformat = iformat;
			this.eformat = eformat;
			this.dt = gl.UNSIGNED_BYTE;
		}

		return new Promise((resolve,reject) =>
			{
			let imgp = Array.from(urls, u => load_img(u));
			Promise.all(imgp).then(imgs =>
				{
					this.width = imgs[0].width;
					this.height = imgs[0].height;
					this.depth = imgs.length;
					gl.bindTexture(gl.TEXTURE_3D, this.id);
					gl.texImage3D(gl.TEXTURE_3D,0,this.iformat,
						this.width,this.height,this.depth, 0,
						this.eformat,this.dt,null);
						
					for (let i = 0; i<this.depth; ++i)
					{
					 	gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, i, this.width, this.height, 1, this.eformat, this.dt, imgs[i]);
					}
					gl.bindTexture(gl.TEXTURE_3D, null);
					resolve();
				});
			});
	},

	gldelete:function()
	{
		gl.deleteTexture(this.id);
	}
}


function Texture3d()
{
	let id = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_3D, id);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

	for(let i=0; i<arguments.length; ++i)
	{
		gl.texParameteri(gl.TEXTURE_3D, arguments[i][0], arguments[i][1]);
	}

	return Object.assign(Object.create(Texture3d_ops), {id,width:0,height:0,depth:0});

}

function unbind_texture3d()
{
	gl.bindTexture(gl.TEXTURE_3D, null);
}



let TextureCubeMap_ops =
{
	load: function(urls, iformat = gl.RGB8, eformat = gl.RGB)
	{
		if (eformat == undefined)
		{
			this.iformat = iformat;
			[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat) ;
		}
		else
		{
			this.iformat = iformat;
			this.eformat = eformat;
			this.dt = gl.UNSIGNED_BYTE;
		}

		let proms = [];
		for (let i=0; i<6; ++i)
		{
			proms.push(	new Promise((resolve,reject) => {
				let img = new Image();
				img.src = urls[i];
				img.addEventListener('load', () =>
				{
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);
					gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, 0, this.iformat, this.eformat, this.dt, img);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
					resolve();
				});
			}));
		}

		return Promise.all(proms);
	},

	alloc: function(w, iformat, data)
	{
		this.iformat = iformat;
		[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat);
		this.width  = w;
		this.height = w;
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);
		for(let i=0; i<6; ++i)
		{
			let face_data = data===undefined ? null : data[i];
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i, 0, this.iformat, w, w, 0, this.eformat, this.dt, face_data);
		}
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	},

	bind: function(unit)
	{
		if (unit !== undefined)
		{
			gl.activeTexture(unit + gl.TEXTURE0);
		}
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.id);
		return unit;
	},
	gldelete: function()
	{
		gl.deleteTexture(this.id);
	},

}


function TextureCubeMap()
{
	let id = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, id);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	for(let i=0; i<arguments.length; ++i)
	{
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, arguments[i][0], arguments[i][1]);
	}
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	return Object.assign(Object.create(TextureCubeMap_ops), {id});

}


function unbind_texture_cube()
{
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
}




let Texture2dArray_ops =
{
	set_max_anisotropy: function(a)
	{
		this.bind();
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_ANISOTROPY_EXT,a);
		unbind_texture2d();
	},

	simple_params: function()
	{
		this.bind();
		for( let i=0; i<arguments.length; ++i)
		{
			const p = arguments[i];
			switch(p)
			{
				case gl.NEAREST:
				case gl.LINEAR:
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, p);
					break;
				case gl.NEAREST_MIPMAP_NEAREST:
				case gl.NEAREST_MIPMAP_LINEAR:
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
					break;
				case gl.LINEAR_MIPMAP_NEAREST:
				case gl.LINEAR_MIPMAP_LINEAR:
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, p);
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					break;
				case gl.REPEAT:
				case gl.MIRRORED_REPEAT:
				case gl.CLAMP_TO_EDGE:
				case gl.CLAMP_TO_BORDER:
				case gl.MIRROR_CLAMP_TO_EDGE:
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, p);
					gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, p);
					break;
			}
		}
	},

	alloc: function(w, h, n, iformat, data=null)
	{
		this.iformat = iformat;
		[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat);
		this.width  = w;
		this.height = h;
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.id);
		gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, this.iformat, w, h, n, 0, this.eformat, this.dt, data);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
	},

//	init: (iformat) => { alloc(0,0,n,iformat,null);},

	// // for use in FBO resize
	// resize: function(w,h)
	// {
	// 	this.width  = w;
	// 	this.height = h;
	// 	gl.bindTexture(gl.TEXTURE_2D, this.id);
	// 	gl.texImage3D(gl.TEXTURE_2D, 0, this.iformat, w, h, 0, this.eformat, this.dt, null);
	// 	gl.bindTexture(gl.TEXTURE_2D, null);
	// },


	update_sub: function(i,x,y,w,h, eformat, data)
	{
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.id);
		let dt = ewgl_common.gl_type_of_array.get(data.constructor.name);
		gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, x, y, i, w, h, 1, eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
	},

	update_column: function(x, y, eformat, data)
	{
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.id);
		let dt = ewgl_common.gl_type_of_array.get(data.constructor.name);
		gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, x,y,0,w,h,this.nb, eformat, dt, data);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
	},



	load_images: function(urls, iformat = gl.RGB8, eformat)
	{
		if (eformat == undefined)
		{
			this.iformat = iformat;
			[this.eformat,this.dt] = ewgl_common.gl_texture_formats.get(iformat) ;
		}
		else
		{
			this.iformat = iformat;
			this.eformat = eformat;
			this.dt = gl.UNSIGNED_BYTE;
		}

		return new Promise((resolve,reject) =>
			{
			let imgp = Array.from(urls, u => load_img(u));
			Promise.all(imgp).then(imgs =>
				{
					this.width = imgs[0].width;
					this.height = imgs[0].height;
					this.nb = imgs.length;
					gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.id);
					gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,this.iformat,
						this.width,this.height,this.nb, 0,
						this.eformat,this.dt,null);
						
					for (let i = 0; i<this.nb; ++i)
					{
					 	gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, this.width, this.height, 1, this.eformat, this.dt, imgs[i]);
					}
					gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
					resolve();
				});
			});
	},

	bind: function(unit)
	{
		if (unit !== undefined)
		{
			gl.activeTexture(unit + gl.TEXTURE0);
		}
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.id);
		return unit;
	},

	gldelete: function()
	{
		gl.deleteTexture(this.id);
	},

}


function Texture2dArray()
{
	let id = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, id);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, 3);

	for(let i=0; i<arguments.length; ++i)
	{
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, arguments[i][0], arguments[i][1]);
	}

	return Object.assign(Object.create(Texture2dArray_ops), {id,width:0,height:0,nb:0});

}

function unbind_texture2dArray()
{
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
}




let FBO_ops =
{
	bind: function()
	{
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.id);
		if (this.colors_attach[0])
		{
			gl.viewport(0,0,this.colors_attach[0].width,this.colors_attach[0].height);
		}
		else
		{
			gl.viewport(0,0,this.depth_texture.width,this.depth_texture.height);
		}
		let att = [];
		for (let i=0; i<this.colors_attach.length; ++i)
		{
			att.push(ewgl_common.attach_enum[i])
		}
		if (att.length ===0)
		{
			att.push(gl.NONE);
		}
		gl.drawBuffers(att);
	}
	,
	unbind: function()
	{
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.prev_fb);
		gl.viewport(this.prev_vp[0],this.prev_vp[1],this.prev_vp[2],this.prev_vp[3]);
		gl.drawBuffers([gl.BACK]);
	},

	draw_buffers: function( ...attach)
	{
		let att = [];
		for (let i=0; i<attach.length; ++i)
		{
			att.push(ewgl_common.attach_enum[i])
		}
		if (att.length ===0)
		{
			att.push(gl.NONE);
		}
		gl.drawBuffers(att);
	},


	resize: function(w,h)
	{
		let attach = this.colors_attach;

		attach.forEach ( a => { a.resize(w,h); });

		if (this.depthRenderBuffer)
		{
			gl.bindRenderbuffer( gl.RENDERBUFFER, this.depthRenderBuffer );
			gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h );
			gl.bindRenderbuffer( gl.RENDERBUFFER, null);
		}
		if (this.depth_texture)
		{
			this.depth_texture.resize(w,h);
		}
	},
	get width()
	{
		return this.colors_attach[0].width;
	},
	get height()
	{
		return this.colors_attach[0].height;
	},
	get tex()
	{
		return this.colors_attach[0];
	},
	texture: function(i)
	{
		return this.colors_attach[i];
	},

	gldelete:function()
	{
		gl.deleteFramebuffer(this.id);
	}
}


function FBO(colors_attach, cube_faces)
{
	let id = gl.createFramebuffer();
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, id);

	if (!Array.isArray(colors_attach))
	{
		colors_attach = [colors_attach];
	}

	if (cube_faces != undefined && !Array.isArray(cube_faces))
	{
		cube_faces = [cube_faces];
	}

	for(let i=0; i< colors_attach.length; ++i)
	{
		let text_type = cube_faces === undefined ? gl.TEXTURE_2D :gl.TEXTURE_CUBE_MAP_POSITIVE_X + cube_faces[i];
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, ewgl_common.attach_enum[i], text_type, colors_attach[i].id, 0);
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return Object.assign(Object.create(FBO_ops),{id,colors_attach,prev_vp:null,prev_fb:null,depthRenderBuffer:null,depth_texture:null});
}


function FBO_Depth(colors_attach, fbo_depth, cube_faces)
{
	let id = gl.createFramebuffer();
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, id);

	if (! Array.isArray(colors_attach))
	{
		colors_attach = [colors_attach];
	}

	for(let i=0; i< colors_attach.length; ++i)
	{
		let text_type = cube_faces === undefined ? gl.TEXTURE_2D :gl.TEXTURE_CUBE_MAP_POSITIVE_X + cube_faces[i];
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, ewgl_common.attach_enum[i], text_type, colors_attach[i].id, 0);
	}


	let depthRenderBuffer = null;
	if (fbo_depth)
	{
		depthRenderBuffer = fbo_depth.depthRenderBuffer;
		gl.bindRenderbuffer( gl.RENDERBUFFER, depthRenderBuffer );
		gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
		gl.bindRenderbuffer( gl.RENDERBUFFER, null);
	}
	else
	{
		depthRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer( gl.RENDERBUFFER, depthRenderBuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, colors_attach[0].width, colors_attach[0].height );
		gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
		gl.bindRenderbuffer( gl.RENDERBUFFER, null);
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	return Object.assign(Object.create(FBO_ops),{id,colors_attach,prev_vp:null,prev_fb:null,depthRenderBuffer,depth_texture:null});
}


function FBO_DepthTexture(colors_attach, depth, cube_faces)
{
	let id = gl.createFramebuffer();
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, id);

	if (! Array.isArray(colors_attach))
	{
		colors_attach = [colors_attach];
	}

	for(let i=0; i< colors_attach.length; ++i)
	{
		let text_type = cube_faces === undefined ? gl.TEXTURE_2D :gl.TEXTURE_CUBE_MAP_POSITIVE_X + cube_faces[i];
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, ewgl_common.attach_enum[i], text_type, colors_attach[i].id, 0);
	}

	let depth_texture = null;
	if (depth)
	{
		depth_texture = (depth.eformat === gl.DEPTH_COMPONENT) ? depth : depth.depth_texture;
	}
	else
	{
		depth_texture = Texture2d([gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_MIN_FILTER,gl.NEAREST]);
		depth_texture.init(gl.DEPTH_COMPONENT32F);
	}

	gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_texture.id, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	return Object.assign(Object.create(FBO_ops),{id,colors_attach,prev_vp:null,prev_fb:null,depthRenderBuffer:null,depth_texture});
}


function push_fbo()
{
	ewgl_common.FBO_Stack.push([gl.getParameter(gl.VIEWPORT), gl.getParameter(gl.FRAMEBUFFER_BINDING)]);
}

function pop_fbo()
{
	let [prev_vp,prev_fb] = ewgl_common.FBO_Stack.pop();
	gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, prev_fb);
	gl.viewport(prev_vp[0],prev_vp[1],prev_vp[2],prev_vp[3]);
}


let FBOR_ops =
{
	bind: function()
	{
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.id);
		gl.readBuffer(gl.COLOR_ATTACHMENT0);
	}
	,
	get width()
	{
		return this.color_attach.width;
	},
	get height()
	{
		return this.color_attach.height;
	},
	get tex()
	{
		return this.color_attach;
	},

	gldelete:function()
	{
		gl.deleteFramebuffer(this.id);
	}

}


function FBO_READ(color_attach)
{
	let id = gl.createFramebuffer();
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, id);

	gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_attach.id, 0);
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
	return Object.assign(Object.create(FBOR_ops),{id,color_attach});
}


function unbind_fbo_read()
{
	gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
}




let TransformFeedback_ops =
{
	start: function(primitive,vbos)
	{
		this.shader.bind();
		gl.enable(gl.RASTERIZER_DISCARD);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.id);
		for (let i=0; i<vbos.length; ++i)
		{
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, i, vbos[i].id);
		}
		gl.beginTransformFeedback(primitive);
	},

	stop: function()
	{
		gl.endTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
		gl.disable(gl.RASTERIZER_DISCARD);
		unbind_shader();
	},
	gldelete:function()
	{
		gl.deleteTransformFeedback(this.id);
	}
	// bind: function()
	// {
	// 	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.id);
	// },

	// unbind: function()
	// {
	// 	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
	// }

}

function TransformFeedback(vert, outs, name, first_line_vs=1)
{
	let shader = ShaderTransformFeedbackProgram(vert, outs, name, first_line_vs);
	let id  = gl.createTransformFeedback();
	return Object.assign(Object.create(TransformFeedback_ops),
	{id, shader});
}



//
// MESH
//

function create_BB()
{
	if (arguments[1].data)
	{
		const A = arguments[0];
		const B = arguments[1];
		let C = A.add(B).mult(0.5)
		let R = B.sub(A).length()/2;
		return {min:A , max:B, center:C, radius:R};
	}
	const C = arguments[0];
	const R = arguments[1];
	const vR = Vec3(R,R,R).mult(Math.sqrt(3));
	let A = C.sub(vR);
	let B = C.add(vR);
	return {min:A , max:B, center:C, radius:R};
}

function merge_BBs(b1,b2)
{
	let min = null;
	let max = null;

	if( Array.isArray(b1))
	{
		min = Vec3(b1[0].min.x,b1[0].min.y,b1[0].min.z);
		max = Vec3(b1[0].max.x,b1[0].max.y,b1[0].max.z);
		for (let i=1; i<b1.length;++i)
		{
			let b= b1[i];
			min = Vec3(Math.min(min.x,b.min.x),Math.min(min.y,b.min.y),Math.min(min.z,b.min.z));
			max = Vec3(Math.max(max.x,b.max.x),Math.max(max.y,b.max.y),Math.max(max.z,b.max.z));
		}
	}
	else
	{
		min = Vec3(Math.min(b1.min.x,b2.min.x),Math.min(b1.min.y,b2.min.y),Math.min(b1.min.z,b2.min.z));
		max = Vec3(Math.max(b1.max.x,b2.max.x),Math.max(b1.max.y,b2.max.y),Math.max(b1.max.z,b2.max.z));
	}
	let C = min.add(max).mult(0.5)
	let R = max.sub(min).length()/2;
	return {min, max, center:C, radius:R};
}

function BBMatrix()
{
	return Matrix.translate(bb.center.neg()).mult(Matrix.BB.scale(bb.radius));
}

let Mesh_ops =
{
compute_normals()
{
	let t_start = Date.now();
	const Is= this.tris;
	if (this.normals === null)
	{
		this.normals = new Float32Array(this.positions.length);
	}
	this.normals.fill(0);
	let nb = Is.length;
	for(let i=0;i<nb;)
	{
		let iA = Is[i++];
		let iB = Is[i++];
		let iC = Is[i++];

		let jA = 3*iA;
		let jB = 3*iB;
		let jC = 3*iC;

		let Ux = this.positions[jB++] - this.positions[jA];
		let Vx = this.positions[jC++] - this.positions[jA++];
		let Uy = this.positions[jB++] - this.positions[jA];
		let Vy = this.positions[jC++] - this.positions[jA++];
		let Uz = this.positions[jB] - this.positions[jA];
		let Vz = this.positions[jC] - this.positions[jA];

		let nf_x = Uy*Vz - Uz*Vy;
		let nf_y = Uz*Vx - Ux*Vz;
		let nf_z = Ux*Vy - Uy*Vx;

		this.normals[jA--] += nf_z;
		this.normals[jA--] += nf_y;
		this.normals[jA] += nf_x;
		this.normals[jB--] += nf_z;
		this.normals[jB--] += nf_y;
		this.normals[jB] += nf_x;
		this.normals[jC--] += nf_z;
		this.normals[jC--] += nf_y;
		this.normals[jC] += nf_x;
	}
	nb = this.normals.length;
	for(let i=0;i<nb;)
	{
		let nf_x = this.normals[i];
		let nf_y = this.normals[i+1];
		let nf_z = this.normals[i+2];
		let no = Math.sqrt(nf_x*nf_x+nf_y*nf_y+nf_z*nf_z);
		this.normals[i++] /= no;
		this.normals[i++] /= no;
		this.normals[i++] /= no;
	}
	ewgl_common.console.info_nl("Normals computed in: "+(Date.now() - t_start) + ' ms');
},


compute_BB()
{
	let x_min =  this.positions[0];
	let y_min =  this.positions[1];
	let z_min =  this.positions[2];
	let x_max =  x_min;
	let y_max =  y_min;
	let z_max =  z_min;

	const nb = this.positions.length;
	for(let i=0;i<nb;)
	{
		const x = this.positions[i++];
		const y = this.positions[i++];
		const z = this.positions[i++];
		if (x < x_min)
		{
			x_min = x;
		}
		if (x > x_max)
		{
			x_max = x;
		}
		if (y < y_min)
		{
			y_min = y;
		}
		if (y > y_max)
		{
			y_max = y;
		}
		if (z < z_min)
		{
			z_min = z;
		}
		if (z > z_max)
		{
			z_max = z;
		}
	}

	let A = Vec3(x_min,y_min,z_min);
	let B = Vec3(x_max,y_max,z_max);
	let C = A.add(B).mult(0.5)
	let R = B.sub(A).length()/2;
	return {min:A , max:B, center:C, radius:R};
},

gen_vao: function (p=-1, n=-1, t=-1, tg =-1, c=-1)
{
	if (p>=0 && this.positions && !this.vbo_p)
	{
		this.vbo_p = VBO(this.positions,3);
	}

	if (n>=0 && this.normals && !this.vbo_n)
	{
		this.vbo_n =VBO(this.normals,3);
	}

	if (t>=0 && this.texcoords && !this.vbo_t)
	{
		this.vbo_t = VBO(this.texcoords,2);
	}

	if (tg>=0 && this.tangents && !this.vbo_tg)
	{
		this.vbo_tg = VBO(this.tangents,3);
	}

	if (c>=0 && this.colors && !this.vbo_c)
	{
		this.vbo_c = VBO(this.colors,3);
	}

	return VAO([p, this.vbo_p], [n,this.vbo_n], [t,this.vbo_t],[tg,this.vbo_tg],[c,this.vbo_c]);
},

gen_inst_vao: function (ivbos, p=-1, n=-1, t=-1, tg=-1, c=-1)
{
	let params = [];
	if (p>=0 && this.positions && !this.vbo_p)
	{
		this.vbo_p = VBO(this.positions,3);
		params.push([p,this.vbo_p,0]);
	}

	if (n>=0 && this.normals && !this.vbo_n)
	{
		this.vbo_n =VBO(this.normals,3);
		params.push([n,this.vbo_n,0]);
	}

	if (t>=0 && this.texcoords && !this.vbo_t)
	{
		this.vbo_t = VBO(this.texcoords,2);
		params.push([t,this.vbo_t,0]);
	}

	if (tg>=0 && this.tangents && !this.vbo_tg)
	{
		this.vbo_tg = VBO(this.tangents,3);
		params.push([tg,this.vbo_tg,0]);
	}

	if (c>=0 && this.colors && !this.vbo_c)
	{
		this.vbo_c = VBO(this.colors,3);
		params.push([c,this.vbo_c,0]);
	}

	ivbos.forEach((iv) => { params.push(iv); });

	let vao = VAO.apply(null,params);
	return vao;
},

gen_ebo_line()
{
	return EBO(this.lines);
},

gen_ebo_tri()
{
	return EBO(this.tris);
},


renderer: function (p=-1, n=-1, tc=-1, tg=-1, c=-1)
{
	let vao = this.gen_vao(p,n,tc,tg,c);
	let nbv = p>=0 ? this.vbo_p.length : n>=0 ? this.vbo_n.length : t>=0 ? this.vbo_t.length : this.vbo_c.length;

	if (this.tris && this.ebo_tri === undefined)
	{
		this.ebo_tri = EBO(this.tris);
	}
	if (this.lines && this.ebo_line === undefined)
	{
		this.ebo_line = EBO(this.lines);
	}

	return Object.assign(Object.create(MeshRenderer_ops),{BB:this.BB, vao, ebo_tri:this.ebo_tri, ebo_line:this.ebo_line, nbv, strip:this.strip});
},

instanced_renderer: function (ivbos, p=-1, n=-1, tc=-1, tg=-1, c=-1)
{
	let vao = this.gen_inst_vao(ivbos,p,n,tc,tg,c);
	let nbv = p>=0 ? this.vbo_p.length : n>=0 ? this.vbo_n.length : t>=0 ? this.vbo_t.length : this.vbo_c.length;

	if (this.tris && this.ebo_tri === undefined)
	{
		this.ebo_tri = EBO(this.tris);
	}
	if (this.lines && this.ebo_line === undefined)
	{
		this.ebo_line = EBO(this.lines);
	}

	return Object.assign(Object.create(MeshInstRenderer_ops),{vao, ebo_tri:this.ebo_tri, ebo_line:this.ebo_line, nbv, strip:this.strip});
},

transform: function(trf)
{
	let nbv = this.positions.length/3;
	let normal_trf = trf.inverse3transpose();

	if (this.positions)
	{
		for (let i=0; i<nbv; ++i)
		{
			let P = Vec3_buff(this.positions,i);
			P.copy(trf.transform(P));
		}
		if (this.vbo_p)
		{
			this.vbo_p.update(this.positions);
		}
	}

	if (this.normals)
	{
		for (let i=0; i<nbv; ++i)
		{
			let N = Vec3_buff(this.normals,i);
			N.copy(normal_trf.mult(N));
		}
		if (this.vbo_n)
		{
			this.vbo_n.update(this.normals);
		}
	}

	this.BB.min.copy(trf.transform(this.BB.min));
	this.BB.max.copy(trf.transform(this.BB.max));
	this.BB.C = this.BB.min.add(this.BB.max).mult(0.5)
	this.BB.R = this.BB.max.sub(this.BB.min).length()/2;

	return this;
},

};

let MeshRenderer_ops = {
	draw : function(prim, vao=null)
	{
		if (vao != null)
		{
			vao.bind();
		}
		else
		{
			this.vao.bind();
		}
		switch(prim)
		{
		case gl.TRIANGLES:
			this.ebo_tri.bind();
			gl.drawElements(this.strip?gl.TRIANGLE_STRIP:gl.TRIANGLES, this.ebo_tri.length, gl.UNSIGNED_INT, 0);
			unbind_ebo();
			break;
		case gl.LINES:
			this.ebo_line.bind();
			gl.drawElements(gl.LINES, this.ebo_line.length, gl.UNSIGNED_INT, 0);
			unbind_ebo();
			break;
		case gl.POINTS:
			gl.drawArrays(gl.POINTS, 0, this.nbv);
			break;
		}
		unbind_vao();
	},

	draw_normals : function(proj, view, length, color)
	{
		if (prg_normal === null)
		{q
			prg_normal = Shader.Program('normal');
		}

		prg_normal.bind();
		update_matrices(proj,view);
		prg_normal.uniform.length=length;
		prg_normal.uniform.color=color;
		this.vao_normal.bind();
		gl.drawArraysInstanced(gl.LINES, 0, 2, this.nbv);
		unbind_vao();
	}
};

let MeshInstRenderer_ops = {
	draw : function(prim, nb, vao=null)
	{
		if (vao != null)
		{
			vao.bind();
		}
		else
		{
			this.vao.bind();
		}
		switch(prim)
		{
		case gl.TRIANGLES:
			this.ebo_tri.bind();
			gl.drawElementsInstanced(this.strip?gl.TRIANGLE_STRIP:gl.TRIANGLES, this.ebo_tri.length, gl.UNSIGNED_INT, 0, nb);
			unbind_ebo();
			break;
		case gl.LINES:
			this.ebo_line.bind();
			gl.drawElementsInstanced(gl.LINES, this.ebo_line.length, gl.UNSIGNED_INT, 0, nb);
			unbind_ebo();
			break;
		case gl.POINTS:
			gl.drawArraysInstanced(gl.POINTS, 0, this.nbv, nb);
			break;
		}
		unbind_vao();
	},
};


let Mesh =
{
emptyRenderer()
{
	return {BB:create_BB(Vec3(-1),Vec3(1)), draw : function() {}, draw_normals : function(){} };
},

Merge ()
{
	let nb3v = 0;
	let has_normals = false;
	let has_texcoords = false;
	let has_colors = false;
	let begin_of_points = [];
	for (let i=0; i < arguments.length; ++i)
	{
		let m = arguments[i];
		begin_of_points.push(nb3v);
		nb3v += m.positions.length;
		has_normals |= m.normals;
		has_texcoords |= m.texcoords;
		has_colors |= m.colors
	}

	let positions = new Float32Array(nb3v);
	let normals = (has_normals) ? new Float32Array(nb3v) : null;
	let texcoords = (has_texcoords) ? new Float32Array(nb3v/3*2) : null;
	let colors = (has_colors) ? new Float32Array(nb3v) : null;

	let BB = { min: arguments[0].BB.min.deep_clone(), max: arguments[0].BB.max.deep_clone(),C:null,R:null};
	let nbt=0;
	let nbl = 0;
	for (let i=0; i < arguments.length; ++i)
	{
		let m = arguments[i];
		BB.min[0] = Math.min(BB.min[0],m.BB.min[0]);
		BB.min[1] = Math.min(BB.min[1],m.BB.min[1]);
		BB.min[2] = Math.min(BB.min[2],m.BB.min[2]);
		BB.max[0] = Math.max(BB.max[0],m.BB.max[0]);
		BB.max[1] = Math.max(BB.max[1],m.BB.max[1]);
		BB.max[2] = Math.max(BB.max[2],m.BB.max[2]);

		positions.set(m.positions, begin_of_points[i]);
		if (has_normals)
		{
			normals.set(m.normals,begin_of_points[i]);
		}
		if (has_texcoords)
		{
			texcoords.set(m.texcoords,2*begin_of_points[i]/3);
		}
		if (has_colors)
		{
			colors.set(m.colors,begin_of_points[i]);
		}
		nbt += m.tris.length;
		nbl += m.lines.length;
	}
	BB.C = BB.min.add(BB.max).mult(0.5)
	BB.R = BB.max.sub(BB.min).length()/2;

	let tris = new Uint32Array(nbt);
	let lines = new Uint32Array(nbl);

	let kt=0;
	let kl=0;
	for (let i=0; i < arguments.length; ++i)
	{
		let m = arguments[i];
		m.tris.forEach( t => { tris[kt++]= t + begin_of_points[i]/3;} );
		m.lines.forEach( l => { lines[kl++]= l + begin_of_points[i]/3;} );
	}

	return Object.assign(Object.create(Mesh_ops),
		{positions, vbo_p:null, normals, vbo_n:null, texcoords, vbo_t:null,
		tris, lines,BB});
},

CubePosOnly()
{
	const V=1;
	const v=-1;
	const BB = create_BB(Vec3(v),Vec3(V));
	return Object.assign(Object.create(Mesh_ops),
		{positions:new Float32Array([v,v,v, V,v,v, V,V,v, v,V,v, v,v,V, V,v,V, V,V,V, v,V,V]),
		vbo_p:null, normals: null, vbo_n:null, texcoords:null, vbo_t:null,
		tris: new Uint32Array([2,1,0,3,2,0, 4,5,6,4,6,7, 0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7]),
		lines: new Uint32Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),BB});
},

Cube()
{
	const V=1;
	const v=-1;
	const BB = create_BB(Vec3(v),Vec3(V));
	return Object.assign(Object.create(Mesh_ops),
		{positions:new Float32Array(
			[v,v,v, V,v,v, V,V,v, v,V,v,
			 v,v,V, V,v,V, V,V,V, v,V,V,

			 v,v,v, v,V,v, v,V,V, v,v,V,
			 V,v,v, V,V,v, V,V,V, V,v,V,

			 v,V,v, V,V,v, V,V,V, v,V,V,
			 v,v,v, V,v,v, V,v,V, v,v,V]),
		normals:new Float32Array(
			[0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
			 0,0,1, 0,0,1, 0,0,1, 0,0,1,
			-1,0,0, -1,0,0, -1,0,0, -1,0,0,
			1,0,0, 1,0,0, 1,0,0, 1,0,0,
			0,1,0, 0,1,0, 0,1,0, 0,1,0,
			0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
		]),
		texcoords:new Float32Array(
			[0,0, 0,1, 1,1, 1,0,
			0,0, 0,1, 1,1, 1,0,
			0,0, 0,1, 1,1, 1,0,
			0,0, 0,1, 1,1, 1,0,
			0,0, 0,1, 1,1, 1,0,
			0,0, 0,1, 1,1, 1,0]),
		vbo_p:null, vbo_n:null, vbo_t:null,
		tris: new Uint32Array([2,1,0,3,2,0, 4,5,6,4,6,7,
			10,9,8,11,10,8, 12,13,14,12,14,15,
			18,17,16,19,18,16, 20,21,22,20,22,23]),
		lines: new Uint32Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),BB});
},


Cubes(n,f)
{
	const V=1;
	const v=-1;
	const BB = create_BB(Vec3(v),Vec3(V));
	let n1 = n+1;
	let n21 = n1*n1;

	let positions = new Float32Array(3*n21*n1);
	let ip = 0;
	for( let k=0; k<=n; ++k)
	{
		for( let j=0; j<=n; ++j)
		{
			for( let i=0; i<=n; ++i)
			{
				positions[ip++] = 2*(i/n)-1;
				positions[ip++] = 2*(j/n)-1;
				positions[ip++] = 2*(k/n)-1;
			}
		}
	}

	let nbh=0;
	for( let k=0; k<n; ++k)
	{
		for( let j=0; j<n; ++j)
		{
			for( let i=0; i<n; ++i)
			{
				if (f(n,i,j,k))
				{
					nbh++;
				}
			}
		}
	}

	let tris = new Uint32Array(48*nbh);
	let vertices = new Uint32Array(16*nbh);
	let lines = new Uint32Array(36*nbh);

	let one_cube = new Uint32Array(
		[ 1,0,n1,  1,n1,n1+1,
			n21,n21+1,n21+n1, n21+1,n21+n1+1,n21+n1,
			0,1,n21+1,0,n21+1,n21,
			0,n21+n1,n1, 0,n21,n21+n1,
			1,n1+1,n21+n1+1, 1,n21+n1+1,n21+1,
			n1,n21+n1+1,n1+1, n1,n21+n1,n21+n1+1
		]);

	let c = 0;
	let d = 0;
	let it = 0;
	let iv = 0;
	let il = 0;
	for( let k=0; k<n; ++k)
	{
		for( let j=0; j<n; ++j)
		{
			for( let i=0; i<n; ++i)
			{
				if (f(n,i,j,k))
				{
					vertices[iv++] = d;
					vertices[iv++] = c;
					vertices[iv++] = d;
					vertices[iv++] = c+1;
					vertices[iv++] = d;
					vertices[iv++] = c+n1;
					vertices[iv++] = d;
					vertices[iv++] = c+n1+1;
					vertices[iv++] = d;
					vertices[iv++] = c+n21;
					vertices[iv++] = d;
					vertices[iv++] = c+n21+1;
					vertices[iv++] = d;
					vertices[iv++] = c+n21+n1;
					vertices[iv++] = d;
					vertices[iv++] = c+n21+n1+1;
					lines[il++] = d;
					lines[il++] = c;
					lines[il++] = c+1;
					lines[il++] = d;
					lines[il++] = c;
					lines[il++] = c+n1;
					lines[il++] = d;
					lines[il++] = c;
					lines[il++] = c+n21;

					lines[il++] = d;
					lines[il++] = c+n1+1;
					lines[il++] = c+1;
					lines[il++] = d;
					lines[il++] = c+n1+1;
					lines[il++] = c+n1;
					lines[il++] = d;
					lines[il++] = c+n1+1;
					lines[il++] = c+n1+1+n21;

					lines[il++] = d;
					lines[il++] = c+n21+n1;
					lines[il++] = c+n21;
					lines[il++] = d;
					lines[il++] = c+n21+n1;
					lines[il++] = c+n1;
					lines[il++] = d;
					lines[il++] = c+n21+n1;
					lines[il++] = c+n21+n1+1;

					lines[il++] = d;
					lines[il++] = c+n21+1;
					lines[il++] = c+n21;
					lines[il++] = d;
					lines[il++] = c+n21+1;
					lines[il++] = c+1;
					lines[il++] = d;
					lines[il++] = c+n21+1;
					lines[il++] = c+n21+n1+1;

					for( let f=0; f<36; f+=3)
					{
						tris[it++] = d;
						tris[it++] = one_cube[f] + c;
						tris[it++] = one_cube[f+1] + c;
						tris[it++] = one_cube[f+2] + c;
					}
				}
				c++;d++;
			}
			c++;
		}
		c+= (n1);
	}

	return Object.assign(Object.create(Mesh_ops),
		{positions, vbo_p:null, normals: null, vbo_n:null, texcoords:null, vbo_t:null,
		tris,	vertices, lines, BB});
},



Grid_tri_indices(n,m)
{
	if (m == undefined)
	{
		m = n;
	}
	this.strip = false;

	let indices = create_uint32_buffer(6*(n-1)*(m-1));
	function push_quad(k)
	{
		indices.push(k);
		indices.push(k-n-1);
		indices.push(k-n);

		indices.push(k-n-1);
		indices.push(k);
		indices.push(k-1);
	}

	for(let j=1;j<m;++j)
		for(let i=1;i<n;++i)
			push_quad(j*n+i);

	return indices;
},

Grid_tri_strip_indices(n,m)
{
	if (m == undefined)
	{
		m = n;
	}
	this.strip = true;

	let indices = create_uint32_buffer((2*n+1)*(m-1));

	for(let j=1;j<m;++j)
	{
		let jn = j*n;
		let jn1 = jn-n;
		if (j%2 === 1)
		{
			for(let i=0;i<n;++i)
			{
				indices.push(jn+i);
				indices.push(jn1+i);
			}
		}
		else
		{
			for(let i=n-1;i>=0;--i)
			{
				indices.push(jn1+i);
				indices.push(jn+i);
			}
		}
		indices.push(parseInt('4294967295'));
	}
	return indices;
},


Grid_line_indices(n,m)
{
	if (m == undefined)
	{
		m = n;
	}

	let indices = create_uint32_buffer(4*n*(m-1));

	for(let j=0;j<m;++j)
		for(let i=1;i<n;++i)
		{
			let k =j*n+i;
			indices.push(k);
			indices.push(k-1);
		}

	for(let j=1;j<m;++j)
		for(let i=0;i<n;++i)
		{
			let k =j*n+i;
			indices.push(k);
			indices.push(k-n);
		}
	return indices;
},


Grid(n=2,m)
{
	if (m == undefined)
	{
		m = n;
	}
	const n1 = n - 1;
	const m1 = m - 1;
	let BB;
	if (m>n)
	{
		BB = create_BB(Vec3(-m/n,-1,-1),Vec3(m/n,1,1));
	}
	else
	{
		BB = create_BB(Vec3(-1, -n/m, -1),Vec3(1, n/m, 1));
	}

	let pos = create_Vec_buffer(3,n*m);
	let norm = create_Vec_buffer(3,n*m);
	let tc = create_Vec_buffer(2,n*m);
	let tg = create_Vec_buffer(3,n*m);

	for(let j=0;j<m;++j)
	{
		for(let i=0;i<n;++i)
		{
			const u = (1/n1)*i;
			const v = (1/m1)*j;
			tc.push([u,v]);
			pos.push([BB.max.y*(u-0.5)*2,BB.max.x*(v-0.5)*2,0]);
			norm.push([0,0,1]);
			tg.push([1,0,0]);
		}
	}


	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tangents:tg, vbo_tg:null,
			tris: this.Grid_tri_indices(n,m), lines: this.Grid_line_indices(n,m), BB});
},


Tore(n,m,r1,r2)
{
	m = m ? m : n;
	r1 = r1 ? r1 : 0.4;
	r2 = r2 ? r2 : 0.6;
	const n1 = n - 1;
	const m1 = m - 1;
	let pos = create_Vec_buffer(3,n*m);
	let norm = create_Vec_buffer(3,n*m);
	let tc = create_Vec_buffer(2,n*m);
	let tg = create_Vec_buffer(3,n*m);

	let cpos = create_Vec_buffer(3,n);
	let cnorm = create_Vec_buffer(3,n);
	let ctg = create_Vec_buffer(4,n);

	for(let i=0;i<n;++i)
	{
		const alpha = ((1.0/n1)*i)*2*Math.PI;
//		let p = Vec3(0,Math.sin(alpha),Math.cos(alpha));
		let p = Vec3(0,Math.cos(alpha),Math.sin(alpha));
		cnorm.push(p);
		cpos.push(p.mult(r1?r1:0.4));
//		ctg.push(Vec4(0,Math.sin(alpha),-Math.cos(alpha),0));
		ctg.push(Vec4(0,-Math.sin(alpha),	Math.cos(alpha),0));
	}

	for(let j=0;j<m;++j)
	{
		let tr = Matrix.rotate((360/m1)*j,Vec3(0,0,1)).mult(Matrix.translate(0,-r2,0));
		let ntr = tr.inverse3transpose();
		const v = (1.0/m1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			pos.push(tr.transform(cpos.at(i)));
			let N = ntr.mult(cnorm.at(i));
			norm.push(N);
			let bn = tr.mult(ctg.at(i)).xyz
		//	tg.push(bn.cross(N));
			tg.push(bn);
		}
	}

	const BB = create_BB(Vec3(-r1-r2,-r1-r2,-r1),Vec3(r1+r2,r1+r2,r1));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tangents:tg, vbo_tg:null,
			tris: this.Grid_tri_indices(n,m), lines: this.Grid_line_indices(n,m), BB});

},

Cylinder(n,m,r,h)
{
	m = m ? m : n;
	r = r ? r : 0.5;
	h = h ? j : 2.0;
	const n1 = n - 1;
	const m1 = m - 1;
	let pos = create_Vec_buffer(3,n*m);
	let norm = create_Vec_buffer(3,n*m);
	let tc = create_Vec_buffer(2,n*m);
	let tg = create_Vec_buffer(3,n*m);

	let cpos = create_Vec_buffer(3,n);
	let cnorm = create_Vec_buffer(3,n);

	for(let i=0;i<n;++i)
	{
		const alpha = ((1.0/n1)*i)*2*Math.PI;
		let p = Vec3(0,Math.cos(alpha),Math.sin(alpha));
		cnorm.push(p);
		cpos.push(p.mult(r));
	}

	for(let j=0;j<m;++j)
	{
		let tr = Matrix.translate(-h/2+h/m1*j,0,0);
		let ntr = tr.inverse3transpose();
		const v = (1.0/m1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			let P = tr.transform(cpos.at(i));
			pos.push(P);
			norm.push(ntr.mult(cnorm.at(i)));
			let vt = Vec3(1,0,0).cross(P).normalized();
			tg.push(vt);
		}
	}

	const BB = create_BB(Vec3(-h,-r,-r),Vec3(h,r,r));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tangents:tg, vbo_tg:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n), BB});
},




Sphere(n)
{
	const n1 = n - 1;
	let pos = create_Vec_buffer(3,n*n);
	let norm = create_Vec_buffer(3,n*n);
	let tc = create_Vec_buffer(2,n*n);
	let tg = create_Vec_buffer(3,n*n);

	let a1 = Math.PI/n1;
	let a2 = 2*Math.PI/n1;

	for(let j=0;j<n;++j)
	{
		let angle = -Math.PI/2 + a1*j;
		let z = Math.sin(angle);
		let radius = Math.cos(angle);
		const v = (1.0/n1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			let beta = a2*i;
			let p = Vec3(radius*Math.cos(beta), radius*Math.sin(beta),z);
			pos.push(p);
			norm.push(p);
			tg.push([-Math.sin(beta),Math.cos(beta),0]);
		}
	}

	const BB = create_BB(Vec3(0),2.0);

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tangents:tg, vbo_tg:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n), BB});
},

Wave(n)
{
	const n1 = n - 1;
	let pos = create_Vec_buffer(3,n*n);
	let norm = create_Vec_buffer(3,n*n);
	let tc = create_Vec_buffer(2,n*n);
	let tg = create_Vec_buffer(3,n*n);

	for(let j=0;j<n;++j)
	{
		const v = (1.0/n1)*j;
		for(let i=0;i<n;++i)
		{
			const u = (1.0/n1)*i;
			tc.push([u,v]);
			let x = (u-0.5)*2;
			let y = (v-0.5)*2;
			let r = Math.sqrt(x*x+y*y);
			let h = 0.2*(1-r/2)*Math.sin(Math.PI/2+r*8);
			let P = Vec3(x,y,h)
			pos.push(P);

			let dh = -0.2/2*Math.sin(Math.PI/2+r*8) +
					0.2*(1-r/2)*8*Math.cos(Math.PI/2+r*8);
			let n = Vec3(-x/r*dh,-y/r*dh,1);
			norm.push(n.normalized());
			tg.push(Vec3(0,0,1).cross(P).normalized());
		}
	}

	const BB = create_BB(Vec3(-1),Vec3(1));

	return Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:tc, vbo_t:null,
			tangents:tg, vbo_tg:null,
			tris: this.Grid_tri_indices(n), lines: this.Grid_line_indices(n),BB});
},

OFF_load(text)
{
	let separator = function(c)
	{
		return c ==" "  ||  c =="\n" ||  c =="\r";
	};

	let index = 0;

	let read_word = function()
	{
		while (separator(text[index])) { index++;}
		let k = index;
		while (!separator(text[index])) { index++;}
		return text.substr(k, index-k);
	};

	let w =read_word();
	w =read_word();
	const nbv = parseInt(w);
	w =read_word();
	const nbf = parseInt(w);
	read_word();

	let pos = create_Vec_buffer(3,nbv);
	let norm = create_Vec_buffer(3,nbv);

	for(let i=0;i<nbv;++i)
	{
		const p = Vec3(parseFloat(read_word()),parseFloat(read_word()),parseFloat(read_word()));
		pos.push(p);
	}

	const faces_index = index;
	let nbfi = 0;
	let nbl = 0;
	for(let i=0;i<nbf;++i)
	{
		const nbe = parseInt(read_word());
		nbl += nbe;
		nbfi += 3*(nbe-2);
		for(let j=0; j<nbe; j++)
		{
			parseInt(read_word());
		}
	}

	let indices = create_uint32_buffer(nbfi);
	let indicesl = create_uint32_buffer(nbl);

	index = faces_index;
	for(let i=0;i<nbf;++i)
	{
		let nbe = parseInt(read_word());
		let loc_buff = [];
		for(let j=0; j<nbe; j++)
		{
			loc_buff.push(parseInt(read_word()));
		}

		for(let j=0; j<nbe; j++)
		{
			let a = loc_buff[j];
			let b = loc_buff[(j+1)%nbe];
			if (a<b)
			{
				indicesl.push(a);
				indicesl.push(b);
			}
		}

		nbe -= 2;
		for(let j=0; j<nbe; j++)
		{
			indices.push(loc_buff[0]);
			indices.push(loc_buff[j+1]);
			indices.push(loc_buff[j+2]);
		}
	}

	let m = Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:null, vbo_t:null,
			tris: indices, lines: indicesl});

	m.compute_normals();
	m.BB = m.compute_BB();
	return m;
},


OBJ_load_simple(text)
{
	let separator = function(c)
	{
		return c ==" "  ||  c =="\n" ||  c =="\r";
	};

	let endline = function(c)
	{
		return c =="\n" ||  c =="\r";
	};

	let read_word = function()
	{
		while (index < text.length && separator(text[index])) { index++;}
		let k = index;
		while (index < text.length && !separator(text[index])) { index++;}
		return text.substr(k, index-k);
	};

	let read_end_of_line = function()
	{
		let words = [];
		while (!endline(text[index]))
		{
			while (text[index]===' ') { index++;}
			let k = index;
			while (!separator(text[index])) { index++;}
			if (k !== index)
			{
				words.push(text.substr(k, index-k));
			}
		}
		return words;
	};


	let nbv = 0;
	let nbfi = 0;
	let nbl = 0;
	let buff_pos = [];
	let buff_norm = [];
	let buff_tc = [];
	let buff_indices = [];
	let buff_indicesl = [];

	let index = 0;
	let w = read_word();
	let wl = [];
	while (index < text.length)
	{
		switch(w)
		{
		case '#':
			read_end_of_line();
			break;
		case 'v':
			wl = read_end_of_line();
			const p = Vec3(parseFloat(wl[0]),parseFloat(wl[1]),parseFloat(wl[2]));
			buff_pos.push(p);
			nbv++;
		break;
		case 'vn':
			wl = read_end_of_line();
			const n = Vec3(parseFloat(wl[0]),parseFloat(wl[1]),parseFloat(wl[2]));
			buff_norm.push(n);
		break;
		case 'vt':
			wl = read_end_of_line();
			const t = Vec2(parseFloat(wl[0]),parseFloat(wl[1]));
			buff_tc.push(t);
		break;
		case 'f':
			wl = read_end_of_line();
			let nbe = wl.length;
			nbl += nbe;
			nbfi += 3*(nbe-2);

			for(let j=0; j<nbe; j++)
			{
				let a = parseInt(wl[j])-1;
				let b = parseInt(wl[(j+1)%nbe])-1;
				if (a<b)
				{
					buff_indicesl.push(a);
					buff_indicesl.push(b);
				}
			}
			nbe -= 2;
			for(let j=0; j<nbe; j++)
			{
				buff_indices.push(parseInt(wl[0])-1);
				buff_indices.push(parseInt(wl[j+1])-1);
				buff_indices.push(parseInt(wl[j+2])-1);
			}
		break;
		}
		w = read_word();
	}

	let pos = create_Vec_buffer(3,nbv);
	let norm = create_Vec_buffer(3,nbv);

	let indices = create_uint32_buffer(nbfi);
	let indicesl = create_uint32_buffer(nbl);

	buff_pos.forEach(v => { pos.push(v);});
	buff_norm.forEach(n => { norm.push(n);});
	buff_indices.forEach(i => { indices.push(i); });
	buff_indicesl.forEach(i => { indicesl.push(i); });

	let m = Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: norm, vbo_n:null,
			texcoords:null, vbo_t:null,
			tris: indices, lines: indicesl});

	if (buff_norm.length <  buff_pos.length)
	{
		m.compute_normals()
	}

	m.BB = m.compute_BB();
	return m;
},



// OBJ_load:function(text,path,text_mtl)
// {
// 	let buff_pos = [];
// 	let buff_tc = [];
// 	let buff_norm = [];

// 	let indirect_buff_pos = [];
// 	let indirect_buff_tc = [];
// 	let indirect_buff_norm = [];

// 	let triplet_indices = null;
// 	let next_new_index = 0;
// 	let tri_indices = [];

// 	let materials = null;
// 	let current_material = null;

// 	let index = 0;
// 	let wl = [];

// 	let current_object_name = '';
// 	let meshes = [];

// 	let separator = function(c)
// 	{
// 		return c ==" "  ||  c =="\n" ||  c =="\r";
// 	};

// 	let endline = function(c)
// 	{
// 		return c =="\n" ||  c =="\r";
// 	};

// 	let read_word = function()
// 	{
// 		while (index < text.length && separator(text[index])) { index++;}
// 		let k = index;
// 		while (index < text.length && !separator(text[index])) { index++;}
// 		return text.substr(k, index-k);
// 	};

// 	let read_end_of_line = function()
// 	{
// 		let words = [];
// 		while (!endline(text[index]))
// 		{
// 			while (text[index]===' ') { index++;}
// 			let k = index;
// 			while (!separator(text[index])) { index++;}
// 			if (k !== index)
// 			{
// 				words.push(text.substr(k, index-k));
// 			}
// 		}
// 		return words;
// 	};

// 	let begin_mesh = function()
// 	{
// 		triplet_indices = new Map();
// 		next_new_index = 0;
// 		tri_indices = [];
// 		indirect_buff_pos = [];
// 		indirect_buff_tc = [];
// 		indirect_buff_norm = [];
// 	};

// 	let finish_mesh=function()
// 	{
// 		let positions=null;
// 		if (indirect_buff_pos.length>0)
// 		{
// 			let nb = indirect_buff_pos.length;
// 			positions = new Float32Array(3*nb);
// 			let k = 0;
// 			for (let i =0; i<nb ; ++i)
// 			{
// 				let j = 3*indirect_buff_pos[i];
// 				positions[k++] = buff_pos[j++];
// 				positions[k++] = buff_pos[j++];
// 				positions[k++] = buff_pos[j];
// 			}
// 		}
// 		let normals = null;
// 		if (indirect_buff_norm.length>0)
// 		{
// 			let nb = indirect_buff_norm.length;
// 			normals = new Float32Array(3*nb);
// 			let k = 0;
// 			for (let i =0; i<nb ; ++i)
// 			{
// 				let j = 3*indirect_buff_norm[i];
// 				normals[k++] = buff_norm[j++];
// 				normals[k++] = buff_norm[j++];
// 				normals[k++] = buff_norm[j];
// 			}
// 		}

// 		let texcoords = null;
// 		if (indirect_buff_tc.length>0)
// 		{
// 			let nb = indirect_buff_tc.length;
// 			texcoords = new Float32Array(nb*2);
// 			let k = 0;
// 			for (let i =0; i<nb ; ++i)
// 			{
// 				let j = 2*indirect_buff_tc[i];
// 				texcoords[k++] = buff_tc[j++];
// 				texcoords[k++] = buff_tc[j];
// 			}
// 		}

// 		let mesh = Object.assign(Object.create(Mesh_ops), {positions, vbo_p:null,
// 			normals, vbo_n:null,
// 			texcoords, vbo_t:null,
// 			tangents:null, vbo_tg:null,
// 			tris: new Uint32Array(tri_indices), lines: null, BB:null, material:current_material, name:current_object_name});

// 		if (buff_norm.length ==0)
// 		{
// 			mesh.compute_normals();
// 		}
// 		mesh.BB = mesh.compute_BB();
// 		meshes.push(mesh);
// 		console.log("Adding "+current_object_name+ " mesh");
// 		if (current_material)
// 		{
// 			console.log("Using material"+current_material.name);
// 		}
// 	}


// 	let read_v_data = function ()
// 	{
// 		let w = read_word();
// 		while (index < text.length)
// 		{
// 			switch(w)
// 			{
// 			case 'v':
// 				wl = read_end_of_line();
// 				buff_pos.push(parseFloat(wl[0]));
// 				buff_pos.push(parseFloat(wl[1]));
// 				buff_pos.push(parseFloat(wl[2]));
// 			break;
// 			case 'vn':
// 				wl = read_end_of_line();
// 				buff_norm.push(parseFloat(wl[0]));
// 				buff_norm.push(parseFloat(wl[1]));
// 				buff_norm.push(parseFloat(wl[2]));
// 			break;
// 			case 'vt':
// 				wl = read_end_of_line();
// 				buff_tc.push(parseFloat(wl[0]));
// 				buff_tc.push(parseFloat(wl[1]));
// 			break;
// 			default:
// 				read_end_of_line();
// 			break;
// 			}
// 			w = read_word();
// 		}
// 	};


// 	let read_f_data = function ()
// 	{
// 		index=0;
// 		let w = read_word();
// 		let mode = 0;
// 		let nb_pos = buff_pos.length/3;
// 		let nb_norm = buff_norm.length/3;
// 		let nb_tc = buff_tc.length/2;

// 		begin_mesh();
// 		while (index < text.length)
// 		{
// 			switch(w)
// 			{
// 			case '#':
// 				read_end_of_line();
// 				break;
// 			case 'usemtl':
// 				wl = read_end_of_line();
// 				current_material = materials.get(wl[0]);
// 				break;
// 			case 'o':
// 					wl = read_end_of_line();
// 					current_object_name = wl[0];
// 				break;
// 			case 'g':
// 				wl = read_end_of_line();
// 				current_object_name = wl[0];
// 			break;
// 			case 'f':
// 				if (mode !== 1)
// 				{
// 					mode = 1;
// 				}
// 				wl = read_end_of_line();
// 				let nbe = wl.length;

// 				let face_indices=[];

// 				for(let j=0; j<nbe; j++)
// 				{
// 					let ind = triplet_indices.get(wl[j]);
// 					if (ind === undefined)
// 					{
// 						let vert = wl[j].split('/');
// 						if (vert[0])
// 						{
// 							let k = parseInt(vert[0]);
// 							let kf = (k>0)? k-1 : nb_pos+k;
// 							indirect_buff_pos.push(kf);
// 						}
// 						if (vert[1] !== undefined )
// 						{
// 							let k = parseInt(vert[1]);
// 							let kf = (k>0)? k-1 : nb_tc+k;
// 							indirect_buff_tc.push(kf);
// 						}
// 						if (vert[2] !== undefined )
// 						{
// 							let k = parseInt(vert[2]);
// 							let kf = (k>0)? k-1 : nb_norm+k;
// 							indirect_buff_norm.push(kf);
// 						}
// 						ind = next_new_index++;
// 						triplet_indices.set(wl[j],ind);
// 					}
// 					face_indices.push(ind);
// 				}
// 				nbe -= 2;
// 				for(let j=0; j<nbe; j++)
// 				{
// 					tri_indices.push(face_indices[0]);
// 					tri_indices.push(face_indices[j+1]);
// 					tri_indices.push(face_indices[j+2]);
// 				}
// 				break;
// 				default:
// 					if (mode !== 0)
// 					{
// 						finish_mesh();
// 						mode=0;
// 						begin_mesh();
// 					}
// 					read_end_of_line();
// 				break;
// 			}
// 			w = read_word();
// 		}
// 		if (mode != 0)
// 		{
// 			finish_mesh();
// 		}
// 	};


// 	let mtllib_pos = text.indexOf('mtllib');
// 	if (mtllib_pos !== -1)
// 	{
// 		index = mtllib_pos + 7;
// 		let filename = read_word(); // warning need perhaps to add path
// 		return new Promise( (resolve,reject) =>
// 		{
// 			fetch(path+filename).then( r =>
// 			{
// 				r.blob().then( blob =>
// 				{
// 					let reader = new FileReader();
// 					reader.onload = () =>
// 					{
// 						materials = this.MTL_load(reader.result,path);
// 						read_v_data();
// 						read_f_data();
// 						resolve(meshes);
// 					}
// 					reader.readAsText(blob);
// 				});
// 			},
// 			()=>{ewgl_common.console.error('can not load '+filename);reject();}
// 			);
// 		});
// 	}
// 	else
// 	{
// 		return new Promise( resolve =>
// 		{
// 			read_v_data();
// 			read_f_data();
// 			resolve(meshes);
// 		});
// 	}
// },
OBJ_load:function(text,path)
{
	let buff_pos = [];
	let buff_tc = [];
	let buff_norm = [];

	let begin_buff_pos = 0;
	let begin_buff_tc = 0;
	let begin_buff_norm = 0;


	let indirect_buff_pos = [];
	let indirect_buff_tc = [];
	let indirect_buff_norm = [];

	let triplet_indices = null;
	let next_new_index = 0;
	let tri_indices = [];

	let materials = null;
	let current_material = null;

	let index = 0;
	let wl = [];

	let current_object_name = '';
	let meshes = [];

	let separator = function(c)
	{
		return c ==" "  ||  c =="\n" ||  c =="\r";
	};

	let endline = function(c)
	{
		return c =="\n" ||  c =="\r";
	};

	let read_word = function()
	{
		while (index < text.length && separator(text[index])) { index++;}
		let k = index;
		while (index < text.length && !separator(text[index])) { index++;}
		return text.substr(k, index-k);
	};

	let read_end_of_line = function()
	{
		let words = [];
		while (!endline(text[index]))
		{
			while (text[index]===' ') { index++;}
			let k = index;
			while (!separator(text[index])) { index++;}
			if (k !== index)
			{
				words.push(text.substr(k, index-k));
			}
		}
		return words;
	};

	let begin_mesh = function()
	{
		// begin_buff_pos += buff_pos.length;
		// begin_buff_norm += buff_norm.length;
		// begin_buff_tc += buff_tc.length;
		// buff_pos =[];
		// buff_norm = [];
		// buff_tc =[];

		triplet_indices = new Map();
		next_new_index = 0;
		tri_indices = [];
		indirect_buff_pos = [];
		indirect_buff_tc = [];
		indirect_buff_norm = [];
	};

	let finish_mesh=function()
	{
		let positions=null;
		if (indirect_buff_pos.length>0)
		{
			let nb = indirect_buff_pos.length;
			positions = new Float32Array(3*nb);
			let k = 0;
			for (let i =0; i<nb ; ++i)
			{
				let j = (indirect_buff_pos[i]>0) ? 3*indirect_buff_pos[i] - begin_buff_pos : -3*indirect_buff_pos[i];
				positions[k++] = buff_pos[j++];
				positions[k++] = buff_pos[j++];
				positions[k++] = buff_pos[j];
			}
		}
		let normals = null;
		if (indirect_buff_norm.length>0)
		{
			let nb = indirect_buff_norm.length;
			normals = new Float32Array(3*nb);
			let k = 0;
			for (let i =0; i<nb ; ++i)
			{
				let j = (indirect_buff_norm[i]>0) ? 3*indirect_buff_norm[i] : -3*indirect_buff_norm[i];
				normals[k++] = buff_norm[j++];
				normals[k++] = buff_norm[j++];
				normals[k++] = buff_norm[j];
			}
		}

		let texcoords = null;
		if (indirect_buff_tc.length>0)
		{
			let nb = indirect_buff_tc.length;
			texcoords = new Float32Array(nb*2);
			let k = 0;
			for (let i =0; i<nb ; ++i)
			{
				let j = (indirect_buff_tc[i]>0) ? 2*indirect_buff_tc[i] : -2*indirect_buff_tc[i];
				texcoords[k++] = buff_tc[j++];
				texcoords[k++] = buff_tc[j];
			}
		}

		let mesh = Object.assign(Object.create(Mesh_ops), {positions, vbo_p:null,
			normals, vbo_n:null,
			texcoords, vbo_t:null,
			tangents:null, vbo_tg:null,
			tris: new Uint32Array(tri_indices), lines: null, BB:null, material:current_material, name:current_object_name});

		if (buff_norm.length ==0)
		{
			mesh.compute_normals();
		}
		mesh.BB = mesh.compute_BB();
		meshes.push(mesh);
		console.log("Adding "+current_object_name+ " mesh");
		if (current_material)
		{
			console.log("Using material"+current_material.name);
		}
	}

	let read_data = function ()
	{
		let w = read_word();
		let mode = 0;
		begin_mesh();
		while (index < text.length)
		{
			switch(w)
			{
			case '#':
				read_end_of_line();
				break;
			case 'v':
				if (mode !== 0)
				{
					finish_mesh();
					mode=0;
					begin_mesh();
				}
				wl = read_end_of_line();
				buff_pos.push(parseFloat(wl[0]));
				buff_pos.push(parseFloat(wl[1]));
				buff_pos.push(parseFloat(wl[2]));
			break;
			case 'vn':
				if (mode !== 0)
				{
					finish_mesh();
					mode = 0;
					begin_mesh();
				}
				wl = read_end_of_line();
				buff_norm.push(parseFloat(wl[0]));
				buff_norm.push(parseFloat(wl[1]));
				buff_norm.push(parseFloat(wl[2]));
			break;
			case 'vt':
				if (mode !== 0)
				{
					finish_mesh();
					mode = 0;
					begin_mesh();
				}
				wl = read_end_of_line();
				buff_tc.push(parseFloat(wl[0]));
				buff_tc.push(parseFloat(wl[1]));
			break;
			case 'usemtl':
				{wl = read_end_of_line();
				let mat = materials.get(wl[0]);
				if (mat === undefined)
				{
					console.log("Material "+wl[0]+ " not in .mtl");
					current_material = null;
				}
				else
				{
					current_material = mat;
				}}
			break;
			case 'o':
				if (mode !== 0)
				{
					finish_mesh();
					mode = 0;
					begin_mesh();
				}					wl = read_end_of_line();
				current_object_name = wl[0];
				break;
			case 'g':
				if (mode !== 0)
				{
					finish_mesh();
					mode = 0;
					begin_mesh();
				}
				wl = read_end_of_line();
				current_object_name = wl[0];
			break;
			case 'f':
				if (mode !== 1)
				{
					mode = 1;
				}
				wl = read_end_of_line();
				let nbe = wl.length;

				let face_indices=[];

				for(let j=0; j<nbe; j++)
				{
					let ind = triplet_indices.get(wl[j]);
					if (ind === undefined)
					{
						let nb_pos = buff_pos.length/3;
						let nb_norm = buff_norm.length/3;
						let nb_tc = buff_tc.length/2;

						let vert = wl[j].split('/');
						if (vert[0])
						{
							let k = parseInt(vert[0]);
							let kf = (k>0) ? k-1 : -nb_pos-k;
							indirect_buff_pos.push(kf);
						}
						if (vert[1] !== undefined )
						{
							let k = parseInt(vert[1]);
							let kf = (k>0) ? k-1 : -nb_tc-k;
							indirect_buff_tc.push(kf);
						}
						if (vert[2] !== undefined )
						{
							let k = parseInt(vert[2]);
							let kf = (k>0) ? k-1 : -nb_norm-k;
							indirect_buff_norm.push(kf);
						}
						ind = next_new_index++;
						triplet_indices.set(wl[j],ind);
					}
					face_indices.push(ind);
				}
				nbe -= 2;
				for(let j=0; j<nbe; j++)
				{
					tri_indices.push(face_indices[0]);
					tri_indices.push(face_indices[j+1]);
					tri_indices.push(face_indices[j+2]);
				}
				break;
			}
			w = read_word();
		}

		finish_mesh();
	};

	let mtllib_pos = text.indexOf('mtllib');
	if (mtllib_pos !== -1)
	{
		index = mtllib_pos + 7;
		let filename = read_word(); // warning need perhaps to add path
		return new Promise( (resolve,reject) =>
		{
			fetch(path+filename).then( r =>
			{
				r.blob().then( blob =>
				{
					let reader = new FileReader();
					reader.onload = () =>
					{
						materials = this.MTL_load(reader.result,path);
						read_data();
						resolve(meshes);
					}
					reader.readAsText(blob);
				});
			},
			()=>{ewgl_common.console.error('can not load '+filename);reject();}
			);
		});
	}
	else
	{
		return new Promise( resolve =>
		{
			read_data();
			resolve(meshes);
		});
	}
},


MTL_load(text,path)
{
	let index = 0;

	let materials = new Map();
	let mat = null;
	let goodtext = text.replace("\r","\n");
	const lines = goodtext.split("\n");

	for(let il = 0; il < lines.length; ++il)
	{
		while(il<lines.length && lines[il]==="") {il++;}
		if (il>= lines.length) {break;}

		let words = lines[il].split("\t").join(" ").split(" ");
		let i_cr = words.indexOf("");
		while(i_cr >= 0)
		{
			words.splice(i_cr,1);
			i_cr = words.indexOf("");
		}
		let iw  = 0;
		let w = null;
		if (words.length>=0)
		{
			w = words[iw++];
			while (iw < words.length && w.length === 0)
			{
				w = words[iw++];
			}
		}
		if (w==null || w[0]==="#")
		{
			// nothing ?
		}
		else if ((words[iw] != undefined) && (words[iw].length>0))
		{
			switch(w)
			{
			case 'newmtl':
				if (mat != null)
				{
					materials.set(mat.name,mat);
				}
				mat = undefined;
				mat = {opacity:1, diff_tex:null, amb_tex:null};
				mat.name = words[1];
				break;
			case 'illum':
				// 2 phong
				//4,6 transparent
				break;
			case 'Ka':
				mat.amb_col = [parseFloat(words[iw]),parseFloat(words[iw+1]),parseFloat(words[iw+2])];
				break;
			case 'Kd':
				mat.dif_col = [parseFloat(words[iw]),parseFloat(words[iw+1]),parseFloat(words[iw+2])];
				break;
			case 'Ks':
				mat.spec_col = [parseFloat(words[iw]),parseFloat(words[iw+1]),parseFloat(words[iw+2])];
				break;
			case 'Ke':
				mat.emissive = [parseFloat(words[iw]),parseFloat(words[iw+1]),parseFloat(words[iw+2])];
				break;

			case 'Ns':
				mat.spec_exp = parseFloat(words[iw]);
				break;
			case 'map_Ka':
				mat.amb_coef=1.10
				if (words[iw]==="-bm")
				{
					mat.amb_coef = parseFloat(words[iw+1]);
					iw+=2
				}
				mat.amb_tex = Texture2d();
				mat.amb_tex.simple_params(gl.REPEAT,gl.LINEAR_MIPMAP_LINEAR);
				mat.amb_tex.load(path+words[iw]);
				break;
			case 'map_Kd':
				mat.diff_coef = 1.0;
				if (words[iw]==="-bm")
				{
					mat.diff_coef = parseFloat(words[iw+1]);
					iw +=2;
				}
				mat.diff_tex = Texture2d();
				mat.diff_tex.simple_params(gl.REPEAT,gl.LINEAR_MIPMAP_LINEAR);
				mat.diff_tex.load(path+words[iw]);
				break;
			case 'd':
				if (words[iw]== "-dhalo")
				{
					mat.halo_opacity = parseFloat(words[iw+1]);
				}
				else
				{
					mat.opacity = parseFloat(words[iw]);
				}
				break;
			case 'Tr':
				mat.opacity = 1.0 - parseFloat(words[iw]);
				break;
		// not yet supported
			case 'map_Ke':
				break;
			case 'map_bump':
			case 'bump':
				break;
			default:
				break;
			}
		}
	}

	if (mat)
	{
		materials.set(mat.name,mat);
	}
	mat = undefined;

	return materials;
},



TET_load(text)
{
	let index = 0;

	let separator = function(c)
	{
		return c ==" "  ||  c =="\n" ||  c =="\r";
	};

	let endline = function(c)
	{
		return c =="\n" ||  c =="\r";
	};

	let read_word = function()
	{
		while (index < text.length && separator(text[index])) { index++;}
		let k = index;
		while (index < text.length && !separator(text[index])) { index++;}
		return text.substr(k, index-k);
	};

	let read_end_of_line = function()
	{
		let words = [];
		while (index < text.length && !endline(text[index]))
		{
			while (text[index]===' ') { index++;}
			let k = index;
			while (!separator(text[index])) { index++;}
			if (k !== index)
			{
				words.push(text.substr(k, index-k));
			}
		}

		if (index < text.length)
		{
			index++; // jump over \n
		}
		return words;
	};

	let read_next_line = function()
	{
		let ws = read_end_of_line();
		while (index < text.length && (ws.length==0 || ws[0][0]=='#'))
		{
			ws = read_end_of_line()
		}
		return ws;
	};

	let check_comment = function(w)
	{
		if (w[0]=='#')
		{
			read_end_of_line();
			return true;
		}
		return false;
	};

	let ws = null;

	ws = read_next_line();
	const nbv = parseInt(ws[0]);
	ws = read_next_line();
	const nbtet = parseInt(ws[0]);

	let pos = create_Vec_buffer(3,nbv);

	for(let i=0;i<nbv;++i)
	{
		let ws = read_next_line();
		const p = Vec3(parseFloat(ws[0]),parseFloat(ws[1]),parseFloat(ws[2]));
		pos.push(p);
	}

	let tris = create_uint32_buffer(nbtet*16);
	let lines = create_uint32_buffer(nbtet*18);
	let vertices = create_uint32_buffer(nbtet*8);

	for(let t=0; t<nbtet; ++t)
	{
		let ws = read_next_line();
		if (index >= text.length)
		{
			console.log("PB TET");
		}
		while (ws[0][0]!='4')
		{
			ws = read_next_line()
		}
		let iA = parseInt(ws[1]);
		let iB = parseInt(ws[2]);
		let iC = parseInt(ws[3]);
		let iD = parseInt(ws[4]);

		tris.push(t);
		tris.push(iA);
		tris.push(iC);
		tris.push(iB);
		tris.push(t);

		tris.push(iB);
		tris.push(iD);
		tris.push(iA);
		tris.push(t);
		tris.push(iD);
		tris.push(iB);
		tris.push(iC);


		tris.push(t);

		tris.push(iC);
		tris.push(iA);
		tris.push(iD);



		lines.push(t);
		lines.push(iA);
		lines.push(iB);
		lines.push(t);
		lines.push(iB);
		lines.push(iC);
		lines.push(t);
		lines.push(iC);
		lines.push(iA);
		lines.push(t);
		lines.push(iD);
		lines.push(iA);
		lines.push(t);
		lines.push(iD);
		lines.push(iB);
		lines.push(t);
		lines.push(iD);
		lines.push(iC);

		vertices.push(t);
		vertices.push(iA);
		vertices.push(t);
		vertices.push(iB);
		vertices.push(t);
		vertices.push(iC);
		vertices.push(t);
		vertices.push(iD);
	}

	let m = Object.assign(Object.create(Mesh_ops), {positions:pos, vbo_p:null,
			normals: null, vbo_n:null,
			texcoords:null, vbo_t:null,
			tris, lines, vertices});

	m.BB = m.compute_BB();
	return m;
},


load(blob)
{
	this.file_name = blob.name;
	let reader = new FileReader();
	return new Promise( (resolve, reject) =>
	{
		reader.onerror = () =>
		{
			reader.abort();
			ewgl_common.console.error('can not load '+blob.name);
			reject();
		};
		reader.onload = () =>
		{
			if (blob.name.match(/off|OFF$/))
			{
				resolve(this.OFF_load(reader.result));
			}
			else if (blob.name.match(/obj|OBJ$/))
			{
				resolve(this.OBJ_load_simple(reader.result));
			}
			else if (blob.name.match(/tet|TET$/))
			{
				resolve(this.TET_load(reader.result));
			}
			else if (blob.name.match(/mtl|MTL$/))
			{
				resolve(this.MTL_load(reader.result));
			}
			else
			{
				ewgl_common.console.error('can not load '+blob.name);
				reject();
			}
		};
		reader.readAsText(blob);
	});
},

loadFile(name)
{
	let loader =
				(name.match(/off|OFF$/)) ? this.OFF_load :
				(name.match(/obj|OBJ$/))? this.OBJ_load_simple :
				(name.match(/tet|TET$/))? this.TET_load :
				() => {ewgl_common.console.error('can load only off & obj');};

	return new Promise( (resolve, reject) =>
	{
		fetch(name).then(res =>
		{
			res.blob().then( blob =>
			{
				let reader = new FileReader();
				reader.onload = () => {resolve(loader(reader.result));}
				reader.readAsText(blob);
			})
		},()=>{ewgl_common.console.error('can not load '+name);reject();})
	});
},

loadObj(blob)
{
	let name = blob.name;
	let reader = new FileReader();
	let slash = Math.max(name.lastIndexOf('/'),name.lastIndexOf('\\'));
	let path = (slash==-1)?"":name.substring(0,slash+1);
	return new Promise( (resolve, reject) =>
	{
		reader.onload = () => {resolve(this.OBJ_load(reader.result,path));}
		reader.readAsText(blob);
	});
},


loadObjFile(name)
{
	let reader = new FileReader();
	let slash = Math.max(name.lastIndexOf('/'),name.lastIndexOf('\\'));
	let path = (slash==-1)?"":name.substring(0,slash+1);
	return new Promise( (resolve, reject) =>
	{
		fetch(name).then(res =>
		{
			res.blob().then( blob =>
			{
				reader.onload = () => {resolve(this.OBJ_load(reader.result,path));}
				reader.readAsText(blob);
			})
		},()=>{ewgl_common.console.error('can not load '+name);reject();})
	});
}

};// end Mesh


function ewgl_load_script(s)
{
	ewgl_common.load_script(s);
}
