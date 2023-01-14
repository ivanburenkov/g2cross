/*   This file is part of photonic tools project
 *
 *   Copyright (C) 2023 Ivan Burenkov - All Rights Reserved
 *   You may use, distribute and modify this code under the
 *   terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 *   Please refer to ivanburenkov.github.io if using results obtained with this software in your publications.
 */
/////////////////////////////////////////////////////////////////////////////////////////////////////////

function init() {
  //Pth = Module.cwrap("Pt", "number", ["number", "number", "number", "number"]);
  calcg2 = Module.cwrap("g2calc", "number", [
    "number",
    "number",
    "number",
    "number",
    "number"
  ]);
}
window.onload = init();
function cArray(size) {
  var offset = Module._malloc(size * 8);
  Module.HEAPF64.set(new Float64Array(size), offset / 8);
  return {
    data: Module.HEAPF64.subarray(offset / 8, offset / 8 + size),
    offset: offset,
    size: size
  };
}
function cFree(cArrayVar) {
  Module._free(cArrayVar.offset);
}
function cArrayInt(size) {
  const nBytes = Int32Array.BYTES_PER_ELEMENT;
  const offset = Module._malloc(size * nBytes);
  return {
    data: Module.HEAP32.subarray(offset / nBytes, offset / nBytes + size),
    offset: offset,
    size: size
  };
}
/* 
//This function executes code when WASM has finished loading
Module["onRuntimeInitialized"] = function () {
  //console.log("wasm loaded");
  //runCcode();
};
 */
//Global vars
var tsvG2Values = "";
var t0; // = performance.now()
var t1; // = performance.now()
var dataLength;
var tmult;
var tres;
var ch1;
var ch2;
var norm=1;
var islog=0;
var isnorm=0;
var iserr=0;
var myArray;
var arraySize=599;
var c;
var firstRun=1;
var syncT=1.;

document.getElementById('inputfile') 
			.addEventListener('change', function() {
        //var name = document.getElementById('inputfile').files.item(0).name;  
        //alert('Selected file: ' + name.files.item(0).name);
        var file = inputfile.files[0];
        //console.log(file);
			var fr=new FileReader; 
			fr.onload=function(){ 
				var data = new Uint8Array(fr.result);
        filesize=file.size;
        console.log(data);
        Module['FS_createDataFile']('/', 'data.ptu', data, true, true, true);
        //Module.ccall('cFread', null, ['number'], filesize);
        
        //jsFread(filesize);

        inputfile.value = '';
			} 
      fr.onprogress = function(data) {
		if (data.lengthComputable) {                                            
		  var valeur= Math.round((data.loaded * 100) / data.total);
		  $('.progress-bar').css('width', valeur+'%').attr('aria-valuenow', valeur);
      if(data.loaded == data.total)showonlyID('g2controls');
		    //console.log(progress);
		}
	      }					
          document.getElementById('fileLoaded').innerHTML="Now, please, set desired parameters and hit 'Calculate!' button.";
			//fr.readAsText(this.files[0]); 
      dataready=true;
      fr.readAsArrayBuffer(file);
      //init();
	    //showonlyID('g2controls');
		}) 


