const PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();
var session=  require('express-session');
var fs = require('fs');


var mysql = require('mysql');
const path = require('path');
const multer = require('multer');



const mysqlConnection = require('./bd');
app.use(session(
    {
        //secret: 'MD5'
        secret: 'secret',
	    resave: true,
	    saveUninitialized: true
    }

))


app.use(express.json());
app.use(express.urlencoded({extended: true}));

/*
    auteticacion 
*/
let idu=0;
app.post('/log', function (req,res){
	var user = req.body.user;
    var pass = req.body.pass;
    
    if (user && pass) 
    {
		mysqlConnection.query('SELECT * FROM usuarios WHERE nombre = ? AND password = ?', [user, pass], function(error, results, fields) {
			if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = user;
                idu=results[0].id
                
                console.log(idu)
                var dir = `./${user}`;
                if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
                    }
                
                    res.json(
                        {
                            log: true,
                            name :`${user}`,
                            error : false
                        })
            } 
            else 
            {
                res.json(
                    {
                        log: false,
                        name :null,
                        error : true,
                        status: ' Username o Password mal!'
                    }   )
			}			
			
		});
    } 
    else 
    {
        res.json(
        {
            log: false,
            name :null,
            error : true,
            status: 'Introducir los dos valores '
        }   );
    }
});


app.get('/', (req,res)=>{
    if(req.session.loggedin)
    {
        return res.send('Iniciado!');
    }
    else
    {
        return res.send('no iniciado :(!');
    }
});


app.post('/add',(req,res)=>
{
    var user = req.body.user;
    var pass = req.body.pass;
    
    if (user && pass) 
    {
		mysqlConnection.query('SELECT * FROM usuarios WHERE nombre = ? ', [user], function(error, results, fields) {
            if (results.length == 0) 
            {//se puede agragar ya que no existe otro ususario
                mysqlConnection.query('INSERT INTO usuarios (nombre,password) VALUES  (?,?)', [user,pass], function(error, results, fields) 
                {
                    
                    res.json(
                        {
                            add: true,
                            name: `${user}`,
                            error: false
                        }   )
                });

            } 
            else 
            {// ya existe un usuario 
                res.json(
                    {
                        status: 'Usuario existe!',
                        error: true
                    }   )
			}			
			
		});
    } 
    else 
    {
        res.json(
        {
            error: true,
            status: 'Introducir los dos valores '
        }   );
    }

});



app.get('/logout', (req,res)=>{
    req.session.destroy();
    res.json({
        log:false
        
    })
});

let storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, `./${req.session.username}`)
    },
    filename:(req, file, cb)=>{
        cb(null, file.fieldname + '-'+ Date.now()+ path.extname(file.originalname));
    }
});


const upload = multer({ storage });

app.post( '/subir',upload.single('file'),(req,res)=>{
    if(req.session.loggedin)
    {
   
    console.log(`Storage location is ${req.hostname}/${req.file.path}`);
    console.log(req.body)

    var id = idu
    var titulo = req.file.filename;
    var tipo = req.file.mimetype;
    var No= req.file.originalname;
    var tam=req.file.size;
    mysqlConnection.query("INSERT INTO archivos(id,titulo,nom_or,tipo,size) VALUES (?,?,?,?,?)", [id, titulo,No, tipo,tam], function(err, rows, fields){
        if(err) 
        {
            console.log(err);
            res.send({
                add:false
            })   
        }
        else
        {
            

        }

    });
    
    
    
    return res.send(req.file); 
    }
    else
    {
        res.json(
            {
                log: false,
                eror: "No inicio session"
            })
    }

});
    

app.get('/userA', (req, res) => {
    mysqlConnection.query('SELECT * FROM usuarios', (err, rows, fields) => {
        if(!err){
            res.json(rows);
        } else{
            console.log(err);
        }
    });
});


app.get('/del', (req, res) => {
    mysqlConnection.query('DELETE FROM usuarios ', (err, rows, fields) => {
        mysqlConnection.query('DELETE FROM archivos ', (err, rows, fields) => {
            res.json(
                {
                    delete: true,
                    status: 'borrado '
                }   )
        });
    });
});


app.get('/datos', (req, res) => {
    if(req.session.loggedin)
    {
    mysqlConnection.query('SELECT * FROM archivos where id=?',idu, (err, rows, fields) => {
        if(!err){
            res.json(rows);
        } else{
            console.log(err);
        }
    });
    }
    else
    {
        res.json(
            {
                log: false,
                eror: "No inicio session"
            })
    }
});


app.get('/download:nombre', function(req, res) {
    if(req.session.loggedin)
    {
    //var archivo = req.body;
    var archivo=req.url;
    console.log(archivo);
    var file = `./${req.session.username}/` + archivo.nombre;

    res.download(file); 
    }
    else
    {
        res.json(
            {
                log: false,
                eror: "No inicio session"
            })
    }
});


app.listen(PORT, ()=> console.log(`Server is up on port: ${PORT}`));