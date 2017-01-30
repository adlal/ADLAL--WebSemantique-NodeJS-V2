var express = require('express');
var morgan = require('morgan'); // Charge le middleware de logging
var favicon = require('serve-favicon');
var logger = require('log4js').getLogger('Server');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var session = require('express-session');
var app = express();

// config
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('combined')); // Active le middleware de logging

app.use(express.static(__dirname + '/public')); // Indique que le dossier /public contient des fichiers statiques (middleware chargé de base)

var sess = {
    secret: 'keyboard cat'
};
app.use(session(sess));
logger.info('server start');

app.get('/', function(req, res){
    res.redirect('/login');
});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/inscription', function(req, res){
    res.render('inscription');
});

// Deconnexion
app.get('/deconnexion',function(req, res){
    sess.valid = false;
    res.redirect("/login");
});

// Connexion avec son login et mdp
app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    var pool =  mysql.createPool({
        connectionLimit : 100, //important
        host : 'localhost',
        user : 'root',
        password: 'root',
        database: 'pictionnary'
    });


    pool.getConnection(function(err,connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        }

        connection.query("SELECT * from users WHERE email='" + username + "' AND password = '" + password + "'", function (err, rows) {
            connection.release();
            if (!err) {
                if (rows.length > 0){
                    sess.valid = true;
                    sess.profileEpic = rows[0].profilepic;
                    sess.prenom = rows[0].prenom;
                    sess.password = rows[0].password;
                    sess.website = rows[0].website;
                    sess.ville = rows[0].ville;
                    sess.nom=rows[0].nom;
                    sess.id = rows[0].id;
                    sess.sexe = rows[0].sexe;
                    sess.tel = rows[0].tel;
                    sess.birthdate = rows[0].birthdate;
                    sess.taille = rows[0].taille;
                    sess.couleur = rows.couleur;
                    sess.email = rows[0].email;
                    res.redirect("/profile");
                }
                else{
                    sess.valid = false;
                    res.redirect("/login");
                }
            }
        });

        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        });
    });

});

/* On affiche le profil  */
app.get('/profile', function (req, res) {
    if (sess.valid) {
            var pool =  mysql.createPool({
                connectionLimit : 100, //important
                host : 'localhost',
                user : 'root',
                password: 'root',
                database: 'pictionnary'
            });

            pool.getConnection(function(err,connection) {
                if (err) {
                    connection.release();
                    res.json({"code": 100, "status": "Erreur de connexion à la DB"});
                    return;
                }

                connection.query("SELECT * from drawings WHERE u_email='" + sess.email + "' AND reponse is null", function (err, rows) {
                    connection.release();
                    if (!err) {
                        res.render('profile', {
                            photo: sess.profileEpic,
                            prenom: sess.prenom,
                            nom : sess.nom,
                            result:rows
                        });
                    }
                    else{
                        throw err;
                    }

                });

                connection.on('error', function (err) {
                    res.json({"code": 100, "status": "Erreur de connexion à la DB"});
                    return;
                });
            });
        }
    else
        res.redirect("/login");
    // On redirige vers la login si l'utilisateur n'a pas été authentifier
    // Afficher le button logout
});

/* On modifie le profil  */
app.post('/updateInfo', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var nom = req.body.nom;
    var prenom = req.body.prenom;
    var sexe = req.body.sexe;
    var telephone = req.body.tel;
    var siteweb = req.body.website;
    var birthdate = req.body.birthdate;
    var ville = req.body.ville;
    var taille = req.body.taille;
    var couleur = req.body.color;
    var profilepic = req.body.profilepic;

    sess.profileEpic = profilepic;
    sess.couleur = couleur;

    var pool =  mysql.createPool({
        connectionLimit : 100, //important
        host : 'localhost',
        user : 'root',
        password: 'root',
        database: 'pictionnary'
    });

    pool.getConnection(function(err,connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        }
        var req = "UPDATE users SET `password` ='"+password+"' ,`website` = '"+siteweb+"',`ville` ='"+ville+"',`couleur` = '"+couleur+"',`profilepic` = '"+profilepic+"', `email` = '"+email+"', `nom` = '"+nom+"', `prenom` = '"+prenom+"', `sexe` = '"+sexe+"', `tel` = '"+telephone+"', `birthdate` = '"+birthdate+"', `taille` = '"+taille+"'  WHERE `id` = "+sess.id;
        connection.query(req, function (err, rows) {
            connection.release();
            if (err) throw err;
            else res.redirect("/profile")
        });

        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        });
    });
});

