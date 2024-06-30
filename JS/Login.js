/* Rimozione del div col guanto dell'infinito quando non c'è abbastanza spazio per due colonne nel login */
function rimozioneDivSx(){
    var div = document.getElementById("card_div_sx");
    if(window.innerWidth <= 991){
        div.classList.add("d-none");
    }else{
        div.classList.remove("d-none");
    }
}

window.onload = rimozioneDivSx;
window.onresize = rimozioneDivSx;