// Create the game screen/view
"use strict";
const app = new PIXI.Application(800, 500);
document.querySelector("#gameDiv").appendChild(app.view)

// This (attempts) to ensure the game screen is constantly in the center of the window
app.view.style.position = 'absolute';
app.view.style.left = '50%';
app.view.style.transform = 'translate3d( -50%, 0, 0 )';
app.view.style.overflow = 'hidden';

// Constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// Pre-load the images
PIXI.loader.
add(["gameSprites/BackgroundMenu.png", "gameSprites/BackgroundGame.png", "gameSprites/NightOverlay.png", "gameSprites/Character.png", "gameSprites/DayIcon.png", "gameSprites/EnemyAmbientLight.png", "gameSprites/ExaminableChest.png", "gameSprites/ExaminableGround.png", "gameSprites/ExaminablePile.png", "gameSprites/FireMonster.png", "gameSprites/FireMonsterFade.png", "gameSprites/FoodIcon.png", "gameSprites/SimpleClockIcon.png", "gameSprites/OtherResourcesIcon.png", "gameSprites/Key.png", "gameSprites/Ruins.png", "gameSprites/SafeHaven.png", "gameSprites/GameInstructions.png", "gameSprites/GameTitle.png", "gameSprites/GameStartText.png", "gameSprites/GamePlayAgainText.png", "gameSprites/GameRetryText.png"]).
on("progress",e=>{console.log(`progress=${e.progress}`)}).
load(setup);

// Aliases
let stage;

// Game variables
let startScene, backgroundMenuStart;
let gameScene, backgroundGame, nightOverlay, player, safeHaven, resourceIcon, foodIcon, timeText, foodText, resourceText;
let gameOverScene, backgroundMenuEnd;
let gameWinScene,  backgroundMenuWin;

let resourceSymbolPopup;
let foodSymbolPopup;
let keySymbolPopup;
let nothingTextPopup;
let lockedTextPopup;
let keySymbol;

let examinables = [];
let ruins = [];
let fireMonsters = [];
let fireMonsterFadeAnims = [];
let characterTextures;
let fireMonsterTextures;
let fireMonsterFadeTextures;
// Player survival time - Game Over if it reaches 0
let time = 35;
// The timer for the day/night cycle. When it is below 0, enemies will spawn. Then, once it reaches -7, it will cycle back to day and enemies will no longer spawn
let monstersTimer = 7;
// Timer to periodically spawn enemies when they shoudl be spawned (every 2 sec)
let enemySpawnTimer = 1.5;
let keyPopupTimer = 0;
let foodPopupTimer = 0;
let resourcePopupTimer = 0;
let nothingTextPopupTimer = 0;
let lockedTextPopupTimer = 0;
let interactionCheck = true;
let interactionCheckTimer = 0;
let resources = 0;
let food = 0;
let key = false;
let win = false;
let paused = true;
// Variable to keep track of weather keys are being pressed
let upAndDownKeys = false;
let leftAndRightKeys = false;

