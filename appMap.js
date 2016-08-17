$(function() {
    function AppMap(){
        "use strict";

        CustomEventHandler.call(this);

        //configuração do mapa
        this.defaultsMaps = {
            zoom: 12,
            center: new google.maps.LatLng(-20.319538, -40.297228),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.BOTTOM
            },
            navigationControl: true,
            navigationControlOptions: {
                style: google.maps.NavigationControlStyle.ZOOM_PAN,
                position: google.maps.ControlPosition.TOP_LEFT
            },
            scaleControl: true,
            scaleControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT
            }
        }

        //elemento contendo o mapa
        this.mapsContainer = document.getElementById("map_canvas");

        //instância do google maps
        this.gMaps;

        //instância do tsp
        this.tsp;

        // Need pointers to all markers to clean up.
        this.markers = new Array();

        this.mode;

        // Need pointer to path to clean up.
        this.dirRenderer;

        //permite ou não adiconar novos pontos no mapa
        this.canAddPoint;

        //--------
        this.ON_SOLVED = "onSolved";
    }


    AppMap.prototype = new CustomEventHandler();
    AppMap.prototype.constructor = AppMap;

    //-------------------------------------------------
    //-------------------------------------------------

    /*
     * método inicial do app
     * */
    AppMap.prototype.init = function (){

        $.appMap.initGoogleMaps(null);
        $.appMap.initTSP();
        $.appMap.initControlCalculate();
        $.appMap.initControlAddLocation();
        $.appMap.initControlAddListLocation();

    }

    /*
     * retorna tempo estimado entre uma origem e um destino
     * https://developers.google.com/maps/documentation/javascript/directions?hl=pt-br
     * */
    AppMap.prototype.getEstimatedTravelTime = function (__args__){
        var origin = new google.maps.LatLng( __args__.origin.lat, __args__.origin.lon); // using google.maps.LatLng class
        var destination = new google.maps.LatLng( __args__.destination.lat, __args__.destination.lon);;//-20.307139 + ', ' + -40.394953; // using string

        var directionsService = new google.maps.DirectionsService();
        var request = {
            origin: origin, // LatLng|string
            destination: destination, // LatLng|string
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        };

        directionsService.route( request, function( response, status ) {

            if ( status === 'OK' ) {
                var point = response.routes[ 0 ].legs[ 0 ];
                console.log( 'Estimated travel time: ' + point.duration.text + ' (' + point.distance.text + ')' );

                /*var polylineOptionsActual = new google.maps.Polyline({
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 6
                });

                var directionsDisplay = new google.maps.DirectionsRenderer();
                directionsDisplay.setOptions({polylineOptions: polylineOptionsActual});
                directionsDisplay.setMap($.appMap.gMaps);
                directionsDisplay.setDirections(response);*/

            }
        } );
    }

    /*
     * inicia o mapa com os marcadores já definidos
     * */
    AppMap.prototype.initMapWithLocations = function (__args__){
        if(__args__.arrayLocations.length){

            // lista com o array de posições
            var _values = '';

            //cria as posições a serem adicionadas no mapa
            $.each(__args__.arrayLocations,function(index,value){
                _values += value+"\n";
            });

            $("#js-input-list-locations").html(_values);
            $("#js-list-of-locations").submit();

            $.appMap.mode = (__args__.direction) ? __args__.direction : 0;

            $.appMap.directions($.appMap.mode);

        }else
        {
            $.appMap.callMessage({msg:"Não foi possível adicionar as localizações no mapa"});
        }

    }

    /*
     *
     * */
    AppMap.prototype.initControlAddListLocation = function (addr, label){

        $("#js-bt-add-list-location").click($.appMap.clickedAddList);

        $("#js-list-of-locations").submit(function(){
            $.appMap.clickedAddList();
            return false;
        });

    }

    /*
     *
     * */
    AppMap.prototype.clickedAddList = function (){
        var val = document.listOfLocations.inputList.value;
        val = val.replace(/\t/g, ' ');
        document.listOfLocations.inputList.value = val;
        $.appMap.addList(val);
    }

    /*
     *
     * */
    AppMap.prototype.addList = function (listStr){

        if($.appMap.markers.length){
            //ao adiconar uma lista, limpamos tudo novamente
            $.appMap.startOver();
        }

        var listArray = listStr.split("\n");

        for (var i = 0; i < listArray.length; ++i) {
            var listLine = listArray[i];
            if (listLine.match(/\(?\s*\-?\d+\s*,\s*\-?\d+/) ||
                listLine.match(/\(?\s*\-?\d+\s*,\s*\-?\d*\.\d+/) ||
                listLine.match(/\(?\s*\-?\d*\.\d+\s*,\s*\-?\d+/) ||
                listLine.match(/\(?\s*\-?\d*\.\d+\s*,\s*\-?\d*\.\d+/)) {
                // Line looks like lat, lng.
                var cleanStr = listLine.replace(/[^\d.,-]/g, "");
                var latLngArr = cleanStr.split(",");
                if (latLngArr.length == 2) {
                    var lat = parseFloat(latLngArr[0]);
                    var lng = parseFloat(latLngArr[1]);
                    var latLng = new google.maps.LatLng(lat, lng);
                    $.appMap.tsp.addWaypoint(latLng, $.appMap.addWaypointSuccessCallbackZoom);
                }
            } else if (listLine.match(/\(?\-?\d*\.\d+\s+\-?\d*\.\d+/)) {
                // Line looks like lat lng
                var latLngArr = listline.split(" ");
                if (latLngArr.length == 2) {
                    var lat = parseFloat(latLngArr[0]);
                    var lng = parseFloat(latLngArr[1]);
                    var latLng = new google.maps.LatLng(lat, lng);
                    $.appMap.tsp.addWaypoint(latLng, $.appMap.addWaypointSuccessCallbackZoom);
                }
            } else if (listLine.match(/\S+/)) {
                // Non-empty line that does not look like lat, lng. Interpret as address.
                $.appMap.tsp.addAddress(listLine, $.appMap.addAddressSuccessCallbackZoom);
            }
        }
    }

    /*
     *
     * */
    AppMap.prototype.addWaypointSuccessCallbackZoom = function (latlng){
        if (latlng) {
            $.appMap.drawMarkers(true);
        }
    }

    /*
     *
     * */
    AppMap.prototype.addAddressAndLabel = function (addr, label){
        $.appMap.tsp.addAddressWithLabel(addr, label, $.appMap.addAddressSuccessCallbackZoom);
    }

    /*
     *
     * */
    AppMap.prototype.addAddress = function (addr){
        $.appMap.addAddressAndLabel(addr, null);
    }

    /*
     *
     * */
    AppMap.prototype.clickedAddAddress = function (){
        $.appMap.addAddress(document.address.addressStr.value);
    }

    /*
     *
     * */
    AppMap.prototype.addAddressSuccessCallbackZoom = function (address, latlng){
        if (latlng) {
            $.appMap.drawMarkers(true);
        } else {
            $.appMap.callMessage({msg:'Failed to geocode: ' + address});
        }
    }

    /*
     * adiciona um ponto no mapa via o input de adicionar localização
     * */
    AppMap.prototype.initControlAddLocation = function (){

        $("#js-bt-add-location").click($.appMap.clickedAddAddress);

        $("#form-add-adress").submit(function(){
            $.appMap.clickedAddAddress();
            return false;
        });

    }

    /*
     * checa se foi adicionado um ponto no mapa
     * */
    AppMap.prototype.checkRoute = function (){
        if($.appMap.markers.length <= 0){
            $.appMap.callMessage({msg:"Adicione uma rota"});
            return false;
        }
        return true;
    }

    /*
     * inicia o controle das funcionalidades
     * */
    AppMap.prototype.initControlCalculate = function (){

        //calcular rota com retorno para o ponto 1
        $("#route-roundtrip").click(function(){
            $.appMap.directions(0);
            return false;
        });

        //calcular rota sem retorno
        $("#route-trip").click(function(){
            $.appMap.directions(1);
            return false;
        });

        //começar novamente
        $("#start-over-route").click($.appMap.startOver);
    }

    /*
     * directions
     * cria a rota com o trajeto
     * */
    AppMap.prototype.directions = function (__arg__){

        if(!$.appMap.checkRoute()) return false;

        $.appMap.addLoader();

        var m, walking, bicycling, avoidHighways, avoidTolls;

        m = __arg__;
        walking = document.forms['travelOpts'].walking.checked;
        bicycling = document.forms['travelOpts'].bicycling.checked;
        avoidHighways = document.forms['travelOpts'].avoidHighways.checked;
        avoidTolls = document.forms['travelOpts'].avoidTolls.checked;

        $.appMap.mode = m;
        $.appMap.tsp.setAvoidHighways(avoidHighways);
        $.appMap.tsp.setAvoidTolls(avoidTolls);

        if (walking)
            $.appMap.tsp.setTravelMode(google.maps.DirectionsTravelMode.WALKING);
        else if (bicycling)
            $.appMap.tsp.setTravelMode(google.maps.DirectionsTravelMode.BICYCLING);
        else
            $.appMap.tsp.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);

        $.appMap.tsp.setOnProgressCallback($.appMap.onProgressCallback);

        if (m == 0)
            $.appMap.tsp.solveRoundTrip($.appMap.onSolveCallback);
        else
            $.appMap.tsp.solveAtoZ($.appMap.onSolveCallback);
    }

    /*
     * duração total estimada da viagem
     * */
    AppMap.prototype.getTotalDurationTrip = function (){
        return $.appMap.formatTime($.appMap.getTotalDuration($.appMap.gDirections));
    }

    /*
     * distância total da viagem
     * */
    AppMap.prototype.getTotalDistanceTrip = function (){
        return $.appMap.formatLength($.appMap.getTotalDistance($.appMap.gDirections));
    }

    /*
     * onSolveCallback
     * */
    AppMap.prototype.onSolveCallback = function (){

        var dirRes = $.appMap.tsp.getGDirections();
        var dir = dirRes.routes[0];

        $.appMap.gDirections = dir;

        /*var _objPos = {
            origin:{
                lat:$.appMap.markers[0].getPosition().lat(),
                lon: $.appMap.markers[0].getPosition().lng()},
            destination:{
                lat: $.appMap.markers[$.appMap.markers.length-1].getPosition().lat(),
                lon: $.appMap.markers[$.appMap.markers.length-1].getPosition().lng()}
        };
        $.appMap.getEstimatedTravelTime(_objPos);*/


        //----------
        $.appMap.removeOldMarkers();
        $.appMap.removeLoader();

        //----------
        // Add nice, numbered icons.
        if ($.appMap.mode == 1) {

            var myPt1 = dir.legs[0].start_location;
            var myIcn1 = new google.maps.MarkerImage("icon.png");
            var marker = new google.maps.Marker({
                label: String (1),
                position: myPt1,
                icon: myIcn1,
                map: $.appMap.gMaps });

            $.appMap.markers.push(marker);
        }

        for (var i = 0; i < dir.legs.length; ++i) {

            var route = dir.legs[i];
            var myPt1 = route.end_location;
            var myIcn1;
            var _label;

            if (i == dir.legs.length - 1 && $.appMap.mode == 0) {
                _label = '1';
                myIcn1 = new google.maps.MarkerImage("icon.png");
            } else {
                _label = String (i + 2);
                myIcn1 = new google.maps.MarkerImage("icon.png");
            }

            //marcador com o ícone
            var marker = new google.maps.Marker({
                label: _label,
                position: myPt1,
                icon: myIcn1,
                map: $.appMap.gMaps });

            $.appMap.markers.push(marker);

        }

        //----------
        // Clean up old path.
        if ($.appMap.dirRenderer != null) {
            $.appMap.dirRenderer.setMap(null);
        }

        $.appMap.dirRenderer = new google.maps.DirectionsRenderer({
            directions: dirRes,
            hideRouteList: true,
            map: $.appMap.gMaps,
            panel: null,
            preserveViewport: false,
            suppressInfoWindows: true,
            suppressMarkers: true });

        //iniciamos o usuário
        $.appMapUser.init();
        
        $.appMap.dispatchEvent($.appMap.ON_SOLVED,{});
    }

    /*
     * retorna a posição inicial do usuário
     * */
    AppMap.prototype.getUserPosition = function (){
        return ($.appMap.markers[0]) ? $.appMap.markers[0].getPosition() : null;
    }

    /*
     * onProgressCallback
     * */
    AppMap.prototype.onProgressCallback = function (){
        var _val = 100 * ($.appMap.tsp.getNumDirectionsComputed()) / ($.appMap.tsp.getNumDirectionsNeeded());
        $(".loader-calculation").css({width:_val+"%"});
    }

    /*
     * directions
     * */
    AppMap.prototype.startOver = function (){

        var center = $.appMap.gMaps.getCenter();
        var zoom = $.appMap.gMaps.getZoom();

        $.appMap.initGoogleMaps({center:center,zoom:zoom});
        $.appMap.tsp.startOver(); // doesn't clearOverlays or clear the directionsPanel
        $.appMap.markers = new Array();

    }

    /*
     * inicia o google maps
     * */
    AppMap.prototype.initGoogleMaps = function (__args__){
        var _obj = $.appMap.defaultsMaps;

        if(__args__)
        {
            _obj = $.extend(false,$.appMap.defaultsMaps,__args__);
        }

        //inicia o mapa
        this.gMaps = new google.maps.Map(
            $.appMap.mapsContainer,
            _obj
        );

        if(this.canAddPoint){
            //cria listener para o click no mapa
            google.maps.event.addListener(this.gMaps, "click", function(event) {
                $.appMap.tsp.addWaypoint(event.latLng, $.appMap.addWaypointSuccessCallback);
            });
        }

    }

    /*
     * inicia o google tps solver
     * */
    AppMap.prototype.initTSP = function (){

        this.tsp = new BpTspSolver(
            $.appMap.gMaps
        );
        this.tsp.setDirectionUnits("m");

        google.maps.event.addListener(this.tsp.getGDirectionsService(), "error", function() {
            $.appMap.callMessage({msg:"Request failed: " + reasons[$.appMap.tsp.getGDirectionsService().getStatus().code]});
        });

    }

    /*
     * ao clicar no mapa é chamado addWaypoint no objeto tsp
     * addWaypointSuccessCallback é o listener no app para tal evento
     * */
    AppMap.prototype.addWaypointSuccessCallback = function (__latlng__){
        if (__latlng__) {
            $.appMap.drawMarkers(false);
        }
    }

    AppMap.prototype.drawMarkers = function (updateViewport){

        $.appMap.removeOldMarkers();

        var waypoints = $.appMap.tsp.getWaypoints();
        var addresses = $.appMap.tsp.getAddresses();
        var labels = $.appMap.tsp.getLabels();

        for (var i = 0; i < waypoints.length; ++i) {
            $.appMap.drawMarker(waypoints[i], addresses[i], labels[i], i);
        }

        if (updateViewport) {
            $.appMap.setViewportToCover(waypoints);
        }
    }

    /*
     * setViewportToCover
     * */
    AppMap.prototype.setViewportToCover = function (waypoints){
        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < waypoints.length; ++i) {
            bounds.extend(waypoints[i]);
        }

        $.appMap.gMaps.fitBounds(bounds);
    }

    /*
     * remove os marcadores antigos
     * */
    AppMap.prototype.removeOldMarkers = function (){
        for (var i = 0; i < $.appMap.markers.length; ++i) {
            $.appMap.markers[i].setMap(null);
        }
        $.appMap.markers = new Array();
    }

    /*
     * cria marcador
     * */
    AppMap.prototype.drawMarker = function (latlng, addr, label, num) {

        //ícone
        var icon = new google.maps.MarkerImage("icon.png");
        var _val = String (num + 1);

        //marcador com o ícone
        var marker = new google.maps.Marker({
            label: _val,
            position: latlng,
            icon: icon,
            zIndex: 1,
            map: $.appMap.gMaps
        });

        //listener para o clique no marcador
        google.maps.event.addListener(marker, 'click', function(event) {
            var addrStr = (addr == null) ? "" : addr + "<br>";
            var labelStr = (label == null) ? "" : "<b>" + label + "</b><br>";
            var markerInd = -1;

            for (var i = 0; i < $.appMap.markers.length; ++i) {
                if ($.appMap.markers[i] != null && marker.getPosition().equals($.appMap.markers[i].getPosition())) {
                    markerInd = i;
                    break;
                }
            }

            //controle do marcador
            var infoWindow = new google.maps.InfoWindow({
                content: labelStr + addrStr
                + "<a href='javascript:$.appMap.setMarkerAsStart($.appMap.markers["
                + markerInd + "]"
                + ")'>"
                + "Iniciar a rota aqui"
                + "</a><br>"
                + "<a href='javascript:$.appMap.setMarkerAsStop($.appMap.markers["
                + markerInd + "])'>"
                + "Finalizar a rota aqui"
                + "</a><br>"
                + "<a href='javascript:$.appMap.removeMarker($.appMap.markers["
                + markerInd + "])'>"
                + "Remover marcador</a>",
                position: marker.getPosition() });
            marker.infoWindow = infoWindow;
            infoWindow.open($.appMap.gMaps);
            //    tsp.removeWaypoint(marker.getPosition());
            //    marker.setMap(null);
        });
        $.appMap.markers.push(marker);
    }

    /*
     * coloca o marcador como o ponto inicial da rota
     * */
    AppMap.prototype.setMarkerAsStart = function (marker) {
        marker.infoWindow.close();
        this.tsp.setAsStart(marker.getPosition());
        this.drawMarkers(false);
    }

    /*
     * coloca o marcador como o ponto final da rota
     * */
    AppMap.prototype.setMarkerAsStop = function (marker) {
        marker.infoWindow.close();
        this.tsp.setAsStop(marker.getPosition());
        this.drawMarkers(false);
    }

    /*
     * remove marcador
     * */
    AppMap.prototype.removeMarker = function (marker) {
        marker.infoWindow.close();
        this.tsp.removeWaypoint(marker.getPosition());
        this.drawMarkers(false);
    }

    /*
     * mensagem
     * */
    AppMap.prototype.callMessage = function (__args__){
        alert(__args__.msg);
    }

    /*
     * adiciona o loader
     * */
    AppMap.prototype.addLoader = function (){
        var _template = "<div class='box-calculator'>";
            _template += "<div class='loader-calculation'></div>";
            _template += "</div>";
        $("body").append(_template);
    }

    /*
     * remove o loader
     * */
    AppMap.prototype.removeLoader = function (){
        $(".box-calculator").remove();
    }

    //-----------------------------------------
    //FORMATER UTILS

    /* Returns a textual representation of time in the format
     * "N days M hrs P min Q sec". Does not include days if
     * 0 days etc. Does not include seconds if time is more than
     * 1 hour.
     */
    AppMap.prototype.formatTime = function (seconds){
        var days;
        var hours;
        var minutes;
        days = parseInt(seconds / (24*3600));
        seconds -= days * 24 * 3600;
        hours = parseInt(seconds / 3600);
        seconds -= hours * 3600;
        minutes = parseInt(seconds / 60);
        seconds -= minutes * 60;
        var ret = "";
        if (days > 0)
            ret += days + " dias ";
        if (days > 0 || hours > 0)
            ret += hours + " hrs ";
        if (days > 0 || hours > 0 || minutes > 0)
            ret += minutes + " min ";
        if (days == 0 && hours == 0)
            ret += seconds + " seg";
        return(ret);
    }

    /* Returns textual representation of distance in the format
     * "N km M m". Does not include km if less than 1 km. Does not
     * include meters if km >= 10.
     */
    AppMap.prototype.formatLength = function (meters){
        var km = parseInt(meters / 1000);
        meters -= km * 1000;
        var ret = "";
        if (km > 0)
            ret += km + " km ";
        if (km < 10)
            ret += meters + " m";
        return(ret);
    }

    AppMap.prototype.getTotalDuration = function (dir){
        var sum = 0;
        for (var i = 0; i < dir.legs.length; i++) {
            sum += dir.legs[i].duration.value;
        }
        return sum;
    }

    AppMap.prototype.getTotalDistance = function (dir){
        var sum = 0;
        for (var i = 0; i < dir.legs.length; i++) {
            sum += dir.legs[i].distance.value;
        }
        return sum;
    }

    /* Returns textual representation of distance in the format
     * "N.M miles".
     */
    AppMap.prototype.formatLengthMiles = function (meters){
        var sMeters = meters * 0.621371192;
        var miles = parseInt(sMeters / 1000);
        var commaMiles = parseInt((sMeters - miles * 1000 + 50) / 100);
        var ret = miles + "." + commaMiles + " miles";
        return(ret);
    }

    //-----------------------------------------

    //cria nova instância do app
    $.appMap = new AppMap();

    //inicia o app
    $.appMap.init();

    //precisamos da instância do appuser para o rodar as funconalidades do usuário
    if(!$.appMapUser){
        $.error( '$.appMapUser não encontrado');
    }
});

//---------------------------------------------------------
//https://gist.github.com/badsyntax/2365949
//http://humaan.com/custom-html-markers-google-maps/
/*function CustomMarker(latlng, map, args) {
 this.latlng = latlng;
 this.args = args;
 this.setMap(map);
 }

 CustomMarker.prototype = new google.maps.OverlayView();

 CustomMarker.prototype.draw = function() {

 var self = this;

 var div = this.div;

 if (!div) {

 div = this.div = document.createElement('div');

 div.className = 'marker';

 div.style.position = 'absolute';
 div.style.cursor = 'pointer';
 div.style.width = '20px';
 div.style.height = '20px';
 div.style.background = 'blue';

 if (typeof(self.args.marker_id) !== 'undefined') {
 div.dataset.marker_id = self.args.marker_id;
 }

 google.maps.event.addDomListener(div, "click", function(event) {
 alert('You clicked on a custom marker!');
 google.maps.event.trigger(self, "click");
 });

 var panes = this.getPanes();
 panes.overlayImage.appendChild(div);
 }

 var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

 if (point) {
 div.style.left = (point.x - 10) + 'px';
 div.style.top = (point.y - 20) + 'px';
 }
 };

 CustomMarker.prototype.remove = function() {
 if (this.div) {
 this.div.parentNode.removeChild(this.div);
 this.div = null;
 }
 };

 CustomMarker.prototype.getPosition = function() {
 return this.latlng;
 };*/
