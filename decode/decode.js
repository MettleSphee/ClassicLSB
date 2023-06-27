function ImgDraw(imageBase64){ //Load the image from Base64, 
	var img = new Image();
	img.onload = function() {
		document.getElementById("canv1").width = img.width;
		document.getElementById("canv1").height = img.height;
		var canvas = document.getElementById("canv1").getContext('2d').drawImage(img,0,0);
		//then use a canvas to load the pixels (works to decode any format that is an image)
	}
	img.src = imageBase64;
}

function previewFile() {
  const preview = document.querySelector("img");
  const file = document.querySelector("input[type=file]").files[0];
  const reader = new FileReader();
  reader.addEventListener("load",() => { //when the image is loaded, draw it
	  ImgDraw(reader.result);
	  preview.src = reader.result;
	  preview.hidden=0;
    }, false);

  if (file) {
    reader.readAsDataURL(file); //but read it from base64, then display pretty interface
	document.getElementById("awaiting").innerHTML="<h3>Image preview:</h3>";
	document.getElementById("buttonChoice").hidden=0;
  }
}

//init with chosen bit value and color channel choices from browser
function selectedInit(){
	mainArrange(document.getElementById("op1").value,
	document.getElementById("op2").value,
	document.getElementById("op3").value,
	document.getElementById("op4").value,
	document.getElementById("selectedBit").value);
}

//the heart of the decoder, somehow badly optimised but it works perfectly otherwise
function mainDecode(arg){ /// argument.length === 8 !!!!!!
	var charToAdd = String.fromCharCode(parseInt(arg,2));
	var CharCodeCheck=charToAdd.charCodeAt(0);
	if ( (CharCodeCheck>=32 && CharCodeCheck<=126) || (CharCodeCheck>=128 && CharCodeCheck<=168) ) {
		//check if it's a "readable" character, show it if yes
		return charToAdd;
	}
	return ""; ///either is a valid char and returns it, or returns nothing at all
}

//but before we play with the "heart", we have to initialize a few values first
function mainArrange(op1,op2,op3,op4,bitNumber){ ///we have values of 1,2,3,4 or BLANK.
	document.getElementById("toMain").value=""; //we get these values into a string because weird JS
	var mainNumStr=""+op1+op2+op3+op4; //string for the coming values.
	var mainNumber=parseInt(mainNumStr); //also as an INTEGER because weird JS
	var mainBin="",mainText="";
	//and here begins the steganalysis process
	var canvas = document.getElementById("canv1"); //start with the canvas
	var imageData=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data; //load the data
	var bitValue = Math.pow(2,bitNumber); //also init the bit value because I FORGOT
	var valueToAdd=""; //one more init
	
	//here's how the process mostly works:
	//bitX = Int(colorX / ( Math.pow(2,bitNumber) ) )%2
	//where colorX == imageData[i-1+int(mainNumber/(10^(4-digitNumber) )%10]
	
	///Here, we're parsing each pixel by the selected colors and extracting the desired bit.
	for (var i=0; i<imageData.length; i+=4){
		switch (mainNumStr.length){
			///The number is ordered 1234, you start to add from the MSB(order, left-to-right etc);
			case 4: //length=4
				document.getElementById("toMain").value+=parseInt(imageData[i-1+parseInt(mainNumber/1000%10)] / bitValue)%2; //1
				///go through each case without breaking if it's big enough. If it's small, it will be faster to reach break;
			case 3:
				document.getElementById("toMain").value+=parseInt(imageData[i-1+parseInt(mainNumber/100%10)] / bitValue)%2; //2
			case 2:
				document.getElementById("toMain").value+=parseInt(imageData[i-1+parseInt(mainNumber/10%10)] / bitValue)%2; //3
			case 1:
				document.getElementById("toMain").value+=parseInt(imageData[i-1+parseInt(mainNumber%10)] / bitValue)%2; //4
			break;
		}
	}
	
	//I setup a very nice Hex View. It's similar to a lot of Hex Editor programs available on the internet.
	//You *can* edit the values generated, but they won't automatically update everywhere.
	//That's why I said it's a Hex VIEW. Anyways, thanks to jQuery, it syncs the scrolls with the other views.
	//we start with the inits...
	var hexcounter=0, hexRowCount=1;
	var hexTwo="";
	document.getElementById("hexDecodedView").value="";
	document.getElementById("hexView").value="";
	document.getElementById("hexOffsetH").value="00000000";
	document.getElementById("stringsOutput").value="";
	
	//then we go on with the magic
	do {
		mainBin=document.getElementById("toMain").value.substr(0,8);
		//we take the value, then convert it into an ascii character;
		var numToAdd= parseInt(mainBin,2)
		//if it's "unreadable", we show it in the hexView as a period;
		if ( (numToAdd>=0 && numToAdd<=31) || (numToAdd>=127 && numToAdd<=159) ){
			document.getElementById("hexDecodedView").value+=".";
		}
		//otherwise, we add it as a functional character;
		else{
			document.getElementById("hexDecodedView").value+=String.fromCharCode(numToAdd);
		}
		//if it's "readable", we add it to the Strings output too (aka any potential readable text to decypher further)
		if (!( (numToAdd>=0 && numToAdd<=31 && (numToAdd!=10)) || (numToAdd>=127 && numToAdd<=159) )){
			document.getElementById("stringsOutput").value+=mainDecode(mainBin);
		}
		//then we generate the next hex values for each character;
		hexTwo="00"+numToAdd.toString(16);
		hexTwo=hexTwo.slice(-2).toUpperCase();
		document.getElementById("hexView").value+=hexTwo;
		hexcounter++;
		if (hexcounter==16){//if we have 16 bytes (or 32 hex characters minus the spaces)
			document.getElementById("hexView").value+="\n"; //new row for the hexview
			document.getElementById("hexDecodedView").value+="\n"; //new row for the decoded view;
			hexcounter=0; //reset the counter
			document.getElementById("hexOffsetH").value+="\n"; //new row for the offset view
			//and then add the new offset row in the hexview (+16 bytes)
			var hexRow=('00000000'+ hexRowCount.toString(16).toUpperCase() + '0').slice(-8);
			hexRowCount++; //increment the row count;
			document.getElementById("hexOffsetH").value+=hexRow;
		}
		//if it's not then just add a new space in the hex view to separate the bytes;
		else document.getElementById("hexView").value+=" ";
		//cut the 8 bits that were just used;
		document.getElementById("toMain").value=document.getElementById("toMain").value.substr(8);
		
	} while (document.getElementById("toMain").value.length>=8);
	//all of this while we have atleast 8 bits to add;
	//if there's less than 8 bits then close it.
	
	if (document.getElementById("toMain").value.length>0){
		///failsafe for any forgotten bits, convert those too cuz who knows
		document.getElementById("stringsOutput").value+=mainDecode(mainBin);
		///but unfortunately they won't be put inside the hexview;
	}
	
	//if there's no strings, output the according message;
	if (document.getElementById("stringsOutput").value.length==0){
		document.getElementById("stringsOutput").value="No readable strings found! ";
	}
	syncScrolls(); //call the syncScrolls function for the hex views, which is defined in the HTML itself (it uses jQuery)
	document.getElementById("textOutput").hidden=0; //Show the world the entire magic!
}
