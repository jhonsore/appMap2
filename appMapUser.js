$(function() {
    function AppMapUser(){
        "use strict";

        CustomEventHandler.call(this);

        //instância do google maps
        this.gMaps;

        //instância do tsp
        this.tsp;

        //posição atual do usuário
        this.currentPosition = 0;

        //proxima posição a ir
        this.nextPosition = 1;

        //--------
        this.ON_SOLVED = "onSolved";

    }

    AppMapUser.prototype = new CustomEventHandler();

    AppMapUser.prototype.constructor = AppMapUser;

    AppMapUser.prototype.init = function (){

        //setamos o gmaps do appMap
        this.gMaps = $.appMap.gMaps;

        //iniciamos o marcador do usuário
        if($.appMap.getUserPosition()){
            this.position = $.appMap.getUserPosition();
            $.appMapUser.initMarkerUser();
            $.appMapUser.initRoute();
        }else{
            $.appMap.callMessage({msg:"Posição do usuário não encontrada"});
        }
    }

    /*
     * duração total estimada da viagem
     * */
    AppMapUser.prototype.getTotalDurationTrip = function (){
        return $.appMap.formatTime($.appMap.getTotalDuration($.appMapUser.gDirections));
    }

    /*
     * distância total da viagem
     * */
    AppMapUser.prototype.getTotalDistanceTrip = function (){
        return $.appMap.formatLength($.appMap.getTotalDistance($.appMapUser.gDirections));
    }

    /*
     * cria marcador do usuário
     * */
    AppMapUser.prototype.initMarkerUser = function (){

        var myLatLng = this.position;
        var icon = new google.maps.MarkerImage("icon-user.png");
        var marker = new google.maps.Marker( {
            position: myLatLng,
            map: $.appMapUser.gMaps,
            optimized: false,
            icon: icon,
            zIndex: google.maps.Marker.MAX_ZINDEX//mudamos o indexo do marcador do usuário
        } );

        marker.setMap( this.gMaps );

        this.markerUser = marker;

        //alert(google.maps.Marker.MAX_ZINDEX);
        /* this.timerMoveUser = setInterval(function(){

         if($.appMap.counter < $.appMap.arrPositions.length){
         $.appMap.moveMarkerUser({
         lat:$.appMap.arrPositions[$.appMap.counter][0],
         long:$.appMap.arrPositions[$.appMap.counter][1]
         });
         }else{
         clearInterval($.appMap.timerMoveUser);
         }

         },1000);

         //---
         var _objPos = {
         origin:{lat:$.appMap.arrPositions[0][0],lon: $.appMap.arrPositions[0][1]},
         destination:{lat:$.appMap.arrPositions[$.appMap.arrPositions.length-1][0],lon: $.appMap.arrPositions[$.appMap.arrPositions.length-1][1]}
         };

         $.appMap.getEstimatedTravelTime(_objPos);*/
    }

    /*
     * cria rota a ser feita
     * */
    AppMapUser.prototype.initRoute = function (){
        if(!$.appMap.checkRoute()) return false;

        $.appMap.tsp.startOver(); // limpamos o tsp para termos os itens que queremos
        $.appMap.tsp.addWaypoint($.appMap.markers[$.appMapUser.currentPosition].getPosition());//adicionamos a posição inicial
        $.appMap.tsp.addWaypoint($.appMap.markers[$.appMapUser.nextPosition].getPosition());//adicionamos a posição final

        if(!$.appMap.checkRoute()) return false;

        $.appMap.addLoader();

        $.appMap.tsp.setOnProgressCallback($.appMapUser.onProgressCallback);

        if ($.appMap.mode == 0)
            $.appMap.tsp.solveRoundTrip($.appMapUser.onSolveCallback);
        else
            $.appMap.tsp.solveAtoZ($.appMapUser.onSolveCallback);
    }

    /*
     * onProgressCallback
     * */
    AppMapUser.prototype.onProgressCallback = function (){
        var _val = 100 * ($.appMap.tsp.getNumDirectionsComputed()) / ($.appMap.tsp.getNumDirectionsNeeded());
        $(".loader-calculation").css({width:_val+"%"});
    }

    /*
     * onSolveCallback
     * */
    AppMapUser.prototype.onSolveCallback = function (){

        var dirRes = $.appMap.tsp.getGDirections();
        var dir = dirRes.routes[0];

        $.appMapUser.gDirections = dir;

        $.appMap.removeLoader();

        //----------
        // Clean up old path.
        if ($.appMapUser.dirRenderer != null) {
            $.appMapUser.dirRenderer.setMap(null);
        }

        var polylineOptionsActual = new google.maps.Polyline({
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 6,
            zIndex: 1000
        });

        $.appMapUser.dirRenderer = new google.maps.DirectionsRenderer({
            polylineOptions: polylineOptionsActual,
            directions: dirRes,
            hideRouteList: true,
            map: $.appMapUser.gMaps,
            panel: null,
            preserveViewport: false,
            suppressInfoWindows: true,
            suppressMarkers: true });

        /*console.log('------------------------------');
        console.log($.appMapUser.getTotalDurationTrip());
        console.log($.appMapUser.getTotalDistanceTrip());*/

        $.appMapUser.dispatchEvent($.appMapUser.ON_SOLVED,{});

    }

    /*
     * onProgressCallback
     * */
    AppMapUser.prototype.onProgressCallback = function (){
        var _val = 100 * ($.appMap.tsp.getNumDirectionsComputed()) / ($.appMap.tsp.getNumDirectionsNeeded());
        $(".loader-calculation").css({width:_val+"%"});
    }

    /*
     * cria marcador do usuário
     * */
    AppMapUser.prototype.moveMarkerUser = function (__arg__){

        var _lat = __arg__.lat;
        var _long = __arg__.long;

        $.appMap.markerUser.setPosition( new google.maps.LatLng( _lat, _long ));
        $.appMap.gMaps.panTo( new google.maps.LatLng( _lat, _long ));

        //--------------
        /*
         //
         $.appMap.counter++;

         var _objPos = {
         origin:{lat:_lat,lon:_long},
         destination:{lat:$.appMap.arrPositions[$.appMap.counter][0],lon: $.appMap.arrPositions[$.appMap.counter][1]}
         };

         $.appMap.getEstimatedTravelTime(_objPos);*/

    };

    /*
     * método inicial do app
     * */
    /*
     *
     * USUÁRIO
     *
     * responsável pela posição inicial do usuário
     * aqui iniciaremos a primeira estimativa de tempo para o primeiro local de entrega
     * moveremos o mapa para o centro dos marcadores de local e do usuário
     * */
    AppMapUser.prototype.initUserPosition = function (){
        /*if($.appMap.userPosition){

            $.appMap.userPosition = null;

            var _timer = setTimeout(function(){

                //movimenta o mapa para o centro dos marcadores
                var bounds = $.appMap.markers.reduce(function(bounds, marker) {
                    return bounds.extend(marker.getPosition());
                }, new google.maps.LatLngBounds());

                bounds = bounds.extend($.appMap.markerUser.getPosition());

                $.appMap.gMaps.setCenter(bounds.getCenter());
                $.appMap.gMaps.fitBounds(bounds);

                //--------------------------------------------
                //--------------------------------------------
                //--------------------------------------------
                var tspUser = new BpTspSolver(
                    $.appMap.gMaps
                );

                tspUser.setDirectionUnits("m");

                google.maps.event.addListener(tspUser.getGDirectionsService(), "error", function() {
                    $.appMap.callMessage({msg:"Request failed: " + reasons[tspUser.getGDirectionsService().getStatus().code]});
                });

                $.appMap.addLoader();

                tspUser.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);

                if ($.appMap.mode == 0)
                    tspUser.solveRoundTrip($.appMap.onSolveTpsUserCallback);
                else
                    tspUser.solveAtoZ($.appMap.onSolveTpsUserCallback);

                *//*
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
                 * *//*

                //--------------------------------------------
                //--------------------------------------------
                //--------------------------------------------
                clearTimeout(_timer);

            },100);

        }*/
    }

    //cria nova instância do app
    $.appMapUser = new AppMapUser();

});