app.get('/modificationInfo', function(req, res){
    if (sess.valid) {
        var pool =  mysql.createPool({
            connectionLimit : 100, //important
            host : 'localhost',
            user : 'root',
            password: 'root',
            database: 'pictionnary'
        });

        pool.getConnection(function(err,connection) {
            if (err) {
                connection.release();
                res.json({"code": 100, "status": "Erreur de connexion à la DB"});
                return;
            }

            connection.query("SELECT * from users WHERE email='" + sess.email + "'", function (err, rows) {
                connection.release();
                if (!err) {
                    res.render('modificationInfo', {
                        email: sess.email,
                        prenom : sess.prenom,
                        nom : sess.nom,
                        sexe : sess.sexe,
                        telephone : sess.tel,
                        birthdate : sess.birthdate,
                        taille : sess.taille,
                        couleur : sess.couleur,
                        password : sess.password,
                        website : sess.website,
                        ville : sess.ville,

                        result:rows
                    });
                }
                else{
                    throw err;
                }

            });

            connection.on('error', function (err) {
                res.json({"code": 100, "status": "Erreur de connexion à la DB"});
                return;
            });
        });
    }else
        res.redirect("/login");
});

/* On inscrit un nouvel utilisateur  */
app.post('/register', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var nom = req.body.nom;
    var prenom = req.body.prenom;
    var sexe = req.body.sexe;
    var telephone = req.body.tel;
    var siteweb = req.body.website;
    var birthdate = req.body.birthdate;
    var ville = req.body.ville;
    var taille = req.body.taille;
    var couleur = req.body.color;
    var profilepic = req.body.profilepic;

    var pool =  mysql.createPool({
        connectionLimit : 100, //important
        host : 'localhost',
        user : 'root',
        password: 'root',
        database: 'pictionnary'
    });


    pool.getConnection(function(err,connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        }
        var req = "INSERT INTO users (email, password, nom, prenom, tel, website, sexe, birthdate, ville, taille, couleur, profilepic)VALUES('"+email+"','"+password+"','"+nom+"','"+prenom+"','"+telephone+"','"+siteweb+"','"+sexe+"','"+birthdate+"','"+ville+"',"+taille+",'"+couleur+"','"+profilepic+"')";
        connection.query(req, function (err, rows) {
            connection.release();
            if (err) throw err;
            else res.redirect("/login")
        });

        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        });
    });
});

/* On ajoute un dessin  */
app.post('/paint', function (req, res) {

    var drawingCommands=req.body.drawingCommands;
    var picture=req.body.picture;
    var userId = sess.id;
    var email = req.body.destinataire;
    var titre = req.body.titre;
    var pool =  mysql.createPool({
        connectionLimit : 100, //important
        host : 'localhost',
        user : 'root',
        password: 'root',
        database: 'pictionnary'
    });


    pool.getConnection(function(err,connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        }
        var req = "INSERT INTO drawings(commandes, images, u_id, u_email, titre) VALUES ('"+drawingCommands+"','"+ picture +"',"+ userId+",'"+email+"','"+titre+"')";
        connection.query(req, function (err, rows) {
            connection.release();
            if (err) throw err;
            else res.redirect("/profile")
        });

        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        });
    });
});

/* On affiche les dessins  */
app.get('/paint', function(req, res){
    if (sess.valid) {
        res.render('paint', {couleur: sess.couleur});
    }else
        res.redirect("/login");
});

app.get('/reponse', function(req, res){
    if (sess.valid) {
        sess.idImage = req.query.id;
        var pool =  mysql.createPool({
            connectionLimit : 100, //important
            host : 'localhost',
            user : 'root',
            password: 'root',
            database: 'pictionnary'
        });

        pool.getConnection(function(err,connection) {
            if (err) {
                connection.release();
                res.json({"code": 100, "status": "Erreur de connexion à la DB"});
                return;
            }

            connection.query("SELECT * from drawings where id="+sess.idImage, function (err, rows) {
                connection.release();
                if (!err) {
                    res.render('reponse', {
                        image: rows[0].images
                    });
                }
                else {
                    throw err;
                }
            });
        });
    }else
        res.redirect("/login");
});

app.post('/reponse', function (req, res) {
    var reponse = req.body.reponse;

    var pool =  mysql.createPool({
        connectionLimit : 100, //important
        host : 'localhost',
        user : 'root',
        password: 'root',
        database: 'pictionnary'
    });

    pool.getConnection(function(err,connection) {
        if (err) {
            connection.release();
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        }
        var req = "UPDATE drawings SET reponse='"+reponse+"' WHERE id = "+sess.idImage;
        connection.query(req, function (err, rows) {
            connection.release();
            if (err) throw err;
            else res.redirect("/profile")
        });

        connection.on('error', function (err) {
            res.json({"code": 100, "status": "Erreur de connexion à la DB"});
            return;
        });
    });
});

app.listen(1313);