/////////////////////////////////////////////////////
// Setup function
function setup() {
    stage = app.stage;
	// Create the `start` scene, and make it initially visible
	startScene = new PIXI.Container();
    stage.addChild(startScene);
    backgroundMenuStart = new PIXI.Sprite(PIXI.loader.resources["gameSprites/BackgroundMenu.png"].texture);
    backgroundMenuStart.x = 0;
    backgroundMenuStart.y = 0;
    startScene.addChild(backgroundMenuStart);
    startScene.visible = true;
    
	// Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    stage.addChild(gameScene);
    backgroundGame = new PIXI.Sprite(PIXI.loader.resources["gameSprites/BackgroundGame.png"].texture);
    backgroundGame.x = 0;
    backgroundGame.y = 0;
    gameScene.addChild(backgroundGame);
    gameScene.visible = false;
    
    // Create the nightOverlay - a simple texutre assignment
    nightOverlay = new PIXI.Sprite(PIXI.loader.resources["gameSprites/NightOverlay.png"].texture);
    nightOverlay.x = 0;
    nightOverlay.y = 0;
    gameScene.addChild(nightOverlay);
    nightOverlay.visible = false;

	// Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    stage.addChild(gameOverScene);
    backgroundMenuEnd = new PIXI.Sprite(PIXI.loader.resources["gameSprites/BackgroundMenu.png"].texture);
    backgroundMenuEnd.x = 0;
    backgroundMenuEnd.y = 0;
    gameOverScene.addChild(backgroundMenuEnd);
    gameOverScene.visible = false;
    
    // Create the "gameWin" scene and make it invisible
    gameWinScene = new PIXI.Container();
    stage.addChild(gameWinScene);
    backgroundMenuWin = new PIXI.Sprite(PIXI.loader.resources["gameSprites/BackgroundMenu.png"].texture);
    backgroundMenuWin.x = 0;
    backgroundMenuWin.y = 0;
    gameWinScene.addChild(backgroundMenuWin);
    gameWinScene.visible = false;
    
    gameScene.sortableChildren = true;
    
    // Call createLabelsAndButtons to form the labels for all scenes
    createLabelsAndButtons();
    
    // Load Character and Fire Monster Sprite Sheets
    characterTextures = loadSpriteSheetCharacter();
    fireMonsterTextures = loadSpriteSheetFireMonster();
    fireMonsterFadeTextures = loadSpriteSheetFireMonsterFade();
    
    // Create Safe Haven at the top of the level
    safeHaven = new PIXI.Sprite(PIXI.loader.resources["gameSprites/SafeHaven.png"].texture);
    safeHaven.anchor.set(0.5);
    safeHaven.x = sceneWidth / 2;
    safeHaven.y = safeHaven.width / 2;
    gameScene.addChildAt(safeHaven, 1);
    
    // Create player character
    player = new Character(sceneWidth/2, sceneHeight/2, characterTextures);
    gameScene.addChildAt(player, 2);
    
    // Start update loop
	app.ticker.add(gameLoop);
}
/////////////////////////////////////////////////////

