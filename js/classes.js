class Character extends PIXI.extras.AnimatedSprite{
    constructor(x=0, y=0, charTextures){
        super(charTextures);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.speed = 63;
        this.faceRight = false;
        this.faceLeft = true;
        this.hidden = false;
        this.moving = false;
        this.animationSpeed = .2;
        this.loop = false;
        
        // other properties
		this.dx = 0; // per second
		this.dy = 0; // per second
    }
    
    // Updates player position
    updatePlayerPos(dt){
        if(this.faceRight){
            this.scale.x = -1;
        }else{
            this.scale.x = 1;
        }
		this.x += this.dx * dt;
		this.y += this.dy * dt;
	}
    
    beginAnim(){
        this.loop = true;
        this.play();
    }
    
    stopAnim(){
        this.loop = false;
        this.gotoAndStop(0);
    }
}

class FireMonster extends PIXI.extras.AnimatedSprite{
    constructor(x=-10, y=-10, monTextures){
        super(monTextures);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.moveSpeed = 67;
        this.faceRight = false;
        this.faceLeft = true;
        this.animationSpeed = .1;
        this.loop = true;
        this.play();
        this.light;
        this.target = null;
        let ambientLight = new PIXI.Sprite(PIXI.loader.resources["gameSprites/EnemyAmbientLight.png"].texture);
        ambientLight.anchor.set(.5, .5);
        ambientLight.x = this.x;
        ambientLight.y = this.y;
        this.light = ambientLight;
        gameScene.addChild(ambientLight);
        
        // other properties
		this.dx = 0; // per second
		this.dy = 0; // per second
    }
    
    // Seeks the passed in target
    seek(target, dt){
        this.dx = Math.sign(target.x - this.x) * this.moveSpeed;
        this.dy = Math.sign(target.y - this.y) * this.moveSpeed;
        this.x += this.dx * dt;
		this.y += this.dy * dt;
        this.light.x = this.x;
        this.light.y = this.y;
    }
    
    // Wanders when the player is hidden - seeks random objects in the world. Exactly the same, just named differently for clarity's sake
    wander(target, dt){
        this.seek(target, dt);
    }
    
    deleteLight(){
        gameScene.removeChild(this.light);
        delete this.light;
    }
}

class ExaminablePile extends PIXI.Sprite{
    constructor(x=0, y=0){
        super(PIXI.loader.resources["gameSprites/ExaminablePile.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.searched = false;
        this.resource = false;
        this.food = false;
        this.key = false;
        
        let typeNum = Math.random();
        if (typeNum < .5)
            this.resource = true;
        else if (typeNum < .7)
            this.food = true;
    }
}

class ExaminableChest extends PIXI.Sprite{
    constructor(x=0, y=0){
        super(PIXI.loader.resources["gameSprites/ExaminableChest.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.searched = false;
        this.resource = false;
        this.food = false;
        this.key = false;
        this.locked = false;
        
        let typeNum = Math.random();
        if (typeNum < .5)
            this.resource = true;
        else
            this.food = true;
    }
}

class ExaminableGround extends PIXI.Sprite{
    constructor(x=0, y=0){
        super(PIXI.loader.resources["gameSprites/ExaminableGround.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.searched = false;
        this.resource = false;
        this.food = false;
        this.key = false;
        
        let typeNum = Math.random();
        if (typeNum < .4)
            this.resource = true;
        else if (typeNum < .6)
            this.food = true;
    }
}

class SafeHaven extends PIXI.Sprite{
    constructor(x=0, y=0){
        super(PIXI.loader.resources["gameSprites/SafeHaven.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
    }
}

class Ruin extends PIXI.Sprite{
    constructor(x=0, y=0){
        super(PIXI.loader.resources["gameSprites/Ruins.png"].texture);
        this.anchor.set(.5, .5);
        this.x = x;
        this.y = y;
        this.locked = true;
    }
}