function runCcodeG2() {
  showonlyID('calcNote');
  document.getElementById('fileLoaded').innerHTML="Calculating ... <div class='spinner-border' role='status'>  <span class='visually-hidden'>Loading...</span></div>";
  document.getElementById('calcButton').innerHTML="Calculating ... <div class='spinner-border' role='status'>  <span class='visually-hidden'>Loading...</span></div>";
  setTimeout(function(){runCcodeG2true();},100);
}
function runCcodeG2true() {
  t0 = performance.now();

  myArrayg2 = cArrayInt(arraySize);
  //tmult = document.getElementById("sLoss").value;
  tres = document.getElementById("tRes").value;
  ch1 = document.getElementById("ch1").value;
  ch2 = document.getElementById("ch2").value;
  tmult=1;
  //tres=1;
  var binconversion = tmult/tres;
  //console.log(binconversion);
  //console.log(HEAPF64[(myArray.offset)/8],HEAPF64[(myArray.offset)/8+width*height-1],HEAP32[(myArrayg2.offset)/4],HEAP32[(myArrayg2.offset)/4+598]);
  //console.log(myArray,width*height,binconversion,myArrayg2,norm);
  syncT=calcg2(ch1,ch2,tres,myArrayg2.offset,norm);
  syncT=1./syncT;
 // console.log(myArray,width*height,binconversion,myArrayg2,norm);
  //console.log(HEAPF64[(myArray.offset)/8],HEAPF64[(myArray.offset)/8+width*height-1],HEAP32[(myArrayg2.offset)/4],HEAP32[(myArrayg2.offset)/4+598]);
  //document.getElementById('plotlyDiv').innerHTML="<h2>Reconstructed data</h2><span id='plotlyDivG2'></span>";
  produceOutput('plotlyDiv',arraySize,myArrayg2,islog,isnorm,iserr);
  //showonlyID('calcButton');
  document.getElementById('calcButton').innerHTML="Calculate";
  t1 = Math.floor(performance.now() - t0);
if(firstRun==1){
  hideonlyID('fitIntro');
  showonlyID('tsvdata');
  showonlyID('LogScale');		
  showonlyID('NormG2');
  showonlyID('HideErr');
	firstRun=0;
}
  document.getElementById("timing").innerHTML = "Done in " + t1 + " ms";
}
function mean50(dataCArray){
  let sum=0;
  for(i = 0; i < 50; i++){
    sum+=dataCArray.data[i];
  }
  return sum/50;
}

