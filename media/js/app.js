"use strict";

var MINIMAL_VOLUME = 8;
var MIN_VELOCITY = 0.1;

var DEFAULT_ORB_WIDTH_SEGMENTS = 22;
var DEFAULT_ORB_HEIGHT_SEGEMNTS = 22;

var RESTITUTION_WALL = 0.9;
var RESTITUTION_ORB = 0.6;

var WALL_WIDTH = 10;
var WALL_LENGTH = 500;
var WALL_HEIGHT = 2;

var INITIAL_CAMERA_POSITION_Z = 860;

var Game = {
    is_running: false,
    __running: false,
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
        orbs_global_counter: 0,
        tasks_count: 0,
        _reset: function () {
            Game.counters.lights_global_counter = 0;
            Game.counters.orbs_global_counter = 0;
        }
    },

    objects: {
        lights: {},
        orbs: {},
        _reset: function () {
            Game.objects.lights = {};
            Game.objects.orbs = {};
        }
    },

    container: undefined,


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
        light.lookAt(new THREE.Vector3(0, 0, 0));
        Game.current_scene.add(light);
        Game.objects.lights[Game.counters.lights_global_counter] = light;
        Game.counters.lights_global_counter++;
        var light2 = new THREE.AmbientLight(0x555555);
        Game.current_scene.add(light2);
        Game.objects.lights[Game.counters.lights_global_counter] = light2;
        Game.counters.lights_global_counter++;
    },

    setupCamera: function () {
        var camera = new THREE.PerspectiveCamera(
            45,
            Game.settings.aspect_desktop,
            0.1,
            1000
        );
        camera.position.z = INITIAL_CAMERA_POSITION_Z;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        Game.current_camera = camera;
    },

    __renderCall: function () {
        if (Game.renderer) {
            // Game.current_camera.updateProjectionMatrix();
            Game.renderer.render(Game.current_scene, Game.current_camera);
        }
    },
    __tasksCall: function () {
        for (var i = 0; i < Game.counters.tasks_count; i++) {
            Game.tasks[i]();
        }
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
                Game.__tasksCall();
                Game.__renderCall();
            }
        };

        Game.__running = true;
        handler();
    },

    stopMainLoop: function () {
        if (Game.mainLoopHandlerId) {
            Game.__running = false;
            window.cancelAnimationFrame(Game.mainLoopHandlerId);
        }
    },

    toggleExecution: function () {

        if (Game.__running === true) {
            Game.stopMainLoop();
            Game.is_running = false;
        } else {
            Game.startMainLoop();
            Game.is_running = true;
        }

    },

    addTask: function (task) {
        Game.tasks.push(task);
        Game.counters.tasks_count = Game.tasks.length;
    },

    initialize: function () {
        Game.settings.default_width = getWindowWidth();
        Game.setupRenderer();
        Game.setupScene();
        Game.setupCamera();

        __setupLevel();


        Game.startMainLoop();
    },

    restart: function () {
        Game.stopMainLoop();

        Game.counters._reset();
        Game.objects._reset();

        delete Game.container;

        Game.tasks = [];
        Game.mainLoopHandlerId = undefined;

        delete Game.current_scene;

        Game.setupScene();

        __setupLevel();

        Game.startMainLoop();
    }
};

var $body = $("body");
var getWindowWidth = function () {
    return $body.width();
};

$(document).ready(function () {
    Game.initialize();

    $(window).resize(function () {
        Game.current_camera.updateProjectionMatrix();
        var width = getWindowWidth();
        Game.renderer.setSize(
            width,
            Math.round(width / Game.settings.aspect_desktop)
        );
    });

    var gui = new dat.GUI({ width: 320 });

    var cameraGui = gui.addFolder("camera position");
    cameraGui.add(Game.current_camera.position, "x", -600, 600).listen();
    cameraGui.add(Game.current_camera.position, "y", -600, 600).listen();
    cameraGui.add(Game.current_camera.position, "z", 0, 1000).listen();
    var gameGui = gui.addFolder("game");
    gameGui.add(Game, "toggleExecution");
    gameGui.add(Game, "is_running").listen();
    gameGui.add(Game.settings, "fps_limit", 1, 60);
    gameGui.add(Game, "restart");
    gameGui.add(window, "RESTITUTION_ORB",0,1);
    gameGui.add(window, "RESTITUTION_WALL",0,1);
    gameGui.open();
});


