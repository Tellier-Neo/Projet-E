var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
var progressBar = document.getElementById("barre_de_progression");



if (window.innerWidth >= 768) {
    window.onscroll = function () {
        var progress = (window.pageYOffset / scrollHeight) * 100;
        progressBar.style.height = progress + "%";
    };
    console.log("Écran d'ordinateur détecté, barre de progression activé");

} else {
    var progressContainers = document.getElementsByClassName("progress-container");
    var progressBar = document.getElementsByClassName("progress-bar");

    for (var i = 0; i < progressContainers.length; i++) {
        progressContainers[i].style.display = "none";
    }

    for (var j = 0; j < progressBar.length; j++) {
        progressBar[j].style.display = "none";
    }

}


document.getElementById('boutton_1').addEventListener('click', function () {
    window.location.href = 'index.html';
  });
  
  
  document.getElementById('boutton_2').addEventListener('click', function () {
    window.location.href = 'rally.html';
  });
  
  document.getElementById('boutton_3').addEventListener('click', function () {
    window.location.href = 'groupe_B.html';
  });
  
  document.getElementById('boutton_4').addEventListener('click', function () {
    window.location.href = 'wikicar.html';
  });
  
  document.getElementById('boutton_wikicar_inpage').addEventListener('click', function () {
    window.location.href = 'wikicar.html';
  });