"use strict";
var fps = 30;
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
noise.seed(1000);
var x = 0;
var y = 0;
var area = new Area('#000000', '#c04000', '#e08000');

var tick = 0;
var sec = 0;
var min = 0;
var hour = 0;
var day = 0;

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var Key = {
  _pressed: {},

  LEFT: 65,
  RIGHT: 68,
  
  isDown: function(keyCode) {
    return this._pressed[keyCode];
  },
  
  onKeydown: function(event) {
    this._pressed[event.keyCode] = true;
  },
  
  onKeyup: function(event) {
    delete this._pressed[event.keyCode];
  }
};

setInterval(function () 
{
    update();
    draw();
}, 1000 / fps);

function update() 
{
	time();
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
	if (Key.isDown(Key.LEFT)) x-=50;
	if (Key.isDown(Key.RIGHT)) x+=50;
	y = -Math.round(terrainGen(x + canvas.width / 2, 1)) + Math.round(canvas.height * 0.8);
	area.update(x, y);
}

function draw() 
{
    area.draw();
}

function time()
{
	tick++;
	
	if (tick >= fps)
	{
		sec++;
		tick = 0;
	}
	
	if (sec >= 60)
	{
		min++;
		sec = 0;
	}
	
	if (min >= 60)
	{
		hour++;
		min = 0;
	}
	
	if (hour >= 24)
	{
		day++;
		hour = 0;
	}
	
	if (day > 30)
	{
		day = 0;
	}
}

function Area(_foreColor, _groundColor, _backColor) 
{
	this.foreColor = _foreColor;
	this.groundColor = _groundColor
	this.backColor = _backColor;
	this.x = 0;
	this.y = 0;
	var numLayers = 10;
	
	var water = [];
    var terrain = [];
	
	for (var i = 0; i < numLayers; i++)
	{
		water.push(new WaterLayer(numLayers - i, numLayers));
		terrain.push(new TerrainLayer(numLayers - i));
	}
	
	this.update = function(_x, _y)
	{
		this.x = _x;
		this.y = _y;
		
		for (var i = 0; i < terrain.length; i++)
		{
			water[i].update(this.y);
			terrain[i].update(this.x, this.y);
		}
	}
	
    this.draw = function () {
        context.fillStyle = this.backColor;
        context.rect(0, 0, canvas.width, canvas.height);
        context.fill();
		
        var colors = chroma.scale([this.foreColor, this.groundColor, this.backColor]).domain([1, 9, Math.pow(numLayers + 1, 2)]).mode('hsl');
		
		for (var i = 0; i < terrain.length; i++)
		{
			//water[i].draw('#f0a030');
			terrain[i].draw(colors(Math.pow(terrain.length - i, 2)));
		}
    };
}

function WaterLayer(_z, _numLayers) 
{
	var y1 = 0;
	var y2 = 0;
	var z1 = Math.pow(_z, 2);
	var z2 = Math.pow(_z + 1, 2);
    
	this.update = function(_y) 
	{
		if (_z == _numLayers - 1)
		{
			y2 = Math.round(y2 = canvas.height / 2);
		}
		else
		{
			y2 = Math.round(y2 = (canvas.height / 2) + (_y / z2));
		}
		
		y1 = Math.round((canvas.height / 2) + (_y / z1));
	}
	
    this.draw = function (_color) 
	{
		context.fillStyle = _color;
        context.rect(0, y1, canvas.width, y2);
        context.fill();
    };
}

function TerrainLayer(_z) 
{
	var x = 0;
	var y = 0;
    var z = Math.pow(_z, 2);
	var increment = Math.round(100 / z);
	var heights;
	
	this.update = function(_x, _y) {
		if (_z > 1)
		{
			x = Math.round(_x / _z);
			y = Math.round(_y / _z);
		}
		else
		{
			x = _x;
			y = _y;
		}
		
		heights = []
		
		var horizontalOffset = x - (x % increment);
		var verticalOffset = y - (y % increment);
		
        for (var i = 0; i * increment <= canvas.width + increment * 2; i++) 
		{
			var horizontalStep = i * increment + horizontalOffset
			
			heights.push(terrainGen(horizontalStep, _z) + verticalOffset);
        }
	}
	
    this.draw = function (_color) 
	{
		var horizontalOffset = x % increment
		var verticalOffset = y % increment
        context.fillStyle = _color;
        context.beginPath();
        context.moveTo(0, heights[0]);
        for (var i = 0; i <= heights.length; i++)
        {
			context.lineTo(i * increment - horizontalOffset, heights[i] + verticalOffset);
        }
        context.lineTo(canvas.width, canvas.height);
        context.lineTo(0, canvas.height);
        context.fill();
    };
}

function terrainGen(_x, _z)
{
	var coarse = Math.round(noise.simplex2((_x * _z) / 10000, _z / 3) * (1000 / _z));
	
	return Math.round(coarse);
}