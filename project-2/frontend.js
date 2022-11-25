document.getElementById("tutorialButton").addEventListener("click", showTutorial);

function showTutorial(){
  if(document.getElementById("tutorial").style.display === "none"){
    document.getElementById("tutorial").style.display = "block";
  }
  else{
    document.getElementById("tutorial").style.display = "none";
  }
}
