// 1) Zet "ONDERWEG" exact op de volle breedte van de pagina
function pasTitelAan() {
  const titel = document.getElementById("onderweg");
  if (!titel) return;
  const doel = titel.parentElement.clientWidth;
  titel.style.fontSize = "100px";
  const breedte = titel.scrollWidth;
  titel.style.fontSize = (100 * doel / breedte) + "px";
  titel.style.webkitTextStroke = Math.max(1.5, doel * 0.0018) + "px #fff";
}

window.addEventListener("load", pasTitelAan);
window.addEventListener("resize", pasTitelAan);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(pasTitelAan);

// 2) VERTREK: pijlen schieten naar rechts uit, daarna ga je naar de edities-pagina
const vertrek = document.getElementById("vertrek");
if (vertrek) {
  vertrek.addEventListener("click", function (e) {
    e.preventDefault();
    vertrek.classList.add("actief");
    const url = vertrek.getAttribute("href");
    setTimeout(function () { window.location.href = url; }, 700);
  });
}