var __setupLevel = function () {
    Game.container = makeWalls();
    Game.current_scene.add(Game.container.mesh);
    
    var testorb1 = makeOrb(30, 0x11aaaa);
    testorb1.setPosition({ x: -60, y: 0 });
    Game.current_scene.add(testorb1.mesh);

    var testorb2 = makeOrb(35, 0xaa1111);
    testorb2.setPosition({ x: 60, y: 0 });
    Game.current_scene.add(testorb2.mesh);

    
    var testorb3 = makeOrb(30, 0x1111aa);
    testorb3.setPosition({ x: 0, y: 100 });
    Game.current_scene.add(testorb3.mesh);
    
    testorb1.velocity.x = -6;
    testorb1.velocity.y = 6;


    Game.addTask(function () {
        var intersection_hash = {};
        $.each(Game.objects.orbs, function (i, orb) {

            var new_pos = orb.getNextPosition();
            if (new_pos.x + orb.volume >= Game.container.east) {
                orb.velocity.x = - setNewVelocityAfterWallHit(orb.velocity.x);
            } else {
                if (new_pos.x - orb.volume <= Game.container.west) {
                    orb.velocity.x = - setNewVelocityAfterWallHit(orb.velocity.x);
                }
            }
            if (new_pos.y + orb.volume >= Game.container.north) {
                orb.velocity.y = - setNewVelocityAfterWallHit(orb.velocity.y);
            } else {
                if (new_pos.y - orb.volume <= Game.container.south) {
                    orb.velocity.y = - setNewVelocityAfterWallHit(orb.velocity.y);
                }
            }

            $.each(Game.objects.orbs, function (ii, test_orb) {

                if (intersection_hash[ii] !== i) {
                    var has_intersection = getIntersectionPoint(
                        orb.x, orb.y, orb.volume,
                        test_orb.x, test_orb.y, test_orb.volume
                    );

                    if (has_intersection !== false) {
                        var cr = CollisionResponce(
                            RESTITUTION_ORB,
                            orb,
                            test_orb,
                            has_intersection
                        );
                        orb.velocity = clampVelocityVector(cr.velocityA);
                        test_orb.velocity = clampVelocityVector(cr.velocityB);
                        intersection_hash[i] = ii;
                        if (orb.volume > test_orb.volume) {
                            orb.grow(3);
                            test_orb.shrink(3);
                        }
                        if (orb.volume < test_orb.volume) {
                            orb.shrink(3);
                            test_orb.grow(3);
                        }
                    }
                }

            });

            orb.updatePositionStep();
        });
    });
};

// Utils;
var clampVelocity = function (new_velocity) {
    return - MIN_VELOCITY < new_velocity && new_velocity < MIN_VELOCITY ? 0 : new_velocity;
};

var clampVelocityVector = function (new_velocity) {
    return {
        x: - MIN_VELOCITY < new_velocity.x && new_velocity.x < MIN_VELOCITY ? 0 : new_velocity.x,
        y: - MIN_VELOCITY < new_velocity.y && new_velocity.y < MIN_VELOCITY ? 0 : new_velocity.y
    };
};

