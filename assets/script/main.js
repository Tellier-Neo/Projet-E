var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
var progressBar = document.getElementById("myBar");

window.onscroll = function() {
    var progress = (window.pageYOffset / scrollHeight) * 100;
    progressBar.style.height = progress + "%";
};