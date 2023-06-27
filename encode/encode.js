function ImgDraw(imageBase64){
	var img = new Image(); //On image load:
	img.onload = function() { //Canvas 1 is initiated
		document.getElementById("canv1").width = img.width;
		document.getElementById("canv1").height = img.height;
		document.getElementById("canv1").getContext('2d').drawImage(img,0,0);
		//Loaded image is drawn on Canvas 1, then HTML is generated below for correct information
		document.getElementById("positionDetailsDisplay").innerHTML="Image resolution: "
		+ img.width + "x"+img.height+"px<br>Maximum insertable ASCII characters: "
		+ (img.width * img.height  / 2) + " in all 4 RGBA color options (2px per char)<br><b>"
		+ "All values start from top-left corner!</b><br>Pixel count starts from 1,"
		+ "Left to Right then down one row.<br>Pixel number MUST be odd.<br>"
		+ 'Row number: <input type="number" id="xPos" min="1" value="1" max=""><br>'
		+ 'Column number: <input type="number" id="yPos" name="quantity" min="1" value="1" max="">';
		///After HTML is generated, the maximum values
		///(and Canvas 2, the output) are populated with new information;
		document.getElementById("xPos").max=img.width;
		document.getElementById("yPos").max=img.height;
		document.getElementById("canv2").width = img.width;
		document.getElementById("canv2").height = img.height;
	}
	img.src = imageBase64; //load the actual image
}

function previewFile() { //When base image is "uploaded"
  const preview = document.querySelector("img");
  const file = document.querySelector("input[type=file]").files[0];
  const reader = new FileReader();
  reader.addEventListener("load",() => { //Listener for making sure the image is uploaded
	  ImgDraw(reader.result); //When the image is loaded, set the details in the function above
	  preview.src = reader.result; //passed through base64 encoding
	  preview.hidden=0; ///the base image preview is shown
    }, false);

  if (file) {
    reader.readAsDataURL(file); //when file exists, read it as base64 DataURL, then show pretty interface
	document.getElementById("awaiting").innerHTML="<h3>Image preview:</h3>";
	document.getElementById("buttonChoice").hidden=0; //unveil the interface
  }
}

function selectedInit(){ //initiating the encoder when it's called
	var pixelPos=(
	parseInt(document.getElementById("yPos").value-1)
	+(parseInt(document.getElementById("canv1").width)
		* parseInt(document.getElementById("xPos").value-1)
	));
	//you CAN start the steganographic algorithm from a specific pixel,
	//making it slightly harder to crack due to the unconventionality of such a measure
	mainEncode(
	document.getElementById("op1").value,
	document.getElementById("op2").value,
	document.getElementById("op3").value,
	document.getElementById("op4").value,
	document.getElementById("selectedBit").value,
	document.getElementById("inputText").value,
	pixelPos);
}

//compare bits for changing, returns 0 for unchanged, 2 for decrease, 1 for increase
function bitCompare(currentBit, replacementBit) {
	if (currentBit==replacementBit) return 0;
	if (currentBit >replacementBit) return 2;
	if (currentBit <replacementBit) return 1;
}


///We first init the main values in the function, it is ugly but I'm too lazy to clean/optimize it because it works
function mainEncode(op1,op2,op3,op4,bitNumber,textString,pixelPosition){ ///we have values of 1,2,3,4 or BLANK (the chosen BITS)
	document.getElementById("binStore").value="";
	var mainNumStr=""+op1+op2+op3+op4; //string for the coming values, turn it into a string because weird code misbehaving
	var mainNumber=parseInt(mainNumStr); //also store it as an int
	//prepare to alter base image
	var canvas = document.getElementById("canv1"); 
	var imgDataTest=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
	var imageData=imgDataTest.data;
	
	//get all characters into binary ASCII code
	for (let i=0; i<textString.length; i++){ 
		//each letter in the text to insert, converted to binary then put in a separate storage
		document.getElementById("binStore").value+=((("00000000")+((textString[i].charCodeAt(0) >>> 0).toString(2))).slice(-8))+",";
		//for some reason HTML storage is much more responsive instead of JS memory, atleast in Chromium
		
	}
	
	//finish the inits/declarations
	var bitValue = Math.pow(2, parseInt(bitNumber)); //2^bitNumber for the selected bit
	var currentVal=0, newVal=0, currentPos=0, digitLSB=0; //init values
	var currentRgbaPos=(pixelPosition*4)-1; //init pixel/rgba position
	
	//start working on the alterations
	function nextIter(){ //function that works on each "iteration" of values
		currentPos=currentRgbaPos+digitLSB; //get position values
		currentVal=parseInt(imgDataTest.data[currentPos] / bitValue)%2; //get bit value
		if (document.getElementById("binStore").value.slice(0,1)==','){
			document.getElementById("binStore").value=document.getElementById("binStore").value.slice(1);
		}
		//if the next digit in the value is a comma, then delete the comma and move on;
		newVal=parseInt(document.getElementById("binStore").value.slice(0,1));
		//get the new value off the stored digits then compare it as defined in bitCompare;
		switch (bitCompare(currentVal, newVal)){
			case 0: break;
			case 1: imgDataTest.data[currentPos]+=bitValue; break;
			case 2: imgDataTest.data[currentPos]-=bitValue; break;
			case undefined: break;
		}
		//after operation, remove used digit;
		document.getElementById("binStore").value=document.getElementById("binStore").value.slice(1);
	}
	
	//with the iteration function defined, parse through all of the values in the defined bit order;
	//If it's more than one digit, then keep going through each case as needed;
	//Makes the code more clean and slightly more efficient;
	//The order is defined in the codes, in a Left-To-Right order, 1-4 (in the case of 4 digits)
	while (document.getElementById("binStore").value.length!=0){
		switch (mainNumStr.length){
			case 4: 
				///if the text is empty, BREAK all the time, speeding up the process
				///by not doing anything for the rest of the image (and not wasting any performance)
				if (document.getElementById("binStore").value.length==0) break;
				//otherwise get the LSB digit,
				digitLSB=parseInt(mainNumber/1000%10);
				//then WORK ON IT!
				nextIter(); //1
			case 3:
				if (document.getElementById("binStore").value.length==0) break;
				digitLSB=parseInt(mainNumber/100%10);
				nextIter(); //2
			case 2:
				if (document.getElementById("binStore").value.length==0) break;
				digitLSB=parseInt(mainNumber/10%10);
				nextIter(); //3
			case 1:
				if (document.getElementById("binStore").value.length==0) break;
				digitLSB=parseInt(mainNumber%10);
				nextIter(); //4
			break;
		}
		currentRgbaPos+=4; //move to next pixel
	}
	
	
	///create new image,
	var newCanvas=document.createElement("canvas");
	newCanvas.height = canvas.height;
	newCanvas.width = canvas.width;
	//get the modified image data,
	newCanvas.getContext('2d').putImageData(imgDataTest,0,0);
	//then draw it
	document.getElementById("canv2").getContext('2d').drawImage(newCanvas,0,0);
	document.getElementById("imageOutput").hidden=0;
	//also download it if you want to.
	document.getElementById("downloadEncoded").href=newCanvas.toDataURL();
}
