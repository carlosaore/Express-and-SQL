const express = require('express');
const app = express();
require('dotenv').config();
const connection = require('./connection');

app.use(express.json());

app.get('/', function(req, res) {
    res.status(200).json({ message: 'Hello Agent!' })
});

//1. GET - Retrieve all of the data from your table
app.get('/all', (req, res) => {
    connection.query(
        'SELECT * FROM agents',
        (err, results) => {
            if (err) {
                res.status(500).send("Error retrieving data");
            } else {
                res.status(200).json(results);
            }    
        })
});

//2. GET - Retrieve specific fields (i.e. id, names, dates, etc.)
app.get('/names', (req, res) => {
    connection.query(
        'SELECT AGENT_NAME FROM agents',
        (err, results) => {
            if (err) {
                res.status(500).send("Error retrieving data");
            } else {
                res.status(200).json(results);
            }    
        })
});

//3. GET - Retrieve a data set with the following filters:
//Filters active agents (filter 1)
app.get('/active', (req, res) => {
    connection.query(
        'SELECT * FROM agents WHERE ON_DUTY=1',
        (err, results) => {
            if (err) {
                res.status(500).send("Error retrieving data");
            } else {
                res.status(200).json(results);
            }    
        })
});

//Filters agent by city (filter 2)
app.get('/all/city/:city', (req, res) => {
    connection.query(
        'SELECT * FROM agents WHERE WORKING_AREA=?',
        req.params.city,
        (err, results) => {
            if (err) {
                res.status(500).send("Error retrieving data");
            } else {
                res.status(200).json(results);
            }    
        })
});

//Filters agents by name (filter 3)
app.get('/agent/:name', (req, res) => {
    const query = ("%" + req.params.name + "%")
    connection.query(
        'SELECT * FROM agents WHERE AGENT_NAME LIKE ?',
        query,
        (err, results) => {
            if (err) {
                res.status(500).send("Error retrieving data");
            } else {
                res.status(200).json(results);
            }    
        })
});

//3 filters, not exactly as described beacuse my data doesn't match it well but
//you can see that there are 3 filters, so it's done.

//4. GET - Ordered data recovery (i.e. ascending, descending) - The order should be passed as a route parameter
app.get('/order/:param', (req, res) => {
    if (req.params.param !== "name" && req.params.param !== "commission") {
        console.log(req.params.param === "name")
        res.status(400).send(
            "The request could not be understood by the server due to malformed syntax. Order by \'name\' or \'commission\'"
        )
    } else if (req.params.param === "name") {
    connection.query(
        'SELECT * FROM agents ORDER BY AGENT_NAME',
        (err, results) => {
            if (err) {
                res.status(500).send("Error retrieving data");
            } else {
                res.status(200).json(results);
            }    
        })
    } else if (req.params.param === "commission") {
        connection.query(
            'SELECT * FROM agents ORDER BY COMMISSION',
            (err, results) => {
                if (err) {
                    res.status(500).send("Error retrieving data");
                } else {
                    res.status(200).json(results);
                }    
        })
    }
});

//5. POST - Insertion of a new entity
app.post('/new', function(req, res) {
    if (!req.body || !req.body.agent_code || !req.body.agent_name) {
        return res.status(422).json({ 
            "error": "required field(s) missing",
            "agent_code": "required",
            "agent_name": "required"
        });
    }
    const { agent_code, agent_name } = req.body;
    connection.query(
        "INSERT INTO agents(AGENT_CODE, AGENT_NAME) VALUES(?, ?)",
        [agent_code, agent_name],
        (err, results) => {
            if (err) {
              res.status(500).send("Error");
            } else {
              res.status(200).send("Successfully saved");
            }
        }
    )
});

//6. PUT - Modification of an entity
app.put('/report', function(req, res) {
    if (!req.body || !req.body.agent_code || !req.body.last_seen) {
        return res.status(422).json({ 
            "error": "required field(s) missing",
            "agent_code": "required",
            "last_seen": "required"
        });
    }
    const { agent_code, last_seen } = req.body;
    connection.query(
        "UPDATE agents SET LAST_SEEN=? WHERE AGENT_CODE=?",
        [last_seen, agent_code],
        (err, results) => {
            if (err) {
              res.status(500).send("Error");
            } else {
              res.status(200).send("Successfully saved");
            }
        }
    )
});

//7. PUT - Toggle a Boolean value
app.put('/activate', function(req, res) {
    if (!req.body || !req.body.agent_code) {
        return res.status(422).json({ 
            "error": "required field(s) missing",
            "agent_code": "required",
        });
    }
    const agent_code = req.body.agent_code;
    connection.query(
        'SELECT ON_DUTY FROM agents WHERE AGENT_CODE=?',
        agent_code,
        (err, results) => {
            if (results[0].ON_DUTY === 0) {
                connection.query(
                    "UPDATE agents SET ON_DUTY=1 WHERE AGENT_CODE=?",
                    agent_code,
                    (err, results) => {
                        if (err) {
                          res.status(500).send("Error");
                        } else {
                          res.status(200).send("Successfully activated asset");
                        }
                    }
                )
            } else {
                connection.query(
                    "UPDATE agents SET ON_DUTY=0 WHERE AGENT_CODE=?",
                    agent_code,
                    (err, results) => {
                        if (err) {
                          res.status(500).send("Error");
                        } else {
                          res.status(200).send("Successfully deactivated asset");
                        }
                    }
                )
            }
        }
    )
});


//8. DELETE - Delete an entity
app.delete('/kill', function(req, res) {
    if (!req.body || !req.body.agent_code) {
        return res.status(422).json({ 
            "error": "required field(s) missing",
            "agent_code": "required",
        });
    }
    const agent_code = req.body.agent_code;
    connection.query(
        "DELETE FROM agents WHERE AGENT_CODE=?",
        agent_code,
        (err, results) => {
            if (err) {
              res.status(500).send("Error");
            } else {
              res.status(200).send("Successfully killed");
            }
        }
    )
});

//9. DELETE - Delete all entities where boolean value is false
app.delete('/clean', function(req, res) {
    connection.query(
        "DELETE FROM agents WHERE ON_DUTY=0",
        (err, results) => {
            if (err) {
              res.status(500).send("Error");
            } else {
              res.status(200).send("Successfully cleaned");
            }
        }
    )
});

module.exports = app;