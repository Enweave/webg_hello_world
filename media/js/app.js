"use strict";

var Game = {
    settings : {
        aspect_desktop: 16/9,
        default_width: 800,
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
        light.position.set(10, 0, 25);
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
        camera.position.z = 100;
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
        var geometry = new THREE.BoxGeometry(20, 20, 20);
        var material = new THREE.MeshStandardMaterial({color: 0xadadad});

        var cube = new THREE.Mesh(geometry, material);
        Game.current_scene.add(cube);

//        Game.addTask(function(){
//            cube.rotation.y+=0.01;
//        });

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
    cameraGui.add(Game.current_camera.position, 'z');
    cameraGui.open();
});


var __setupLevel = function() {

};
// dat gui

//



