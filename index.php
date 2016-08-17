<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <link href="reset.css" rel="stylesheet">
    <link href="geral.css" rel="stylesheet">
    <script type="text/javascript" src="jquery.min.js"></script>
    <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=true"></script>
    <script type="text/javascript" src="BpTspSolver.js"></script>



    <!-- appMapUser precisa vir antes do appMap -->
    <script type="text/javascript" src="appMapUser.js"></script>
    <script type="text/javascript" src="appMap.js"></script>
    <script type="text/javascript" src="customEventHandler.js"></script>

    <!-- ////////////////////////////////////// -->
    <!-- ////////////////////////////////////// -->
    <!-- ////////////////////////////////////// -->
    <script type="text/javascript">
        $(function() {

            $("#js-button-begin").click(function(){

                //inicia o mapa com os marcadores já definidos
                var _array = [
                    "-20.344067, -40.408485",
                    "-20.339319, -40.403421",
                    "-20.336341, -40.402133",
                    "-20.329178, -40.398271",
                    "-20.314852, -40.395610",
                    "-20.306963, -40.395009"
                ];

                //posição inicial do entregador
                var _posUser = "-20.376255,-40.318448";

                //adicionamos sua posição no início do array
                _array.unshift(_posUser);

                var _obj = {
                    direction: 1,
                    arrayLocations:_array
                };

                if(!_posUser){
                    alert("Posição do usuário não encontrada");
                }else{
                    $(".box-initial").remove();
                    $.appMap.initMapWithLocations(_obj);
                }

                //------------------
                return false;
            });

            //----------------------------
            $("#bt-menu").click(function(){

                if($(this).hasClass('on')){
                    $(this).removeClass('on');
                    $("#box-menu").removeClass('on');
                }else{
                    $(this).addClass('on');
                    $("#box-menu").addClass('on');
                }

                return false;
            });

            //--------
            //listener para quando a rota for criada
            $.appMap.addListener($.appMap.ON_SOLVED, function(__arg__){
                $("#trip-data").append("<p>Tempo estimado: "+$.appMap.getTotalDurationTrip()+"</p>");
                $("#trip-data").append("<p>Distância: "+$.appMap.getTotalDistanceTrip()+"</p>");
                $("#bt-menu").show();
            });

            //listener para quando mudar a rota do usuário
            $.appMapUser.addListener($.appMapUser.ON_SOLVED, function(__arg__){
                $("#trip-data-move").empty();
                $("#trip-data-move").append("<p>Tempo estimado: "+$.appMapUser.getTotalDurationTrip()+"</p>");
                $("#trip-data-move").append("<p>Distância: "+$.appMapUser.getTotalDistanceTrip()+"</p>");

                setTimeout(function(){

                    $.appMapUser.currentPosition++;
                    $.appMapUser.nextPosition++;

                    if($.appMapUser.nextPosition < $.appMap.markers.length){
                        $.appMapUser.initRoute();
                    }

                },4000);

            });

        });
    </script>

</head>
<body>

    <div class="box-initial">
        <div class="box-initial-message">
            <div class="box-initial-message-inner">
                <a href="#" id="js-button-begin" class="box-initial-message-button">Iniciar aplicação</a>
            </div>
        </div>
    </div>

    <div class="wrapper-control hide">
        <div class="wrapper-control__inner">
            <div class="border-separator box-add-location">
                <div class="box-add-location__address">
                    <form name="address" id="form-add-adress">
                        <div class="adress-field">
                            <span class="adress-field-box"><input class="adress-field-input" name="addressStr" type="text"></span>
                        </div>
                        <input class="adress-field-button" type="button" value="Add" id="js-bt-add-location">
                    </form>
                </div>
            </div>
            <div class="box-add-list-location">
                <form name="listOfLocations" id="js-list-of-locations">
                    <textarea class="input-list-locations" name="inputList" id="js-input-list-locations" placeholder="One destination per line"></textarea><br>
                    <input type="button" id="js-bt-add-list-location" value="Add list of locations">
                </form>
            </div>
            <div class="router-options border-separator">
                <strong class="router-options__title">Route options</strong>
                <form name="travelOpts">
                    <p class="router-options__line"><input id="walking" type="checkbox"> Walking<br></p>
                    <p class="router-options__line"><input id="bicycling" type="checkbox"> Bicycling<br></p>
                    <p class="router-options__line"><input id="avoidHighways" type="checkbox"> Avoid highways<br></p>
                    <p class="router-options__line"><input id="avoidTolls" type="checkbox"> Avoid toll roads</p>
                </form>
            </div>
            <!--  -->
            <a href="#" class="wrapper-control__bt" id="route-roundtrip">Calculate Fastest Roundtrip</a>
            <a href="#" class="wrapper-control__bt" id="route-trip">Calculate Fastest A-Z Trip</a>
            <a href="#" class="wrapper-control__bt" id="start-over-route">Start Over Again</a>
        </div>
    </div>
    <div id="map_canvas" style="width:100%; height:100%"></div>

    <button id="bt-menu">
        <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 43 38.001" enable-background="new 0 0 43 38.001" xml:space="preserve"><g><g><path fill="#000000" d="M4,8h35c2.209,0,4-1.792,4-4c0-2.211-1.789-4-3.998-4H4C1.792,0,0,1.789,0,4C0,6.208,1.792,8,4,8z     M39,14.999H4c-2.209,0-4,1.791-4,4.002c0,2.209,1.792,4,4,4h35c2.209,0,4-1.791,4-4C43,16.79,41.209,14.999,39,14.999z     M39,29.999H4c-2.209,0-4,1.791-4,4.002c0,2.209,1.792,4,4,4h35c2.209,0,4-1.791,4-4C43,31.79,41.209,29.999,39,29.999z"></path></g></g></svg>
    </button>
    <div id="box-menu" class="wrapper-control">
        <div class="wrapper-control__inner">
            <div>
                <strong>Dados do percurso total</strong>
                <div id="trip-data"></div>
            </div>
            <br><br>
            <div>
                <strong>Dados do percurso A>B</strong>
                <div id="trip-data-move"></div>
            </div>
        </div>
    </div>

</body>
</html>