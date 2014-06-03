var JEM = {};

JEM.zip = function() {
	var arrays = arguments;
	return Array.map(arrays[0], function(_,idx) {
		return Array.map(arrays, function(a) { return a[idx]; });
	});
}

JEM.pixelStrToInt = function(str) {
	return parseInt(str.substr(str.length - 2));
}

JEM.intToPixelStr = function(i) {
	return i + 'px';
}

JEM.nodeToCircle = function(node) {
	var r = JEM.intToPixelStr(node.r);
	return {cx:node.x, cy:node.y, r:r, fill:node.color};
}

JEM.circleToNode = function(circle) {
	var r = JEM.pixelStrToInt(circle.r);
	return {x:circle.cx, y:circle.cy, r:r, color:circle.fill};
}

JEM.createView = function(selection,model,renderer) {
	return { 
		model: model,
		selection: selection,
		render: renderer,
		edit: function(i,obj) {
			if (i >= 0 && i < this.model.length) {
				model.splice(i,1);
				//model.push(obj);
			} else {
				throw 'the index is not between 0 and the size of the array';
			}
		},
		update: function() {
			var model = this.model;
			this.selection = this.selection.data(
				model,
				function(item) {
					return JSON.stringify(item);
				}
			);
			this.render(this.selection);
			this.selection.exit().remove();
		}	
	};
}
/*
 * scale a value by its maximum magnitude
 * thereby reducing a domain of values to
 * the range -1 to 1
 */
JEM.scaleToUnit = function(value,max) {
	// two boundary conditions where the 
	// absolute value is greater than max 
	if (value > max) { return 1; }
	if (-1*value > max) { return -1; };

	return value / max;
}

/*
 * return the absolute degree from an
 * unprocessed degree thereby reducing
 * its range to [0,360)
 */
JEM.absDegree = function(degree) {
	degree = degree % 360;
	if (degree >= 0) {
		return degree;
	} else {
		return 360 + degree;
	}
}

/*
 * find the difference between 2 degrees
 * the value is a magnitude of difference
 * the max difference between any 2
 * degrees should be 180
 */
JEM.degreeDifference = function(d1,d2) {
	d1 = JEM.absDegree(d1);
	d2 = JEM.absDegree(d2);
	var diff = Math.abs(d1 - d2);
	// if on the other end of the circle
	// take the conjugate angle 
	// (smaller angle)
	if (diff > 180) { 
		return 360 - diff;
	} else {
		return diff;
	}
}
/*
 * find the degree from
 * an x and y value the
 * range is [0, 360);
 */
JEM.findDegree = function(x,y) {
	var degree = Math.atan(y/x) * 180 / Math.PI;
	if (x < 0) {
		degree += 180;
	} else if (y < 0) {
		degree += 360;
	}
	return Math.round(degree);
}

JEM.scaledDegDiff = function(actual,expected,spread) {
	var zero_cutoff = spread / 2;
	var scaled_cutoff = spread / 4;
	var diff = JEM.degreeDifference(actual,expected);
	if (diff > zero_cutoff) {
		return 0;
	} else if (diff > scaled_cutoff){
		diff = diff - scaled_cutoff;
		return 255 - Math.round(diff * 255 / scaled_cutoff);
	} else {
		return 255;
	}
}

JEM.cssString = function(obj) {
	var val = ''
	for (var prop in obj) {
		val += prop + ':' +  obj[prop] + ';';
	}
	return val;
}


JEM.getRedValue = function(deg,radius) {
	return JEM.scaledDegDiff(deg,0,240);
}

JEM.getGreenValue = function(deg,radius) {
	return JEM.scaledDegDiff(deg,120,240);
}

JEM.getBlueValue = function(deg,radius) {
	return JEM.scaledDegDiff(deg,240,240);
}

JEM.getOffset = function(elem) {
    var _x = 0;
    var _y = 0;
    var _w = el.offsetWidth|0;
    var _h = el.offsetHeight|0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x, width: _w, height: _h };
}

JEM.renderConnectingLine = function(div1,div2,color,thickness) {
    var off1 = JEM.getOffset(div1);
    var off2 = JEM.getOffset(div2);
    // bottom right
    var x1 = off1.left + off1.width;
    var y1 = off1.top + off1.height;
    // top right
    var x2 = off2.left + off2.width;
    var y2 = off2.top;
    // distance
    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    // center
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (thickness / 2);
    // angle
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
    // make hr
    var htmlLine = "<div style='padding:0px; margin:0px; height:" + thickness + "px; background-color:" + color + "; line-height:1px; position:absolute; left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);' />";
    //
    document.body.innerHTML += htmlLine; 
}

JEM.magnitude = function() {
	var nums = arguments;
	var squares = Array.map(nums, function(num) { return Math.pow(num,2); });
	return Math.sqrt(Array.reduce(squares,function(a,b) { return a+b; }));
}

JEM.colorTransform = function(x,y,mx,my) {
	var x_length = (mx / 2);
	var y_length = (my / 2);
	var max_length = Math.min(x_length,y_length);
	var limit_x = Math.min(max_length,x - x_length);
	var limit_y = Math.min(max_length,y_length - y);
	var x = JEM.scaleToUnit(limit_x,x_length);
	var y = JEM.scaleToUnit(limit_y,x_length);
	var radius = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
	var deg = JEM.findDegree(x,y);
	var red = JEM.getRedValue(deg,radius);
	var green = JEM.getGreenValue(deg,radius); 
	var blue = JEM.getBlueValue(deg,radius);
	var alpha = radius;
	var value = "rgba("+red+","+green+","+blue+","+alpha+")";
	return value;
}