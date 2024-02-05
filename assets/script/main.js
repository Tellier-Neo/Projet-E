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