function createLabelsAndButtons(){
    // Text styles
    let textStyle = new PIXI.TextStyle({
        fontSize: 20,
        fill: 0xffffff,
        fontFamily: "DestroyedAero",
        stroke: 0x000000,
        strokeThickness: 2
    });
    
    let popupStyle = new PIXI.TextStyle({
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: "DestroyedAero",
        stroke: 0x000000,
        strokeThickness: 1
    });
    
    // Start Scene
    let titleLabel = PIXI.Sprite.fromImage('gameSprites/GameTitle.png');
    titleLabel.anchor.set(0.5);
    titleLabel.x = sceneWidth / 2;
    titleLabel.y = sceneHeight - (sceneHeight - 80);
    startScene.addChild(titleLabel);
    
    let instructionsLabel = new PIXI.Text("Instructions:\n-Press W, A, S, and D to move around the level.\n-Press the Spacebar to interact with objects in the world. This includes\nsearching chests, piles, and areas of the ground, as well as unlocking and\nhiding in ruins or the Safe Haven.\n-Press F to consume food, giving you more time to explore.\n-Press E to exit ruins that you are hiding within.\n-Ruins require 1 Resource to unlock, indicated by the questions marks\nin the top right.\n-To unlock the Safe Haven at the top of the level and survive, you must\nfind the key that is within a locked chest.\n-Avoid the fiery monsters that appear when darkness falls...");
    instructionsLabel.style = textStyle;
    instructionsLabel.anchor.set(0.5);
    instructionsLabel.x = sceneWidth / 2;
    instructionsLabel.y = sceneHeight / 2;
    startScene.addChild(instructionsLabel);
    
    let gameStartButton = PIXI.Sprite.fromImage('gameSprites/GameStartText.png');
    gameStartButton.anchor.set(0.5);
    gameStartButton.interactive = true;
    gameStartButton.buttonMode = true;
    gameStartButton.x = sceneWidth / 2;
    gameStartButton.y = sceneHeight - 80;
    gameStartButton.on("pointerup", startGame);
    gameStartButton.on("pointerover", e=> {e.target.alpha = 0.9; e.target.height = e.target.height * 1.2; e.target.width = e.target.width * 1.2});
    gameStartButton.on("pointerout", e=> {e.currentTarget.alpha = 1.0; e.currentTarget.height = e.currentTarget.height * (5/6); e.currentTarget.width = e.currentTarget.width * (5/6)});
    startScene.addChild(gameStartButton);
    
    // Game Scene
    let clockSymbol = PIXI.Sprite.fromImage('gameSprites/SimpleClockIcon.png');
    clockSymbol.x = -5;
    clockSymbol.y = -5;
    clockSymbol.height = clockSymbol.height * (4/5);
    clockSymbol.width = clockSymbol.width * (4/5);
    gameScene.addChild(clockSymbol);
    
    let foodSymbol = PIXI.Sprite.fromImage('gameSprites/FoodIcon.png');
    foodSymbol.x = 2;
    foodSymbol.y = 42;
    foodSymbol.height = foodSymbol.height * (5/8);
    foodSymbol.width = foodSymbol.width * (1/2);
    gameScene.addChild(foodSymbol);
    
    let resourceSymbol = PIXI.Sprite.fromImage('gameSprites/OtherResourcesIcon.png');
    resourceSymbol.x = 10;
    resourceSymbol.y = 68;
    resourceSymbol.height = resourceSymbol.height * (5/8);
    resourceSymbol.width = resourceSymbol.width * (5/8);
    gameScene.addChild(resourceSymbol);
    
    keySymbol = PIXI.Sprite.fromImage('gameSprites/Key.png');
    keySymbol.x = 4;
    keySymbol.y = 105;
    gameScene.addChild(keySymbol);
    keySymbol.visible = key;
    
    timeText = new PIXI.Text();
    timeText.style = textStyle;
    timeText.x = 45;
    timeText.y = 12;
    gameScene.addChild(timeText);
    changeTime(0);
    
    foodText = new PIXI.Text();
    foodText.style = textStyle;
    foodText.x = 45;
    foodText.y = 45;
    gameScene.addChild(foodText);
    changeFood(0);
    
    resourceText = new PIXI.Text();
    resourceText.style = textStyle;
    resourceText.x = 45;
    resourceText.y = 76;
    gameScene.addChild(resourceText);
    changeResources(0);
    
    ////
    // Additional symbols (for popups when items are found when searching)
    foodSymbolPopup = PIXI.Sprite.fromImage('gameSprites/FoodIcon.png');
    foodSymbolPopup.anchor.set(.5, .5);
    foodSymbolPopup.height = foodSymbolPopup.height * (1/3);
    foodSymbolPopup.width = foodSymbolPopup.width * (1/3);
    gameScene.addChildAt(foodSymbolPopup, 2);
    foodSymbolPopup.visible = false;
    
    resourceSymbolPopup = PIXI.Sprite.fromImage('gameSprites/OtherResourcesIcon.png');
    resourceSymbolPopup.anchor.set(.5, .5);
    resourceSymbolPopup.height = resourceSymbolPopup.height * (1/3);
    resourceSymbolPopup.width = resourceSymbolPopup.width * (1/3);
    gameScene.addChildAt(resourceSymbolPopup, 2);
    resourceSymbolPopup.visible = false;
    
    keySymbolPopup = PIXI.Sprite.fromImage('gameSprites/Key.png');
    keySymbolPopup.anchor.set(.5, .5);
    keySymbolPopup.height = keySymbolPopup.height * (2/3);
    keySymbolPopup.width = keySymbolPopup.width * (2/3);
    gameScene.addChildAt(keySymbolPopup, 2);
    keySymbolPopup.visible = false;
    
    nothingTextPopup = new PIXI.Text("Nothing");
    nothingTextPopup.style = popupStyle;
    nothingTextPopup.anchor.set(.5, .5);
    gameScene.addChild(nothingTextPopup);
    nothingTextPopup.visible = false;
    
    lockedTextPopup = new PIXI.Text("Locked");
    lockedTextPopup.style = popupStyle;
    lockedTextPopup.anchor.set(.5, .5);
    gameScene.addChild(lockedTextPopup);
    lockedTextPopup.visible = false;
    ////
    
    // Game Over Scene
    let gameOverButton = PIXI.Sprite.fromImage('gameSprites/GameRetryText.png');
    gameOverButton.anchor.set(0.5);
    gameOverButton.interactive = true;
    gameOverButton.buttonMode = true;
    gameOverButton.x = sceneWidth / 2;
    gameOverButton.y = sceneHeight /2;
    gameOverButton.on("pointerup", toMainMenu);
    gameOverButton.on("pointerover", e=> {e.target.alpha = 0.8; e.target.height = e.target.height * 1.2; e.target.width = e.target.width * 1.2});
    gameOverButton.on("pointerout", e=> {e.currentTarget.alpha = 1.0; e.currentTarget.height = e.currentTarget.height * (5/6); e.currentTarget.width = e.currentTarget.width * (5/6)});
    gameOverScene.addChild(gameOverButton);
    
    // Game Win Scene
    let gameWinButton = PIXI.Sprite.fromImage('gameSprites/GamePlayAgainText.png');
    gameWinButton.anchor.set(0.5);
    gameWinButton.interactive = true;
    gameWinButton.buttonMode = true;
    gameWinButton.x = sceneWidth / 2;
    gameWinButton.y = sceneHeight / 2;
    gameWinButton.on("pointerup", toMainMenu);
    gameWinButton.on("pointerover", e=> {e.target.alpha = 0.8; e.target.height = e.target.height * 1.2; e.target.width = e.target.width * 1.2});
    gameWinButton.on("pointerout", e=> {e.currentTarget.alpha = 1.0; e.currentTarget.height = e.currentTarget.height * (5/6); e.currentTarget.width = e.currentTarget.width * (5/6)});
    gameWinScene.addChild(gameWinButton);
}

