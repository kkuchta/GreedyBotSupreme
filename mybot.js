function new_game() {
    DISTANCE_WEIGHT = 1;
    NUM_FROM_WINNING_WEIGHT = 2;
}

function make_move() {
    console.log( "******** New Move ********" );
    var board = get_board();

    // Take the current fruit if it's not closed out.
    var fruitAtMyLocation = board[get_my_x()][get_my_y()];
    if( fruitAtMyLocation && !apiAddons.fruitIsOver( fruitAtMyLocation ) ){
        return TAKE;
    }

    // Get the nearest fruit of each type
    var nearestFruit = util.getNearestFruits(get_my_x(),get_my_y());
    
    // Maintain a running "best" scoring for the nearest fruits
    var best = { loc:[-1,-1], score: Number.MAX_VALUE, fruit: -1 }
    var updateBest = function( loc, score ){
        console.log( "Updating best: ", loc, score )
        if( best.score >= score ){
            console.log( "New best!" );
            best.loc = loc;
            best.score = score;
        }
    }
    console.log( best );

    // Score each of the closest fruit by various things.
    for( var i = 1; i <= get_number_of_item_types(); i++ ){
        console.log( "Evaluating fruit " + i );
        var distance = nearestFruit[i].distance;
        var loc = nearestFruit[i].location;
        //var myScore = get_my_item_count( i );
        //var oppScore = get_opponent_item_count( i );
        //var fruitLeft = get_total_item_count( i ) - (myScore + oppScore);

        // This fruit is already closed out- no value in going after it.
        if( apiAddons.fruitIsOver( i ) ){
            updateBest( loc, Number.MAX_VALUE );
        }

        // TODO: real logic here
        var score = (distance * DISTANCE_WEIGHT)
            + (apiAddons.myNumberFromWinning() * NUM_FROM_WINNING_WEIGHT);
        updateBest( loc, distance );
    }

     //Find the lowest score and move towards it.
    console.log( best );
    var move = util.getMoveTowards( best.loc );
    if( move == PASS ){
        move = TAKE;
    }
    console.log( "move " + move );
    return move;
}

/**
 * Utilities that interact with the api.
 */
var apiAddons = {

    /**
     * Is this fruit closed out (because one of us got enough to win?)
     */
    fruitIsOver: function( fruit ){
        console.log( 'fruit = ' + fruit );
        if( !fruit ){
            throw "bad fruit: " + fruit;
        }
        return apiAddons.myNumberFromWinning() <= 0
            || apiAddons.oppNumberFromWinning() <= 0;
    },

    // How many I need in order to close out this fruit.
    myNumberFromWinning: function( fruit ){
        var winningNumber = Math.floor( get_total_item_count( fruit ) / 2 );
        return winningNumber - get_my_item_count();
    },

    // How many opp needs to win
    oppNumberFromWinning: function( fruit ){
        var winningNumber = Math.floor( get_total_item_count( fruit ) / 2 );
        return winningNumber - get_opponent_item_count();
    }
}

/**
 * Misc utilities- all idempotent and none with api interaction.
 */
var util = {

    // Gets the api move that would move us towards the specified location

    /**
     * Get the move constant that would move us towards the specified location
     *
     * @param loc [x,y]
     * @return PASS if we're already at that location
     */
    getMoveTowards: function( loc ){
        var targetX = loc[0];
        var targetY = loc[1];

        // Bounds check
        if( targetX < 0
         || targetY < 0
         || targetX >= WIDTH
         || targetY >= HEIGHT ){
            throw "Out of bounds input to getMoveTowards:" + targetX + ", " + targetY;
        }

        // Counting from the upper left cornet
        if( get_my_x() < targetX ) return EAST;
        if( get_my_x() > targetX ) return WEST;
        if( get_my_y() > targetY ) return NORTH;
        if( get_my_y() < targetY ) return SOUTH;

        // We're where we want to be.
        return PASS;

    },

    /**
     * Get the nearest fruit of each type.
     *
     * @return [ [fruit1X,fruit1Y], [fruit2X],[fruit2Y], ... ]
     */
    getNearestFruits: function(botX,botY){
        var closestFruits = [];

        // Init the array
        for( var type = 1; type <= get_number_of_item_types(); type++ ){
            closestFruits[type] = {
                location:[-1,-1],
                distance:Number.MAX_VALUE
            }
        }

        var board = get_board();

        // Check each fruit on the board in turn.
        for( var y = 0; y < HEIGHT; y++ ){
            for( var x = 0; x < WIDTH; x++ ){

                // If there's a fruit here
                var fruit = board[x][y];
                if( fruit > 0 ){
                    var distance = util.getEuclideanDistance( [x,y],[botX,botY] );

                    //console.log('fruit=' + fruit );
                    if( distance < closestFruits[fruit].distance ){
                        closestFruits[fruit].location = [x,y];
                        closestFruits[fruit].distance = distance;
                    }
                }
            }
        }

        console.log(closestFruits);
        return closestFruits;
    },

    /**
     * Get the euclidean distance between two points.
     *
     * @param pointA [x,y]
     * @param pountB [x,y]
     * @return float
     *
     * TODO: we don't need true euclidean distance here- diffx + diffy would
     * do just fine.
     */
    getEuclideanDistance: function( pointA, pointB ){
        var xDistance = pointA[0] - pointB[0];
        var yDistance = pointA[1] - pointB[1];

        var distance = Math.sqrt( xDistance*xDistance + yDistance*yDistance );
        return distance;
    }
}
