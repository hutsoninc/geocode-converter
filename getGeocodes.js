require('dotenv').config();
var MapboxClient = require('mapbox');
var index = require('./index.js');

var client = new MapboxClient(process.env.MAPBOX_TOKEN);

/*

Before Converting:
1. Update database in the .env file
2. Add the Models and require them below
3. Add loc to schema

*/

// Models
var Equipment = require('./models/Equipment.js');

index.startup().then(() => {

    Equipment.find({loc: {$exists: false}}).exec(function(err, result){
        
        if(err) console.log(err);

        var i = 0,
            addressQuery, 
            addressArray = [];
        
        (function convertGeocode(){

            addressQuery = getAddress(result[i].street1, result[i].street2, result[i].city, result[i].region, result[i].postalCode);

            setTimeout(function(){

                client.geocodeForward(addressQuery, function(err, data, res) {
            
                    if(err) console.log(err);

                    if(data.features.length == 0){

                        increment();

                    }
            
                    console.log(addressQuery);
                    console.log(data.features[0].geometry.coordinates); // [long, lat]
            
                    Equipment.findById(result[i]._id, function(err, result){

                        if(err) console.log(err);
                      
                        result.set({
                            loc: { 
                                type: "Point",
                                coordinates: data.features[0].geometry.coordinates
                            }
                        });

                        result.save(function(err){

                            if(err) console.log(err);

                            increment();

                        });

                    });
            
                });

                function increment(){

                    i++;
                    
                    if(i < result.length){

                        convertGeocode();

                    }else {

                        console.log('Finished converting.');
                        process.exit(0);

                    }

                }
    
            }, 50);
    
        })();

        function getAddress(street1, street2, city, state, zip) {

            addressArray = street1.split(' ');

            if(street2 != ''){

                addressArray = addressArray.concat(street2.split(' '));

            }

            addressArray.concat(city.split(' '));
            
            addressArray.push(state);

            addressArray.push(zip.substr(0, 5));

            return addressArray.join(', ');

        }
        
    }); 

}, err => {

    console.log(err);

});