// Returns to the main menu
function toMainMenu(){
    startScene.visible = true;
    gameScene.visible = false;
    gameOverScene.visible = false;
    gameWinScene.visible = false;
}

// Starts the game scene and sets/resets game variables
function startGame(){
    paused = false;
    startScene.visible = false;
    gameScene.visible = true;
    gameOverScene.visible = false;
    gameWinScene.visible = false;
    keySymbol.visible = false;
    resourceSymbolPopup.visible = false;
    foodSymbolPopup.visible = false;
    keySymbolPopup.visible = false;
    time = 35;
    monstersTimer = 7;
    enemySpawnTimer = 1.5;
    keyPopupTimer = 0;
    foodPopupTimer = 0;
    resourcePopupTimer = 0;
    nothingTextPopupTimer = 0;
    lockedTextPopupTimer = 0;
    interactionCheck = true;
    interactionCheckTimer = 0;
    food = 0;
    resources = 0;
    foodText.text = food;
    resourceText.text = resources;
    key = false;
    win = false;
    player.x = sceneWidth/2;
    player.y = sceneHeight/2;
    
    // Create the ruins and interactables. These have randomized locations, with 3 of each in the level. Checks are made to ensure that they do not overlap one another.
    // The first interactable (the first chest) will always have the key put into it
    for (let i = 0; i < 3; i++){
        let randomx = Math.random() * (sceneWidth - 100) + 50;
        let randomy = Math.random() * (sceneHeight - 100) + 50;
        let chest = new ExaminableChest(randomx, randomy);
        examinables.push(chest);
        gameScene.addChildAt(chest, 1);
    }
    for (let i = 0; i < 3; i++){
        let randomx = Math.random() * (sceneWidth - 100) + 50;
        let randomy = Math.random() * (sceneHeight - 100) + 50;
        let pile = new ExaminablePile(randomx, randomy);
        examinables.push(pile);
        gameScene.addChildAt(pile, 1);
    }
    for (let i = 0; i < 3; i++){
        let randomx = Math.random() * (sceneWidth - 100) + 50;
        let randomy = Math.random() * (sceneHeight - 100) + 50;
        let ground = new ExaminableGround(randomx, randomy);
        examinables.push(ground);
        gameScene.addChildAt(ground, 1);
    }
    for (let i = 0; i < 3; i++){
        let randomx = Math.random() * (sceneWidth - 100) + 50;
        let randomy = Math.random() * (sceneHeight - 100) + 50;
        let ruin = new Ruin(randomx, randomy);
        ruins.push(ruin);
        gameScene.addChildAt(ruin, 1);
    }
    
    for(let e1 of examinables){
        for(let e2 of examinables){
            for(let r of ruins){
                if(e1 != e2){
                    while(rectsIntersect(e1, safeHaven) || rectsIntersect(e1, r) || rectsIntersect(e1, e2)){
                        e1.x = Math.random() * (sceneWidth - 100) + 50;
                        e1.y = Math.random() * (sceneHeight - 100) + 50;
                    }
                }
                else if (e1 == e2){
                    while(rectsIntersect(e1, safeHaven) || rectsIntersect(e1, r)){
                        e1.x = Math.random() * (sceneWidth - 100) + 50;
                        e1.y = Math.random() * (sceneHeight - 100) + 50;
                    }
                }
            }
        }
    }
    
    for(let r1 of ruins){
        for(let r2 of ruins){
            for(let e of examinables){
                if(r1 != r2){
                    while(rectsIntersect(r1, safeHaven) || rectsIntersect(r1, e) || rectsIntersect(r1, r2)){
                        r1.x = Math.random() * (sceneWidth - 100) + 50;
                        r1.y = Math.random() * (sceneHeight - 100) + 50;
                    }
                }
                else if (r1 == r2){
                    while(rectsIntersect(r1, safeHaven) || rectsIntersect(r1, e)){
                        r1.x = Math.random() * (sceneWidth - 100) + 50;
                        r1.y = Math.random() * (sceneHeight - 100) + 50;
                    }
                }
            }
        }
    }
    
    examinables[0].resource = false;
    examinables[0].food = false;
    examinables[0].key = true;
    examinables[0].locked = true;
    let randomE = Math.round(1 + (Math.random() * 7));
    examinables[randomE].resource = true;
    examinables[randomE].food = false;
}

