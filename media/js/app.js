"use strict";

var Game = {
    settings : {
        aspect_desktop: 16/9,
        default_width: 1024,
        fps_limit: 60
    },
    renderer: undefined,
    current_scene: undefined,
    current_camera: undefined,

    counters: {
        lights_global_counter: 0,
        geometry_global_counter: 0
    },


    objects: {
        lights: [],
        geometry: []
    },

    tasks_count: 0,
    tasks: [],

    mainLoopHandlerId: undefined,

    setupRenderer: function() {
        Game.renderer = new THREE.WebGLRenderer({canvas: $(".screen")[0]});
        Game.renderer.setSize(
            Game.settings.default_width,
            Math.round(Game.settings.default_width/Game.settings.aspect_desktop)
        )
    },

    setupScene: function() {
        Game.current_scene = new THREE.Scene();
        var light = new THREE.PointLight(0xFFFFFF);
        light.position.set(500, 500, 1000);
        light.lookAt(0,0,0);
        Game.current_scene.add(light);
        Game.objects.lights[Game.counters.lights_global_counter] = light;
    },

    setupCamera: function() {
        var camera = new THREE.PerspectiveCamera(
            75,
            Game.settings.aspect_desktop,
            0.1,
            1000
        );
        camera.position.z = 200;
        camera.lookAt(0,0,0);
        Game.current_camera = camera;
    },

    startMainLoop: function() {
        var now;
        var then = Date.now();
        var frame_time = 1000/Game.settings.fps_limit;
        var delta;


        var handler = function() {
            Game.mainLoopHandlerId = window.requestAnimationFrame(handler);
            now = Date.now();
            delta = now - then;

            if (delta > frame_time) {
                then = now - (delta % frame_time);
                __tasksCall();
                __renderCall();
            }
        };
        handler();
    },

    stopMainLoop: function () {
        if (Game.mainLoopHandlerId) {
            window.cancelAnimationFrame(Game.mainLoopHandlerId);
        }
    },

    addTask: function(task){
        Game.tasks.push(task);
        Game.tasks_count = Game.tasks.length;
    },

    initialize: function() {
        Game.setupRenderer();
        Game.setupScene();
        Game.setupCamera();

        __setupLevel();


        Game.startMainLoop();
    }
};

var __renderCall = function() {
    if (Game.renderer) {
        // Game.current_camera.updateProjectionMatrix();
        Game.renderer.render(Game.current_scene, Game.current_camera);
    }
};

var __tasksCall = function() {
    for (var i=0;i<Game.tasks_count;i++) {
        Game.tasks[i]();
    }
};


$(document).ready(function() {
    Game.initialize();
    var gui = new dat.GUI();

    var cameraGui = gui.addFolder("camera position");
    cameraGui.add(Game.current_camera.position, 'x');
    cameraGui.add(Game.current_camera.position, 'y');
    cameraGui.add(Game.current_camera.position, 'z',0,1000);
    cameraGui.open();
});


var __setupLevel = function() {
    Game.current_scene.add(makeOrb().mesh);
    var testorb2 = makeOrb(8,0xff0000);
    testorb2.setPosition({x:20,y:20});
    Game.current_scene.add(testorb2.mesh);

    Game.current_scene.add(makeWalls());
};


// TODO: remove from global
var ORB_GLOBAL_COUNTER = 0;

var orbs = {};

var makeOrb = function(volume, color) {
    color = typeof(color) === "undefined" ? 0xadadad : color;
    volume = typeof(volume) === "undefined" ? 10 : volume;
    var material = new THREE.MeshStandardMaterial( {color: color, roughness: 0.1, metalness: 0.1 } );
    var geometry = new THREE.SphereGeometry( volume, 12, 12 );
    var new_orb = {
        id: ORB_GLOBAL_COUNTER,
        x: 0,
        y: 0,
        volume: volume,
        impulse: 0,
        direction: 0,
        mesh: new THREE.Mesh( geometry, material ),
        setPosition: function(args) {
            new_orb.x = typeof(args.x) === "undefined" ? new_orb.x : args.x;
            new_orb.y = typeof(args.y) === "undefined" ? new_orb.y : args.y;
            new_orb.mesh.position.x = new_orb.x;
            new_orb.mesh.position.y = new_orb.y;
        }

    };

    orbs[ORB_GLOBAL_COUNTER] = new_orb;

    ORB_GLOBAL_COUNTER++;
    return new_orb;
};


var wall_width = 10;
var wall_length = 1000;
var makeWalls = function() {
    var walls = new THREE.Object3D();

    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );

    var north_wall = new THREE.Mesh( new THREE.BoxGeometry( wall_length, wall_width, 12 ), material );
    walls.add(north_wall);
    var east_wall = new THREE.Mesh( new THREE.BoxGeometry( wall_width, wall_length, 12 ), material );
    walls.add(east_wall);

    var south_wall = new THREE.Mesh( new THREE.BoxGeometry( wall_length, wall_width, 12 ), material );
    walls.add(south_wall);
    var west_wall = new THREE.Mesh( new THREE.BoxGeometry( wall_width, wall_length, 12 ), material );
    walls.add(west_wall);

    north_wall.position.y = wall_length/2 + wall_width/2;
    east_wall.position.x = wall_length/2 + wall_width/2;
    south_wall.position.y = -wall_length/2 - wall_width/2;
    west_wall.position.x = -wall_length/2 -wall_width/2;
    return walls;
};
