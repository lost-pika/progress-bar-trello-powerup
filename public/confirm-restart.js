const t = TrelloPowerUp.iframe();

document.getElementById("restartYes").onclick = function () {
  t.closePopup({ restart: true });
};

document.getElementById("restartNo").onclick = function () {
  t.closePopup({ restart: false });
};

setTimeout(() => t.sizeTo(document.body).done(), 40);
