require('dotenv').config({path: '../.env'});
var fs = require('fs');
var MapboxClient = require('mapbox');
var client = new MapboxClient(process.env.MAPBOX_TOKEN);

var i = 0,
    data,
    addressQuery, 
    addressArray = []
    filePath = 'data/customers.json',
    outFilePath = 'data/customers-out.json';

console.log('Fetching file contents.')

fs.readFile(filePath, 'utf8', (err, chunk) => {
    
    if(err) console.log(err);

    data = JSON.parse(chunk);

    console.log('Geocoding addresses.');

    convertGeocode();

});

function convertGeocode(){
    
    addressQuery = getAddress(data[i].address, '', data[i].city, data[i].state, data[i].zip);

    // Needed to limit requests per second
    setTimeout(function(){

        client.geocodeForward(addressQuery, function(err, result, res) {
    
            if(err) console.log(err);

            if(result.features.length == 0){

                increment();

            }

            data[i].loc = {
                long: result.features[0].geometry.coordinates[0],
                lat: result.features[0].geometry.coordinates[1]
            }

            increment();
    
        });

        function increment(){

            i++;
            
            if(i < data.length){

                convertGeocode();

            }else {

                console.log('Writing output to file.');

                fs.writeFile(outFilePath, JSON.stringify(data), err => {
                    
                    if(err) console.log(err);

                    console.log('Finished processing.')

                });

            }

        }

    }, 50);

}

function getAddress(street1, street2, city, state, zip) {

    addressArray = street1.split(' ');
    addressArray.push(city);
    addressArray.push(state);
    addressArray.push(zip);

    return addressArray.join(', ');

}