var CollisionResponce = function (e, a, b, ip) {
    var ma = a.volume;
    var mb = b.volume;
    var Ia = 1;
    var Ib = 1;

    var ra = {
        x: ip.x - a.x,
        y: ip.y - a.y
    };
    var rb = {
        x: ip.x - b.x,
        y: ip.y - b.y
    };

    var vai = a.velocity;
    var vbi = b.velocity;
    var k = 1 / (ma * ma) + 2 / (ma * mb) + 1 / (mb * mb) - ra.x * ra.x / (ma * Ia) - rb.x * rb.x / (ma * Ib) - ra.y * ra.y / (ma * Ia)
        - ra.y * ra.y / (mb * Ia) - ra.x * ra.x / (mb * Ia) - rb.x * rb.x / (mb * Ib) - rb.y * rb.y / (ma * Ib)
        - rb.y * rb.y / (mb * Ib) + ra.y * ra.y * rb.x * rb.x / (Ia * Ib) + ra.x * ra.x * rb.y * rb.y / (Ia * Ib) - 2 * ra.x * ra.y * rb.x * rb.y / (Ia * Ib);

    var Jx = ((e + 1) / k) * (
        (vai.x - vbi.x) * (1 / ma - ra.x * ra.x / Ia + 1 / mb - rb.x * rb.x / Ib)
    ) - ((e + 1) / k) * ((vai.y - vbi.y) * (ra.x * ra.y / Ia + rb.x * rb.y / Ib));
    var Jy = - ((e + 1) / k) * (
        (vai.x - vbi.x) * (ra.x * ra.y / Ia + rb.x * rb.y / Ib)
    ) + (e + 1) / k * (vai.y - vbi.y) * (1 / ma - ra.y * ra.y / Ia + 1 / mb - rb.y * rb.y / Ib);

    return {
        velocityA: {
            x: vai.x - Jx / ma,
            y: vai.y - Jy / ma
        },
        velocityB: {
            x: vbi.x + Jx / mb,
            y: vbi.y + Jy / mb
        }
    };
};

var getIntersectionPoint = function (x0, y0, r0, x1, y1, r1) {
    var dx, dy, d, a;

    dx = x1 - x0;
    dy = y1 - y0;

    d = Math.sqrt((dy * dy) + (dx * dx));

    if (d > (r0 + r1)) {
        return false;
    }
    if (d < Math.abs(r0 - r1)) {
        return false;
    }

    if (d <= 0) {
        return false;
    }

    a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

    return {
        x: x0 + (dx * a / d),
        y: y0 + (dy * a / d)
    };
};

var setNewVelocityAfterWallHit = function (velocity) {
    return clampVelocity(velocity * RESTITUTION_WALL);
};

var makeOrb = function (volume, color) {
    color = typeof (color) === "undefined" ? 0xadadad : color;
    volume = typeof (volume) === "undefined" ? 10 : volume;
    var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.1 });
    var geometry = new THREE.SphereGeometry(volume, DEFAULT_ORB_WIDTH_SEGMENTS, DEFAULT_ORB_HEIGHT_SEGEMNTS);
    var new_orb = {
        id: Game.counters.orbs_global_counter,
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
        grow: function (value) {
            new_orb.setVolume(new_orb.volume + value);
        },
        shrink: function (value) {
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
        die: function () {
            Game.current_scene.remove(new_orb.mesh);
            delete Game.objects.orbs[new_orb.id];
        }
    };
    Game.objects.orbs[Game.counters.orbs_global_counter] = new_orb;
    Game.counters.orbs_global_counter++;
    return new_orb;
};


var makeWalls = function () {
    var walls_mesh = new THREE.Object3D();

    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    var north_wall = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, WALL_WIDTH, WALL_HEIGHT), material);
    walls_mesh.add(north_wall);
    var east_wall = new THREE.Mesh(new THREE.BoxGeometry(WALL_WIDTH, WALL_LENGTH, WALL_HEIGHT), material);
    walls_mesh.add(east_wall);

    var south_wall = new THREE.Mesh(new THREE.BoxGeometry(WALL_LENGTH, WALL_WIDTH, WALL_HEIGHT), material);
    walls_mesh.add(south_wall);
    var west_wall = new THREE.Mesh(new THREE.BoxGeometry(WALL_WIDTH, WALL_LENGTH, WALL_HEIGHT), material);
    walls_mesh.add(west_wall);

    var half_wall_length = WALL_LENGTH / 2;
    var half_wall_width = WALL_WIDTH / 2;
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