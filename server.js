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
        rolling: true,
        saveUninitialized: false,
        cookie: {
                expires : 180*1000*10
        }
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
                //req.session.cookie.maxAge=new Date(Date.now() + 20000)
                
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

app.delete('/del/:id', (req,res)=>{

    if(req.session.loggedin)
    {
    mysqlConnection.query('SELECT titulo FROM archivos WHERE id_archivos = ? ',req.params.id, function(error, results, fields) 
    {
        var ti=results;
       
            // if no error, file has been deleted successfully
            mysqlConnection.query('DELETE  FROM archivos WHERE id_archivos = ? ',req.params.id, function(error, results, fields) 
            {
                    console.log("dfsdf");
                    console.log(error);
                    
                    fs.unlink(`./${req.session.username}/${ti[0].titulo}`, function (err) {
                        
                        if (err) 
                        {
                            res.json(
                                {
                                    error: true,
                                    status: 'no se borro '
                                }   );
                            throw err;
                        }
                       
                        console.log('File deleted!');
                        res.json(
                        {
                            error: false,
                            status: 'Elemento borrado '
                        }   );
                    });
                    

            });
            
        });
    }
    else
    {
        return res.send('no iniciado :(!');
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


app.get('/download/:nombre', function(req, res) {
    if(req.session.loggedin)
    {
    //var archivo = req.body;
    var archivo=req.params;
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


app.get('/datos2', (req, res) => {
    
    mysqlConnection.query('SELECT * FROM archivos', (err, rows, fields) => {
        if(!err){
            res.json(rows);
        } else{
            console.log(err);
        }
    });

    
});


app.put('/actualizar', (req, res) => {
    
    
    var pass = req.body.pass;
    var Npass = req.body.Npass;
    console.log(idu);
    if(req.session.loggedin)
    {
        console.log(idu);   
        console.log(Npass); 
        mysqlConnection.query('SELECT * FROM usuarios where password=? and id=?  ',[pass,idu], (err, rows, fields) => {
            if(rows.length==1)
            {
                console.log(rows);
                id=rows[0].id;
                console.log(id);   
                console.log(Npass);    

                mysqlConnection.query('UPDATE usuarios SET password=?  where id=? ',[Npass,id], (err, rows) => {
                  
                    if(!err)
                    {
                        res.json(
                            {
                                error: false,
                                eror: "Actualizado"
                            })
                    }
                    else
                    {
                        console.log(err)
                        res.json(
                            {
                                error: true,
                                eror: "no Actualizado"
                            })

                    }

                });
                
            }
            else
            {
                res.json(
                    {
                        error: true,
                        eror: "contraseña incorrecta"
                    })
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





app.listen(PORT, ()=> console.log(`Server is up on port: ${PORT}`));