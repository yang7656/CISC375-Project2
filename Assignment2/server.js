// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));

// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        db.all("SELECT * FROM Consumption WHERE year = ?", ['2017'], (err,rows) => {
            var totalCoal = 0;
            var totalNaturalGas = 0;
            var totalNuclear = 0;
            var totalPetroleum = 0;
            var totalRenewable = 0;
            var tableValue = "";
            for (var i = 0; i < rows.length; i++) {
                totalCoal = totalCoal + rows[i]["coal"];
                totalNaturalGas = totalNaturalGas + rows[i]["natural_gas"];
                totalNuclear = totalNuclear + rows[i]["nuclear"];
                totalPetroleum = totalPetroleum + rows[i]["petroleum"];
                totalRenewable = totalRenewable + rows[i]["renewable"];
                tableValue = tableValue + 
                             "                    <tr>\n" +
                             "                        <td>" + rows[i]["state_abbreviation"] + "</td>\n" +
                             "                        <td>" + rows[i]["coal"] + "</td>\n" +
                             "                        <td>" + rows[i]["natural_gas"] + "</td>\n" +
                             "                        <td>" + rows[i]["nuclear"] + "</td>\n" +
                             "                        <td>" + rows[i]["petroleum"] + "</td>\n" +
                             "                        <td>" + rows[i]["renewable"] + "</td>\n" +
                             "                    </tr>\n";
            }
            response = response.toString();
            response = response.replace("coal_count", "coal_count = " + totalCoal);
            response = response.replace("natural_gas_count", "natural_gas_count = " + totalNaturalGas);
            response = response.replace("nuclear_count", "nuclear_count = " + totalNuclear);
            response = response.replace("petroleum_count", "petroleum_count = " + totalPetroleum);
            response = response.replace("renewable_count", "renewable_count = " + totalRenewable);
            response = response.replace("<!-- Data to be inserted here -->", "<!-- Data to be inserted here -->\n" + tableValue.substring(0,tableValue.length-1));
            WriteHtml(res, response);
        });
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        
        // modify `response` here
        db.all("SELECT * FROM Consumption where year = ?", [req.params.selected_year], (err,rows) => {
            let previousYear = parseInt(req.params.selected_year, 10) - 1;
            let nextYear = parseInt(req.params.selected_year, 10) + 1;
            var totalCoal = 0;
            var totalNaturalGas = 0;
            var totalNuclear = 0;
            var totalPetroleum = 0;
            var totalRenewable = 0;
            var tableValue = "";
            for (var i = 0; i < rows.length; i++) {
                var totalEnergy = 0;
                totalCoal = totalCoal + rows[i]["coal"];
                totalNaturalGas = totalNaturalGas + rows[i]["natural_gas"];
                totalNuclear = totalNuclear + rows[i]["nuclear"];
                totalPetroleum = totalPetroleum + rows[i]["petroleum"];
                totalRenewable = totalRenewable + rows[i]["renewable"];
                totalEnergy = rows[i]["coal"] + rows[i]["natural_gas"] + rows[i]["nuclear"] + rows[i]["petroleum"] + rows[i]["renewable"];
                tableValue = tableValue + 
                             "                    <tr>\n" +               
                             "                        <td>" + rows[i]["state_abbreviation"] + "</td>\n" +
                             "                        <td>" + rows[i]["coal"] + "</td>\n" +
                             "                        <td>" + rows[i]["natural_gas"] + "</td>\n" +
                             "                        <td>" + rows[i]["nuclear"] + "</td>\n" +
                             "                        <td>" + rows[i]["petroleum"] + "</td>\n" +
                             "                        <td>" + rows[i]["renewable"] + "</td>\n" +
                             "                        <td>" + totalEnergy + "</td>\n" +
                             "                    </tr>\n";
            }
            response = response.toString();
            response = response.replace("US Energy Consumption", req.params.selected_year + " US Energy Consumption");
            response = response.replace("var year", "var year = " + req.params.selected_year);
            response = response.replace("coal_count", "coal_count = " + totalCoal);
            response = response.replace("natural_gas_count", "natural_gas_count = " + totalNaturalGas);
            response = response.replace("nuclear_count", "nuclear_count = " + totalNuclear);
            response = response.replace("petroleum_count", "petroleum_count = " + totalPetroleum);
            response = response.replace("renewable_count", "renewable_count = " + totalRenewable);
            response = response.replace("National Snapshot", req.params.selected_year + " National Snapshot");
            response = response.replace("<!-- Data to be inserted here -->", "<!-- Data to be inserted here -->\n" + tableValue.substring(0,tableValue.length-1));
            if (parseInt(req.params.selected_year, 10) === 1960) {
                previousYear = previousYear + 1;
            }
            if (parseInt(req.params.selected_year, 10) === 2017) {
                nextYear = nextYear - 1;
            }
            response = response.replace('href="">Prev','href="http://localhost:8000/year/'+previousYear+'">Prev');
            response = response.replace('href="">Next','href="http://localhost:8000/year/'+nextYear+'">Next');
            WriteHtml(res, response);
        });
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        
        // modify `response` here
        
        
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);
