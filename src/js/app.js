var Game = {
    is_running: true,
    __running: false,
    settings: {
        view_aspect: 1,
        default_width: 1200,
        fps_limit: FPS_LIMIT,
        camera_lookAhead: CAMERA_LOOKAHEAD
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

    assets: {},

    container: undefined,

    tasks: [],

    mainLoopHandlerId: undefined,

    setupRenderer: function () {
        Game.renderer = new THREE.WebGLRenderer({ canvas: $(".screen")[0] });
        Game.renderer.setClearColor(0xffffff);
        Game.renderer.setSize(
            Game.settings.default_width,
            Math.round(Game.settings.default_width / Game.settings.view_aspect)
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
            22,
            Game.settings.view_aspect,
            0.1,
            100000
        );
        camera.position.z = INITIAL_CAMERA_POSITION_Z;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        Game.current_camera = camera;
        Game.current_camera._focus = { x: camera.position.x, y: camera.position.y };
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

    /** @description Create new orb and add it to scene.  
    * @param {object} args - orb parameters.
    * @param {number} args.volume - orb volume(radius).
    * @param {hex} args.color - orb color.
    * @param {number} args.x - orb position x.
    * @param {number} args.y - orb position y.
    * @param {object} args.velocity - orb velocity vector.
    * @param {number} args.velocity.x - orb velocity x.
    * @param {number} args.velocity.y - orb velocity y.
    * @return {object} orb - return created orb
    */
    addOrb: function (args) {
        var params = $.extend({
            volume: 10,
            color: DEFAULT_ORB_COLOR,
            x: 0,
            y: 0,
            velocity_x: 0,
            velocity_y: 0
        }, args);

        var orb = makeOrb(params.volume, params.color);
        orb.setPosition({ x: params.x, y: params.y });
        orb.velocity = { x: params.velocity_x, y: params.velocity_y };
        Game.current_scene.add(orb.mesh);
        return orb;
    },
    initialize: function () {
        Game.settings.default_width = getWindowWidth();
        Game.settings.view_aspect = getAspect();
        Game.setupRenderer();
        Game.setupScene();
        Game.setupCamera();
        loadAssets();

    },
    postInitialize: function () {
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


var __setupLevel = function () {
    Game.container = makeWalls();
    Game.current_scene.add(Game.container.mesh);

    var orbMatrix = generateRandomOrbs(64, 8);
    $.each(orbMatrix, function (oi, op) {
        Game.addOrb({
            volume: op.r,
            x: op.x,
            y: op.y
        });
    });

    playable_orb = Game.objects.orbs[Math.round((Game.counters.orbs_global_counter - 1) * Math.random())];

    playable_orb.material.color.setHex(0xff2222);

    playable_orb.die = function() {
        Game.current_scene.remove(playable_orb.mesh);

        delete Game.objects.orbs[playable_orb.id];
        playable_orb = undefined;
    };

    Game.addTask(function() {
        if (playable_orb) {

            var dx = Game.current_camera._focus.x - playable_orb.x;
            var dy = Game.current_camera._focus.y - playable_orb.y;
            if (Math.abs(dx) > 1) {
                Game.current_camera._focus.x -= dx/Game.settings.camera_lookAhead;
            }
            Game.current_camera.position.x = Game.current_camera._focus.x - 2*dx;
            if (Math.abs(dy) > 1) {
               Game.current_camera._focus.y -= dy/Game.settings.camera_lookAhead;
            }
            Game.current_camera.position.y = Game.current_camera._focus.y - 2*dy;
        }

    });

    Game.addTask(function () {
        var intersection_hash = {};
        $.each(Game.objects.orbs, function (i, orb) {

            var new_pos = orb.getNextPosition();
            if (new_pos.x + orb.volume >= Game.container.east) {
                orb.velocity.x = - setNewVelocityAfterWallHit(orb.velocity.x);
                orb.x = Game.container.east - (orb.velocity.x + orb.volume);
            } else {
                if (new_pos.x - orb.volume <= Game.container.west) {
                    orb.velocity.x = - setNewVelocityAfterWallHit(orb.velocity.x);
                    orb.x = Game.container.west + (orb.velocity.x + orb.volume);
                }
            }
            if (new_pos.y + orb.volume >= Game.container.north) {
                orb.velocity.y = - setNewVelocityAfterWallHit(orb.velocity.y);
                orb.y = Game.container.north - (orb.velocity.y + orb.volume);
            } else {
                if (new_pos.y - orb.volume <= Game.container.south) {
                    orb.velocity.y = - setNewVelocityAfterWallHit(orb.velocity.y);
                    orb.y = Game.container.south + (orb.velocity.y + orb.volume);
                }
            }

            $.each(Game.objects.orbs, function (ii, test_orb) {

                if (intersection_hash[ii] !== i) {
                    var has_intersection = getIntersectionPoint(
                        orb.x, orb.y, orb.volume,
                        test_orb.x, test_orb.y, test_orb.volume
                    );

                    if (has_intersection.approach !== false) {
                        if (orb.volume > test_orb.volume) {
                            orb.grow(1);
                            test_orb.shrink(3);
                        }
                        if (orb.volume < test_orb.volume) {
                            orb.shrink(3);
                            test_orb.grow(1);
                        }
                        if (has_intersection.collide !== false) {
                            intersection_hash[i] = ii;
                            var cr = getCollisionResponse(
                                RESTITUTION_ORB,
                                orb,
                                test_orb,
                                has_intersection
                            );
                            orb.velocity = clampVelocityVector(cr.velocityA);
                            test_orb.velocity = clampVelocityVector(cr.velocityB);
                        }
                    }
                }

            });

            orb.updatePositionStep();
        });
    });
};


// Game start
var $doc = $(document);
$doc.ready(function () {
    Game.initialize();

    $(window).resize(function () {

        Game.settings.view_aspect = getAspect();
        Game.current_camera.aspect = Game.settings.view_aspect;
        var width = getWindowWidth();
        Game.renderer.setSize(
            width,
            Math.round(width / Game.settings.view_aspect)
        );
        Game.current_camera.updateProjectionMatrix();
    });

    var gui = new dat.GUI({ width: 320 });

    var cameraGui = gui.addFolder("camera position");
    cameraGui.add(Game.current_camera.position, "z", 0, 3000).listen();
    cameraGui.add(Game.settings, "camera_lookAhead");
    var gameGui = gui.addFolder("game");
    gameGui.add(Game, "toggleExecution");
    gameGui.add(Game, "is_running").listen();
    gameGui.add(Game.settings, "fps_limit", 1, 60);
    gameGui.add(Game, "restart");
    gameGui.add(window, "RESTITUTION_ORB", 0, 1);
    gameGui.add(window, "RESTITUTION_WALL", 0, 1);
    gameGui.add(window, "APPROACH_DISTANCE", 0, 10);

    gameGui.open();
});

var $screen = $(".screen").eq(0);

var playable_orb;
var playerMove = function (e) {
    if (playable_orb && Game.current_camera) {
        var d, cp, kx, ky, cam;
        cp = getClickPosition(e);

        cam = Game.current_camera;
        var vector = new THREE.Vector3();

        vector.set(cp.x,cp.y,0);
        vector.unproject( cam );
        var dir = vector.sub( cam.position ).normalize();

        var distance = - cam.position.z / dir.z;
        var pos = cam.position.clone().add( dir.multiplyScalar( distance ) );

        var dx = (pos.x - playable_orb.x);
        var dy = (pos.y - playable_orb.y);

        d = Math.sqrt(dx * dx + dy * dy);
        if (d < playable_orb.volume) {
            playaStop();
        } else {
            kx = dx / d;
            ky = dy / d;
            playable_orb.velocity.x = playa_velocity * kx;
            playable_orb.velocity.y = playa_velocity * ky;
        }

    }
};

var playaStop = function () {
    if (playable_orb) {
        playable_orb.velocity.x = 0;
        playable_orb.velocity.y = 0;
    }
};

var playa_velocity = 4;
$screen.on("click", function (e) {
    playerMove(e);
});


var camz = INITIAL_CAMERA_POSITION_Z;
var onmouseWheel = function(e) {
    camz = Game.current_camera.position.z;
    var delta = camz - ( (camz/30) * Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) );

    camz = 0 < delta && delta < 3000 ? delta : camz;

    Game.current_camera.position.z = camz;
    return false;
};

$screen.on("mousewheel", function(e){
    onmouseWheel(e);
});

$screen.on("DOMMouseScroll", function(e){
    onmouseWheel(e);
});


// Utils;
var clampVelocity = function (new_velocity) {
    return - MIN_VELOCITY < new_velocity && new_velocity < MIN_VELOCITY ? 0 : new_velocity;
};

var loadAssets = function () {
    var loader = new THREE.TextureLoader();

    // load a resource
    loader.load("dist/textures/orb.jpg",
        function (texture) {
            Game.assets.orb_texture = texture;
            console.log("assets loaded!");
            Game.postInitialize();
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + "% loaded");
        },
        function (xhr) {
            console.log("An error happened");
        }
    );
};



var getWindowWidth = function () {
//    if (typeof (window.__$body) === "undefined") {
//        window.__$body = $(window);
//    }
//    getWindowWidth = function () {
//        return window.__$body.innerWidth();
//    };
//    return window.__$body.innerWidth();
    return window.innerWidth;
};


var getWindowHeight = function () {
//    if (typeof (window.__$body) === "undefined") {
//        window.__$body = $(window);
//    }
//    getWindowHeight = function () {
//        return window.__$body.innerHeight();
//    };
//    return window.__$body.innerHeight();
    return window.innerHeight;
};

var getAspect = function() {
    return getWindowWidth()/getWindowHeight();
};

var clampVelocityVector = function (new_velocity) {
    return {
        x: - MIN_VELOCITY < new_velocity.x && new_velocity.x < MIN_VELOCITY ? 0 : new_velocity.x,
        y: - MIN_VELOCITY < new_velocity.y && new_velocity.y < MIN_VELOCITY ? 0 : new_velocity.y
    };
};

var setNewVelocityAfterWallHit = function (velocity) {
    return clampVelocity(velocity * RESTITUTION_WALL);
};

var makeOrb = function (volume, color) {
    color = typeof (color) === "undefined" ? DEFAULT_ORB_COLOR : color;
    volume = typeof (volume) === "undefined" ? 10 : volume;
    var material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.6,
        transparent: true,
        map: Game.assets.orb_texture,
        bumpMap: Game.assets.orb_texture
    });
    var geometry = new THREE.SphereGeometry(volume, DEFAULT_ORB_WIDTH_SEGMENTS, DEFAULT_ORB_HEIGHT_SEGEMNTS);
    var new_orb = {
        id: Game.counters.orbs_global_counter,
        x: 0,
        y: 0,
        initial_volume: volume,
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

            var scale_factor = value/new_orb.initial_volume;
            new_orb.volume = value;
            new_orb.mesh.scale.set(scale_factor,scale_factor,scale_factor);
            //new_orb.mesh.geometry.dispose();
            //new_orb.mesh.geometry = new THREE.SphereGeometry(value, DEFAULT_ORB_WIDTH_SEGMENTS, DEFAULT_ORB_HEIGHT_SEGEMNTS);
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

    var material = new THREE.MeshBasicMaterial({ color: 0x000000 });

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

