const keyboard = Object.freeze({
	W: 		87,
	A: 		65,
	S: 		83, 
	D: 		68,  
	F: 		70,
    E:      69,
    Space: 	32
});

// this is the "key daemon" that we poll every frame
const keys = [];

window.onkeyup = (e) => {
//	console.log("keyup=" + e.keyCode);
	keys[e.keyCode] = false;
	e.preventDefault();
};

window.onkeydown = (e)=>{
//	console.log("keydown=" + e.keyCode);
	keys[e.keyCode] = true;
	
	// checking for other keys - ex. 'p' and 'P' for pausing
	var char = String.fromCharCode(e.keyCode);
	if (char == "p" || char == "P"){
		// do something
	}
};