// Ends the game scene, clearing out the arrays for enemies (if there are any) and the interactables
function endGame(){
    paused = true;
    
    // Clear out the level
    examinables.forEach(e => gameScene.removeChild(e));
    examinables = [];
    
    ruins.forEach(r => gameScene.removeChild(r));
    ruins = [];
    
    fireMonsters.forEach(m => m.deleteLight());
    fireMonsters.forEach(m => gameScene.removeChild(m));
    fireMonsters = [];
    
    gameScene.visible = false;
    
    if(win){
        gameWinScene.visible = true;
    }else{
        gameOverScene.visible = true;
    }
}

// Changes the value of the time based on passed in value
function changeTime(value){
    time += value;
    timeText.text = Math.round(time);
}

function changeMonsterTimer(value){
    monstersTimer += value;
    if(monstersTimer < -8)
        monstersTimer = 6;
}

function changeMonsterSpawnTimer(value){
    enemySpawnTimer += value;
    if(enemySpawnTimer <= 0)
        enemySpawnTimer = 1.5;
}

// Change the value of the food variable based on passed in value
function changeFood(value){
    food += value;
    foodText.text = food;
}

// Change the value of the resources variable based on passed in value
function changeResources(value){
    resources += value;
    resourceText.text = resources;
}

// Spawns a monster at one of 6 locations (3 on the left and 3 on the right sides of the screen) and adds it to the monsters array
function spawnMonster(){
    let rand = Math.random();
    
    if(rand <= .165){
        let fm = new FireMonster(-30, sceneHeight, fireMonsterTextures);
        fireMonsters.push(fm);
        gameScene.addChild(fm);
    }else if(rand <= .33){
        let fm = new FireMonster(-30, sceneHeight/3, fireMonsterTextures);
        fireMonsters.push(fm);
        gameScene.addChild(fm);
    }else if(rand <= .495){
        let fm = new FireMonster(-30, sceneHeight*(2/3), fireMonsterTextures);
        fireMonsters.push(fm);
        gameScene.addChild(fm);
    }else if(rand <= .66){
        let fm = new FireMonster(sceneWidth + 30, sceneHeight, fireMonsterTextures);
        fireMonsters.push(fm);
        gameScene.addChild(fm);
    }else if(rand <= .825){
        let fm = new FireMonster(sceneWidth + 30, sceneHeight/2, fireMonsterTextures);
        fireMonsters.push(fm);
        gameScene.addChild(fm);
    }else if(rand <= 1){
        let fm = new FireMonster(sceneWidth + 30, sceneHeight*(2/3), fireMonsterTextures);
        fireMonsters.push(fm);
        gameScene.addChild(fm);
    }
}