function produceOutput(divName,sizeXY,dataCArray,islog,isnorm,iserr){
  let nn=sizeXY;
  var g2Values = [];
  var tValues = [];
  var g2ValuesErr = [];
  tsvG2Values = "";
  var tunit;
  var tunitmul;
  if(1000000000*syncT*tres<10){
    tunit="ns";
    tunitmul=1;
  } else {
    if(1000000000*syncT*tres<10000){
      tunit="us";
      tunitmul=1000;
    } else {
      if(1000000000*syncT*tres<10000000){
        tunit="ms";
        tunitmul=1000000;
      }
    }
  }
  if(isnorm==1)norm=mean50(dataCArray);
  for (i = 0; i < nn; i++) {
    if(isnorm==1){
      tValues[i]=(i-arraySize/2)*1000000000*syncT*tres/tunitmul;
      g2Values[i] = dataCArray.data[i]/norm;
      g2ValuesErr[i]=Math.sqrt(g2Values[i]/norm);
    } else {
      tValues[i]=(i-arraySize/2)*1000000000*syncT*tres/tunitmul;
      g2Values[i] = dataCArray.data[i];
      g2ValuesErr[i]=Math.sqrt(g2Values[i]);
    }
    if (i == nn - 1) {
      tsvG2Values = tsvG2Values + tValues[i] + "\t" + g2Values[i];
    } else {
      tsvG2Values = tsvG2Values + tValues[i] + "\t" + g2Values[i] + "\n";
    }
  }
  
  document.getElementById("datatsv").value = tsvG2Values;
  
  var data = [
    {
      x: tValues,
      y: g2Values,
      error_y: {
        type: 'data',
        array: g2ValuesErr,
        visible: iserr
      },
      xaxis: "Delay",
      yaxis: "<var>G</var><sup>(2)<sup>(<var>t</var>)",
      type: 'scatter'
    }
  ];
  var plotlyButtons = {
    modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
    modeBarButtonsToAdd: [
      {
        name: "Save as SVG",
        icon: Plotly.Icons.camera,
        click: function (gd) {
          Plotly.downloadImage(gd, { format: "svg" });
        }
      }
    ]
  };
  if(islog==1){
    var plotlyLayout = {
      title: "Second order correlation function",
      xaxis: {title: 't, '+tunit},
      yaxis: {title: "G<sup>(2)</sup>(t)",
      type: 'log',
          autorange: true
        },
        annotations: [{
          xref: 'paper',
          yref: 'paper',
          x: 0.75,
          xanchor: 'left',
          y: 0.1,
          yanchor: 'top',
          text: 'iburenkov.com',
          showarrow: false
        }]
    };
  } else {
    var plotlyLayout = {
      title: "Second order correlation function",
      xaxis: {title: 't, '+tunit},
      yaxis: {title: "G<sup>(2)</sup>(t)"},
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0.75,
        xanchor: 'left',
        y: 0.1,
        yanchor: 'top',
        text: 'iburenkov.com',
        showarrow: false
      }]
  };  
  }
  
  /* if(isnorm==1){
    var plotlyLayout = {
      title: "Second order autocorrelation function",
      xaxis: {title: 't, '+tunit},
      yaxis: {title: "g<sup>(2)</sup>(t)"}
    };
  } */
  
  Plotly.newPlot(divName, data, plotlyLayout, plotlyButtons);

  //#region old
  /* 
  var zValues = [];
  var xValues = [];
  var yValues = [];
  tsvJPDValues = "";
  tsvRPDValues = "";
  for (i = 0; i < width; i++) {
    zValues[i] = [];
    xValues[i] = i;
    yValues[i] = i;
    for (j = 0; j < height; j++) {
      zValues[i][j] = dataCArray.data[i * width + j];
      if (j == height - 1) {
        tsvJPDValues = tsvJPDValues + zValues[i][j];
      } else {
        tsvJPDValues = tsvJPDValues + zValues[i][j] + "\t";
      }
    }
    if (i != width - 1) {
      tsvJPDValues = tsvJPDValues + "\n";
    }
  }

  document.getElementById("datatsv").value = tsvJPDValues;
  


  var jpdData = {
    z: zValues,
    x: xValues,
    y: yValues,
    name: "Joint PND",
    colorscale: "Blackbody", //'Electric',
    type: "heatmap",
    colorbar: { len: 0.5 }
  };
  rpd = cArray(2 * nn);

  jpdrpd(dataCArray.offset, rpd.offset, nn);
  var iValues = [];
  var sValues = [];
  for (i = 0; i < width; i++) {
    iValues[i] = rpd.data[i];
    sValues[i] = rpd.data[i + width];
    if (j == width - 1) {
      tsvRPDValues = tsvRPDValues + i + "\t" + sValues[i] + "\t" + iValues[i];
    } else {
      tsvRPDValues =
        tsvRPDValues + i + "\t" + sValues[i] + "\t" + iValues[i] + "\n";
    }
  }
  var RPDiData = {
    y: xValues,
    x: iValues,
    orientation: "h",
    name: "Idler arm PND",
    marker: { color: "rgb(102,0,0)" },
    xaxis: "x2",
    type: "bar"
  };
  var RPDsData = {
    x: xValues,
    y: sValues,
    name: "Signal arm PND",
    marker: { color: "rgb(0,0,102)" },
    yaxis: "y2",
    type: "bar"
  };
  var bb = document.getElementById("sidebarMenu").getBoundingClientRect();
  let sidebarwidth = bb.right - bb.left;
  function getViewport() {
    return Math.floor(
      Math.min(window.innerHeight, window.innerWidth - sidebarwidth)
    );
  }
  let screenwidth = Math.floor(getViewport()/1.4);

  var plotlyLayout = {
    title: "Photon Number Distributions (PNDs)",
    showlegend: false,
    autosize: false,
    width: screenwidth, //-sidebarwidth-100,//Math.floor(screenwidth*0.6),
    height: screenwidth, //-sidebarwidth-150,//Math.floor(screenwidth*0.6)-50,
    margin: { t: 100 },
    hovermode: "closest",
    bargap: 0.1,
    xaxis: {
      domain: [0, 0.84],
      showgrid: false,
      showline: true,
      title: "Signal number of photons",
      zeroline: false
    },
    yaxis: {
      domain: [0, 0.84],
      showgrid: false,
      showline: true,
      title: "Idler number of photons",
      zeroline: false
    },
    xaxis2: {
      domain: [0.86, 1],
      showgrid: true //,
      //zeroline: false
    },
    yaxis2: {
      domain: [0.86, 1],
      showgrid: true //,
      //zeroline: false
    },
    font: {
      family: "Arial",
      size: Math.floor(screenwidth / 40), //((screenwidth-sidebarwidth-100)/50),
      color: "#000"
    }
  };

  var plotlyData = [jpdData, RPDsData, RPDiData];
  var plotlyButtons = {
    modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
    modeBarButtonsToAdd: [
      {
        name: "Save as SVG",
        icon: Plotly.Icons.camera,
        click: function (gd) {
          Plotly.downloadImage(gd, { format: "svg" });
        }
      }
    ]
  };
  
  Plotly.newPlot(divName, plotlyData, plotlyLayout, plotlyButtons);
 */
//#endregion
}
