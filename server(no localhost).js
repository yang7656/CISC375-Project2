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
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        
        // modify `response` here
        if (req.params.selected_year < 1960 || req.params.selected_year > 2017) {
            Write404ErrorYear(res, req.params.selected_year);
        }
        else {
            db.all("SELECT * FROM Consumption WHERE year = ?", [req.params.selected_year], (err,rows) => {
                var previousYear = parseInt(req.params.selected_year, 10) - 1;
                var nextYear = parseInt(req.params.selected_year, 10) + 1;
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
                response = response.replace('href="">Prev','href="' + previousYear + '">Prev');
                response = response.replace('href="">Next','href="' + nextYear + '">Next');
                WriteHtml(res, response);
            });
        }
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        
        // modify `response` here
        
        db.all("SELECT * FROM Consumption WHERE state_abbreviation = ?", [req.params.selected_state], (err,rows) => {
            var coal = [];
            var naturalGas = [];
            var nuclear = [];
            var petroleum = [];
            var renewable = [];
            var tableValue = "";
            for (let i = 0; i < rows.length; i++){
                var totalEnergy = 0;
                coal[i] = rows[i]["coal"];
                naturalGas[i] = rows[i]["natural_gas"];
                nuclear[i] = rows[i]["nuclear"];
                petroleum[i] = rows[i]["petroleum"];
                renewable[i] = rows[i]["renewable"];
                totalEnergy = coal[i] + naturalGas[i] + nuclear[i] + petroleum[i] + renewable[i];
                tableValue = tableValue +
                             "                    <tr>\n" +               
                             "                        <td>" + rows[i]["year"] + "</td>\n" +
                             "                        <td>" + coal[i] + "</td>\n" +
                             "                        <td>" + naturalGas[i] + "</td>\n" +
                             "                        <td>" + nuclear[i] + "</td>\n" +
                             "                        <td>" + petroleum[i] + "</td>\n" +
                             "                        <td>" + renewable[i] + "</td>\n" +
                             "                        <td>" + totalEnergy + "</td>\n" +
                             "                    </tr>\n";
            }
            db.all("SELECT * FROM States ORDER BY state_abbreviation", (err,StatesName) => {
                var fullNameOfState = "";
                var currentState;
                for (let j = 0; j < StatesName.length; j++) {
                    if (StatesName[j]["state_abbreviation"] === req.params.selected_state) {
                        fullNameOfState = StatesName[j]["state_name"]
                        currentState = j;
                    }
                }
                if (fullNameOfState === "") {
                    Write404ErrorState(res, req.params.selected_state);
                }
                else {
                    var nextState = currentState + 1;
                    var prevState = currentState - 1;
                    if (currentState == 0) {
                        prevState = 50;
                    }
                    if (currentState == 50) {
                        nextState = 0;
                    }
                    response = response.toString();
                    response = response.replace("US Energy Consumption", req.params.selected_state + " Energy Consumption");
                    response = response.replace("var state", "var state = " + "'" + req.params.selected_state + "'");
                    response = response.replace("var coal_counts", "var coal_counts = [" + coal + "]");
                    response = response.replace("var natural_gas_counts", "var natural_gas_counts = [" + naturalGas + "]");
                    response = response.replace("var nuclear_counts", "var nuclear_counts = [" + nuclear + "]");
                    response = response.replace("var petroleum_counts", "var petroleum_counts = [" + petroleum + "]");
                    response = response.replace("var renewable_counts", "var renewable_counts = [" + renewable + "]");
                    response = response.replace("Yearly Snapshot", fullNameOfState + " Yearly Snapshot");
                    response = response.replace('href="">XX</a> <!-- change XX to prev state','href="'+StatesName[prevState]["state_abbreviation"]+'">'+ StatesName[prevState]["state_abbreviation"] + '</a> <!-- change XX to prev state');
                    response = response.replace('href="">XX</a> <!-- change XX to next state','href="'+StatesName[nextState]["state_abbreviation"]+'">'+ StatesName[nextState]["state_abbreviation"] + '</a> <!-- change XX to next state');
                    response = response.replace('<img src="/images/noimage.jpg" alt="No Image"', '<img src="/images/' + req.params.selected_state + '.jpg"' + ' alt="' + req.params.selected_state + '"');
                    response = response.replace("<!-- Data to be inserted here -->", "<!-- Data to be inserted here -->\n" + tableValue.substring(0,tableValue.length-1));
                    WriteHtml(res, response);
                }
            }); 
        });
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here

        db.all("SELECT * FROM Consumption ORDER BY state_abbreviation", (err,rows) => {
            var energyCounts = {};
            for (let i = 0; i < rows.length; i++) {
                var stateKey = rows[i]["state_abbreviation"];
                if (!energyCounts[stateKey]) {
                    energyCounts[stateKey] = [];
                    energyCounts[stateKey][0] = rows[i][req.params.selected_energy_type]; 
                } else {
                    energyCounts[stateKey][energyCounts[stateKey].length] = rows[i][req.params.selected_energy_type];
                }
            }
            
            var tableValue = "";
            for (let i = 0; i < energyCounts["AK"].length; i++) {
                var totalEnergy = 0;
                tableValue = tableValue + "<tr>\n" + "<td>" + (1960 + i) + "</td>\n";
                for (key in energyCounts) {
                    tableValue = tableValue + "<td>" + energyCounts[key][i] + "</td>\n";
                    totalEnergy = totalEnergy + energyCounts[key][i];
                }
                tableValue = tableValue + "<td>" + totalEnergy + "</td>\n";
                tableValue = tableValue + "</tr>\n";
            }
            var energyType = req.params.selected_energy_type.charAt(0).toUpperCase() + req.params.selected_energy_type.slice(1);
            if (energyType == "Natural_gas") {
                energyType = "Natural Gas";
            }
            db.all("PRAGMA table_info(Consumption)", (err,rows) => {
                var energyList = []
                for (let i = 2; i < rows.length; i++) {
                    energyList[i-2] = rows[i]["name"];
                }
                var currentEnergyIndex = -1;
                for (let i = 0; i < energyList.length; i++) {
                    if (req.params.selected_energy_type == energyList[i]) {
                        currentEnergyIndex = i
                    }
                }
                if (currentEnergyIndex === -1) {
                    Write404ErrorEnergy(res,req.params.selected_energy_type);
                }
                else {
                    var nextEnergyIndex = currentEnergyIndex + 1;
                    var prevEnergyIndex = currentEnergyIndex - 1;
                    if (currentEnergyIndex == (energyList.length - 1)) {
                        nextEnergyIndex = 0;
                    }
                
                    if (currentEnergyIndex == 0) {
                        prevEnergyIndex = energyList.length - 1;
                    }
                    var nextEnergyStr = energyList[nextEnergyIndex];
                    var prevEnergyStr = energyList[prevEnergyIndex];
                    nextEnergyStr = nextEnergyStr.replace("_"," ");
                    prevEnergyStr = prevEnergyStr.replace("_"," ");

                    response = response.toString();
                    response = response.replace("US Energy Consumption", "US " + energyType + " Consumption");
                    response = response.replace("var energy_counts", "var energy_counts = " + JSON.stringify(energyCounts));
                    response = response.replace("var energy_type", "var energy_type = '" + energyType + "'");
                    response = response.replace("Consumption Snapshot", energyType + " Consumption Snapshot");
                    response = response.replace('href="">XX</a> <!-- change XX to prev energy type', "href='"+energyList[prevEnergyIndex]+"'>" + prevEnergyStr +"</a> <!-- change XX to prev energy type");
                    response = response.replace('href="">XX</a> <!-- change XX to next energy type', "href='"+energyList[nextEnergyIndex]+"'>" + nextEnergyStr +"</a> <!-- change XX to next energy type");
                    response = response.replace('<img src="/images/noimage.jpg" alt="No Image"', '<img src="/images/' + req.params.selected_energy_type + '.jpg" alt="' + req.params.selected_energy_type + '"');
                    response = response.replace("<!-- Data to be inserted here -->", tableValue);
                    WriteHtml(res, response);
                }
            });
        });
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

function Write404ErrorYear(res, year) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: no data for year ' + year + '.');
    res.end();
}

function Write404ErrorState(res, state) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: no data for state ' + state + '.');
    res.end();
}

function Write404ErrorEnergy(res, type) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: no data for energy type of ' + type + '.');
    res.end();
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