function fadeAnim(x, y){
    let fadeAnim = new PIXI.extras.AnimatedSprite(fireMonsterFadeTextures);
    fadeAnim.anchor.set(.5, .5);
    fadeAnim.x = x;
    fadeAnim.y = y;
    fadeAnim.animationSpeed = .1;
    fadeAnim.loop = false;
    fadeAnim.onComplete = e=>gameScene.removeChild(fadeAnim);
    fireMonsterFadeAnims.push(fadeAnim);
    gameScene.addChild(fadeAnim);
    fadeAnim.play();
}

/////////////////////////////////////////////////////
// The game's main loop
function gameLoop(){
	if (paused) 
        return;
    
	// Calculate "delta time" and update timers
	let dt = 1/app.ticker.FPS;
    if (dt > 1/12) dt=1/12;
    
    changeTime(-dt);
    changeMonsterTimer(-dt);
    
    if(resourceSymbolPopup.visible){
        resourcePopupTimer+=dt;
        resourceSymbolPopup.x = player.x;
        resourceSymbolPopup.y = player.y - (player.height * 7/8);
        if(resourcePopupTimer >= .4){
            resourceSymbolPopup.visible = false;
            resourcePopupTimer = 0;
        }
    }
    if(foodSymbolPopup.visible){
        foodPopupTimer+=dt;
        foodSymbolPopup.x = player.x;
        foodSymbolPopup.y = player.y - (player.height * 3/4);
        if(foodPopupTimer >= .4){
            foodSymbolPopup.visible = false;
            foodPopupTimer = 0;
        }
    }
    if(keySymbolPopup.visible){
        keyPopupTimer+=dt;
        keySymbolPopup.x = player.x;
        keySymbolPopup.y = player.y - (player.height * 3/4);
        if(keyPopupTimer >= .4){
            keySymbolPopup.visible = false;
            keyPopupTimer = 0;
        }
    }
    if(nothingTextPopup.visible){
        nothingTextPopupTimer+=dt;
        nothingTextPopup.x = player.x;
        nothingTextPopup.y = player.y - (player.height * 3/4);
        if(nothingTextPopupTimer >= .4){
            nothingTextPopup.visible = false;
            nothingTextPopupTimer = 0;
        }
    }
    if(lockedTextPopup.visible){
        lockedTextPopupTimer+=dt;
        lockedTextPopup.x = player.x;
        lockedTextPopup.y = player.y - (player.height * 3/4);
        if(lockedTextPopupTimer >= .4){
            lockedTextPopup.visible = false;
            lockedTextPopupTimer = 0;
        }
    }
    
    if(interactionCheck == false){
        interactionCheckTimer+=dt;
        if(interactionCheckTimer >= .4){
            interactionCheck = true;
            interactionCheckTimer = 0;
        }
    }
    
    // Checks if the player is hidden. If not, the player will be both visible and able to move
    if (player.hidden == false)
        {
            player.visible = true;
            // Check key presses and check for player animation
            if(keys[keyboard.D]){
                player.dx = player.speed;
                player.faceRight = true;
                player.faceLeft = false;
                leftAndRightKeys = true;
            }else if(keys[keyboard.A]) {
                player.dx = -player.speed;
                player.faceLeft = true;
                player.faceRight = false;
                leftAndRightKeys = true;
            }else{
                player.dx = 0;
                leftAndRightKeys = false;
            }

            if(keys[keyboard.S]){
                player.dy = player.speed;
                upAndDownKeys = true;
            }else if(keys[keyboard.W]) {
                player.dy = -player.speed;
                upAndDownKeys = true;
            }else{
                player.dy = 0;
                upAndDownKeys = false;
            }

            if(upAndDownKeys || leftAndRightKeys){
                player.beginAnim();
            }else{
                player.stopAnim();
            }
        }else{
            player.dx = 0;
            player.dy = 0;
        }
		
    // Move player, and keep them on-screen using clamp.
    player.updatePlayerPos(dt);
    let w2 = player.width/2;
    let h2 = player.height/2;
    player.x = clamp(player.x, 0+w2, sceneWidth-w2);
    player.y = clamp(player.y, 0+h2, sceneHeight-h2);
    
    // Player interaction check with object
    if(interactionCheck){
        if(keys[keyboard.Space]){
            for(let e of examinables){
                if(rectsIntersect(player, e)){
                    e.searched = true;
                    if(e.key == false && e.food == false && e.resource == false){
                        nothingTextPopup.visible = true;
                        nothingTextPopup.x = player.x;
                        nothingTextPopup.y = player.y - (player.height * 3/4);
                    }
                    if(e.resource){
                        e.resource = false;
                        changeResources(1);
                        resourceSymbolPopup.visible = true;
                        resourceSymbolPopup.x = player.x;
                        resourceSymbolPopup.y = player.y - (player.height * 7/8);
                    }
                    if(e.food){
                        e.food = false;
                        changeFood(1);
                        foodSymbolPopup.visible = true;
                        foodSymbolPopup.x = player.x;
                        foodSymbolPopup.y = player.y - (player.height * 3/4);
                    }
                    if(e.key && resources >= 1){
                        changeResources(-1);
                        e.locked = false;
                        e.key = false;
                        key = true;
                        keySymbolPopup.visible = true;
                        keySymbolPopup.x = player.x;
                        keySymbolPopup.y = player.y - (player.height * 3/4);
                    }else if(e.key && resources == 0 && e.locked){
                        lockedTextPopup.visible = true;
                        lockedTextPopup.x = player.x;
                        lockedTextPopup.y = player.y - (player.height * 3/4);
                    }
                }
            }

            for(let r of ruins){
                if(rectsIntersect(player, r)){
                    if(r.locked){
                        if(resources >= 1){
                            changeResources(-1);
                            player.hidden = true;
                            player.visible = false;
                            r.locked = false;
                        }else{
                            lockedTextPopup.visible = true;
                            lockedTextPopup.x = player.x;
                            lockedTextPopup.y = player.y - (player.height * 3/4);
                        }
                    }else if(r.locked == false){
                        player.hidden = true;
                        player.visible = false;
                    }
                }
            }

            if(rectsIntersect(player, safeHaven) && key){
                win = true;
                endGame();
                return;
            }else if(rectsIntersect(player, safeHaven)){
                lockedTextPopup.visible = true;
                lockedTextPopup.x = player.x;
                lockedTextPopup.y = player.y - (player.height * 3/4);
            }
            
            interactionCheck = false;
        }
        
        // Button press to exit ruins/hiding
        if(keys[keyboard.E]){
            if(player.hidden)
                player.hidden = false;
            
            interactionCheck = false;
        }
        
        // Button press to consume food. Slightly extends survival time
        if(keys[keyboard.F]){
            if(food > 0){
                changeFood(-1);
                changeTime(5);
            }
            
            interactionCheck = false;
        }
    
    }
    
    // Check for key
    if(key)
        keySymbol.visible = key;
    
    // Spawn enemies if monstersTimer is below 0, and also keep track of when to spawn enemies periodically using the spawn timer
    if(monstersTimer <= 0){
        if(enemySpawnTimer == 1.5){
            spawnMonster();
        }
        nightOverlay.visible = true;
        changeMonsterSpawnTimer(-dt);
    }else if(monstersTimer > 0){
        fireMonsters.forEach(m => fadeAnim(m.x, m.y));
        fireMonsters.forEach(m => gameScene.removeChild(m));
        fireMonsters.forEach(m => m.deleteLight());
        fireMonsters = [];
        nightOverlay.visible = false;
    }
    
    // Update monsters position/movement (seek the player or wander the map)
    if(player.hidden){
        // Randomly determines what object the monster will seek when the player is hidden. First roll is to decide which array to check, second roll is to pick an item from the chosen array
        for(let m of fireMonsters){
            let r1 = Math.random();
            let target;
            if(m.target == null){
                if(r1 <= .49){
                    let r2 = Math.random() * 2;
                    target = ruins[Math.round(r2)];
                    m.target = target;
                }else if(r1 <= 1.00){
                    let r2 = Math.random() * 8;
                    target = examinables[Math.round(r2)];
                    m.target = target;
                }
            }else{
                if(rectsIntersect(m, m.target))
                    m.target = null;
            }
            
            if(m.target)
                m.wander(m.target, dt);
        }
    }else{
        for(let m of fireMonsters){
            m.seek(player, dt);
        }
    }
    
    // Player collision check with enemies
    if(player.hidden == false){
        for(let m of fireMonsters){
            if(rectsIntersect(player, m)){
                endGame();
                return;
            }
        }
    }
    
    // Clean fade animations
    fireMonsterFadeAnims.filter(e=>e.playing)
    
    // Check main game timer (survival time)
    if (time <= 0){
        endGame();
        return;
    }
}
/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Spritesheet-related methods
function loadSpriteSheetCharacter(){
    let spriteSheet = PIXI.BaseTexture.fromImage("gameSprites/Character.png");
    let width = 22;
    let height = 36;
    let numFrames = 12;
    let textures = [];
    for (let i=0; i<numFrames; i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 0, width, height));
        textures.push(frame);
    }
    return textures;
}

function loadSpriteSheetFireMonster(){
    let spriteSheet = PIXI.BaseTexture.fromImage("gameSprites/FireMonster.png");
    let width = 34;
    let height = 48;
    let numFrames = 6;
    let textures = [];
    for (let i=0; i<numFrames; i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 0, width, height));
        textures.push(frame);
    }
    return textures;
}

function loadSpriteSheetFireMonsterFade(){
    let spriteSheet = PIXI.BaseTexture.fromImage("gameSprites/FireMonsterFade.png");
    let width = 34;
    let height = 48;
    let numFrames = 5;
    let textures = [];
    for (let i=0; i<numFrames; i++){
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 0, width, height));
        textures.push(frame);
    }
    return textures;
}
/////////////////////////////////////////////////////