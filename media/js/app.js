"use strict";

var Game = {
    settings: {
        aspect_desktop: 16 / 9,
        default_width: 1200,
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
        lights: []
    },

    container: undefined,

    tasks_count: 0,
    tasks: [],

    mainLoopHandlerId: undefined,

    setupRenderer: function () {
        Game.renderer = new THREE.WebGLRenderer({ canvas: $(".screen")[0] });
        Game.renderer.setSize(
            Game.settings.default_width,
            Math.round(Game.settings.default_width / Game.settings.aspect_desktop)
        );
    },

    setupScene: function () {
        Game.current_scene = new THREE.Scene();
        var light = new THREE.PointLight(0xFFFFFF);
        light.position.set(500, 500, 1000);
        light.lookAt(0, 0, 0);
        Game.current_scene.add(light);
        Game.objects.lights[Game.counters.lights_global_counter] = light;
    },

    setupCamera: function () {
        var camera = new THREE.PerspectiveCamera(
            45,
            Game.settings.aspect_desktop,
            0.1,
            1000
        );
        camera.position.z = INITIAL_CAMERA_POSITION_Z;
        camera.lookAt(0, 0, 0);
        Game.current_camera = camera;
    },

    startMainLoop: function () {
        var now;
        var then = Date.now();
        var frame_time = 1000 / Game.settings.fps_limit;
        var delta;


        var handler = function () {
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

    addTask: function (task) {
        Game.tasks.push(task);
        Game.tasks_count = Game.tasks.length;
    },

    initialize: function () {
        Game.setupRenderer();
        Game.setupScene();
        Game.setupCamera();

        __setupLevel();


        Game.startMainLoop();
    }
};

var __renderCall = function () {
    if (Game.renderer) {
        // Game.current_camera.updateProjectionMatrix();
        Game.renderer.render(Game.current_scene, Game.current_camera);
    }
};

var __tasksCall = function () {
    for (var i = 0; i < Game.tasks_count; i++) {
        Game.tasks[i]();
    }
};


$(document).ready(function () {
    Game.initialize();
    var gui = new dat.GUI();
    
    var p = Math.PI;
    var cameraGui = gui.addFolder("camera position");
    cameraGui.add(Game.current_camera.position, "x",-600,600);
    cameraGui.add(Game.current_camera.position, "y",-600,600);
    cameraGui.add(Game.current_camera.position, "z", 0, 1000);
    cameraGui.add(Game.current_camera.rotation, "x",-p,p);
    cameraGui.add(Game.current_camera.rotation, "y",-p,p);
    
    cameraGui.open();
});


var __setupLevel = function () {
    container = makeWalls();

    var testorb1 = makeOrb(30,  0xffdddd);
    Game.current_scene.add(testorb1.mesh);

    var testorb2 = makeOrb(30, 0xff0000);
    testorb2.setPosition({ x: 210, y: 20 });
    Game.current_scene.add(testorb2.mesh);

    var testorb3 = makeOrb(30, 0xff4444);
    testorb3.setPosition({ x: -150, y: -150 });
    Game.current_scene.add(testorb3.mesh);
    
    var testorb4 = makeOrb(50, 0xff3333);
    testorb4.setPosition({ x: 150, y: 150 });
    Game.current_scene.add(testorb4.mesh);

    var testorb5 = makeOrb(81, 0xff1111);
    testorb5.setPosition({ x: 200, y: -200 });
    Game.current_scene.add(testorb5.mesh);


    Game.current_scene.add(container.mesh);

    testorb1.velocity.x = 6;
    testorb1.velocity.y = 6;
    
    testorb2.velocity.x = 5;
    testorb2.velocity.y = 4;

    testorb3.velocity.x = -12;
    testorb3.velocity.y = -12;

    testorb5.velocity.x = -12;

    Game.addTask(function () {
        var intersection_hash = {};
        $.each(orbs, function (i, orb) {
            
            var new_pos = orb.getNextPosition();
            if (new_pos.x + orb.volume >= container.east) {
                orb.velocity.x = - setNewVelocityAfterWallHit(orb.velocity.x);
            } else {
                if (new_pos.x - orb.volume <= container.west) {
                    orb.velocity.x = - setNewVelocityAfterWallHit(orb.velocity.x);
                }
            }
            if (new_pos.y + orb.volume >= container.north) {
                orb.velocity.y = - setNewVelocityAfterWallHit(orb.velocity.y);
            } else {
                if (new_pos.y - orb.volume <= container.south) {
                    orb.velocity.y = - setNewVelocityAfterWallHit(orb.velocity.y);
                }
            }
            
            $.each(orbs, function(ii, test_orb) {
                
                if (intersection_hash[ii] !== i) {
                    var has_intersection = getIntersectionPoint(
                        orb.x,orb.y, orb.volume,
                        test_orb.x, test_orb.y, test_orb.volume
                    );

                    if (has_intersection>0) {
                       var cr = CollisionResponce(
                           RESTITUTION_ORB,
                           orb,
                           test_orb
                       );
                       orb.velocity = cr.velocityA;
                       test_orb.velocity = cr.velocityB;
                       intersection_hash[i] = ii;
                       if (orb.volume > test_orb.volume) {
                           orb.grow(1);
                           test_orb.shrink(1);
                       } 
                       if (orb.volume < test_orb.volume) {
                           orb.shrink(1);
                           test_orb.grow(1);
                       }
                    }                    
                }
                
            });
            
            orb.updatePositionStep();
        });
    });
};


// TODO: remove from global
var ORB_GLOBAL_COUNTER = 0;

var orbs = {};

var DEFAULT_ORB_WIDTH_SEGMENTS = 22;
var DEFAULT_ORB_HEIGHT_SEGEMNTS = 22;
var RESTITUTION_WALL = 0.9;
var RESTITUTION_ORB = 0.8;

var INITIAL_CAMERA_POSITION_Z = 860;
var MINIMAL_VOLUME = 1; 
var container;

var setNewVelocityAfterWallHit = function(velocity) {
    return clampVelocity(velocity * RESTITUTION_WALL);
};

var makeOrb = function (volume, color) {
    color = typeof (color) === "undefined" ? 0xadadad : color;
    volume = typeof (volume) === "undefined" ? 10 : volume;
    var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.1 });
    var geometry = new THREE.SphereGeometry(volume, DEFAULT_ORB_WIDTH_SEGMENTS, DEFAULT_ORB_HEIGHT_SEGEMNTS);
    var new_orb = {
        id: ORB_GLOBAL_COUNTER,
        x: 0,
        y: 0,
        volume: volume,
        velocity: {
            x: 0,
            y: 0
        },
        direction: 0,
        material: material,
        mesh: new THREE.Mesh(geometry, material),
        setPosition: function (args) {
            new_orb.x = typeof (args.x) === "undefined" ? new_orb.x : args.x;
            new_orb.y = typeof (args.y) === "undefined" ? new_orb.y : args.y;
            new_orb.mesh.position.x = new_orb.x;
            new_orb.mesh.position.y = new_orb.y;
        },
        setVolume: function (value) {
            new_orb.volume = value;
            new_orb.mesh.geometry.dispose();
            new_orb.mesh.geometry = new THREE.SphereGeometry(value, DEFAULT_ORB_WIDTH_SEGMENTS, DEFAULT_ORB_HEIGHT_SEGEMNTS);
        },
        grow: function(value) {
            new_orb.setVolume(new_orb.volume + value);
        },
        shrink: function(value) {
            var new_volume = new_orb.volume - value;
            if (new_volume < MINIMAL_VOLUME) {
                new_orb.die();
            } else {
                new_orb.setVolume(new_volume);
            }
        },
        setDirection: function (direction) {
            new_orb.direction = direction;
            new_orb.mesh.rotation.z = direction;
        },
        getNextPosition: function () {
            return {
                x: new_orb.x + new_orb.velocity.x,
                y: new_orb.y + new_orb.velocity.y
            };
        },
        updatePositionStep: function () {
            new_orb.x += new_orb.velocity.x;
            new_orb.y += new_orb.velocity.y;
            new_orb.mesh.position.x = new_orb.x;
            new_orb.mesh.position.y = new_orb.y;
        },
        die: function() {
            Game.current_scene.remove(new_orb.mesh);
            delete orbs[new_orb.id];
        }
    };

    orbs[ORB_GLOBAL_COUNTER] = new_orb;

    ORB_GLOBAL_COUNTER++;
    return new_orb;
};


var wall_width = 2;
var wall_length = 600;

var makeWalls = function () {
    var walls_mesh = new THREE.Object3D();

    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    var north_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_length, wall_width, 12), material);
    walls_mesh.add(north_wall);
    var east_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_width, wall_length, 12), material);
    walls_mesh.add(east_wall);

    var south_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_length, wall_width, 12), material);
    walls_mesh.add(south_wall);
    var west_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_width, wall_length, 12), material);
    walls_mesh.add(west_wall);

    var half_wall_length = wall_length / 2;
    var half_wall_width = wall_width / 2;
    north_wall.position.y = half_wall_length + half_wall_width;
    east_wall.position.x = half_wall_length + half_wall_width;
    south_wall.position.y = -half_wall_length - half_wall_width;
    west_wall.position.x = -half_wall_length - half_wall_width;
    return {
        mesh: walls_mesh,
        north: half_wall_length,
        east: half_wall_length,
        south: -half_wall_length,
        west: -half_wall_length
    };
};