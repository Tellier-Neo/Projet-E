async function checkUUIDInCookies() {
  while (true) {
   
    await sleep(1000);


    const cookies = document.cookie;

    
    if (cookies.includes('UUID=')) {
      console.log('UUID trouvé dans les cookies!');
      
     
      console.log('UUID non trouvé dans les cookies.');
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

checkUUIDInCookies();
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

  document.getElementById('logButton').addEventListener('click', function () {
    window.location.href = 'login.html';
  });

  document.getElementById('registerButton').addEventListener('click', function () {
    window.location.href = 'register.html';
  });



