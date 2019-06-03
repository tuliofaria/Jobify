//Inicializando módulos de terceiros. Precisamos da dependencia "Express" para rodar a aplicação
const express = require('express')      //Express trabalha com request/response
const app = express()       //Cria uma nova aplicação Express
const bodyParser = require('body-parser')

//Criandp uma nova conexão com o banco de dados sqlite
const sqlite = require('sqlite')
const dbConnection = sqlite.open('banco.sqlite', { Promise })

//Inicializando módulos de terceiros. Precisamos da dependencia "EJS" para rodar a aplicação
app.set('view engine', 'ejs')       //EJS trabalha com templates de HTML
app.use(express.static('public'))   //Se não achar nada depois da barra "/", pega o que tiver na pasta public
app.use(bodyParser.urlencoded({extended: true}))

//Toda vez que bater na barra(passando nada) "/" chama a função (response). O get suporta funcao await
app.get('/', async(request, response) => {
    const db = await dbConnection
    const categoriasDb = await db.all('select * from categorias;')    //pega todas as linhas da tabela categorias no banco de dados
    const vagas = await db.all('select * from vagas;')
    const categorias = categoriasDb.map(cat => {
        return{
            ...cat,     //operador espalhar(...), espalha dados de uma categoria dentro de um vetor, copiando todos os campos de categorias e botando no objeto
            vagas: vagas.filter(vaga => vaga.categoria === cat.id)      //cria um novo item e anda no vetor filtrando por esse item
        }
    })
    response.render('home', {   //passa essas categorias la pro arquivo ejs
        categorias
    })
})

//Toda vez que bater na barra vaga(passando vaga) "/vaga" chama a função (response)
app.get('/vaga/:id', async(request, response) => {      //tem que ser assincrono porque vamos trazer dados do banco de dados
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = '+ request.params.id)      //usamos get pra pegar apenas 1, caso contrario seria all
    response.render('vaga', {
        vaga
    })
})

//funcao get para a pagina de administrador
app.get('/admin', (request, response) => {
    response.render('admin/home')
})

//funcao get para a pagina de gerenciamento de vagas
app.get('/admin/vagas', async(request, response) => {       //tem que ser assincrono porque vamos trazer dados do banco de dados
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')      //carregar todas as vagas do banco
    response.render('admin/vagas', { vagas })
})

//funcao get para exlcuir vagas
app.get('/admin/vagas/delete/:id', async(request, response) => {
    const db = await dbConnection
    await db.run('delete from vagas where id = ' + request.params.id)
    response.redirect('/admin/vagas')
})

//funcao get para criar nova vaga
app.get('/admin/vagas/nova', async(request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    response.render('admin/nova-vaga', { categorias })
    //const db = await dbConnection
    //await db.run('delete from vagas where id = ' + request.params.id)
    //response.redirect('/admin/vagas')
})
app.post('/admin/vagas/nova', async(request, response) => {
    const {titulo, descricao, categoria} = request.body
    const db = await dbConnection
    await db.run(`insert into vagas(categoria, titulo, descicao) values('${categoria}', '${titulo}', '${descricao}')`)
    response.redirect('/admin/vagas')
})

//funcao get para editar nova vaga
app.get('/admin/vagas/editar/:id', async(request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id = ' + request.params.id)
    response.render('admin/editar-vaga', { categorias , vaga })
    //const db = await dbConnection
    //await db.run('delete from vagas where id = ' + request.params.id)
    //response.redirect('/admin/vagas')
})
app.post('/admin/vagas/editar/:id', async(request, response) => {
    const {titulo, descricao, categoria} = request.body
    const {id} = request.param
    const db = await dbConnection
    await db.run(`update vagas categoria = ${categoria}, titulo = '${titulo}' , descicao = '${descricao}' where id = ${id}`)
    response.redirect('/admin/vagas')
})

//criando a tabela no banco de dados
const init = async() => {
    const db = await dbConnection   //espera a conexcao ficar pronta
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')     //cria tabela categorias no banco de dados
    //const categoria = 'Engineering Team'
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descicao TEXT);')     //cria tabela vagas no banco de dados
    //const categoria = 'Marketing Team'
    //await db.run(`insert into categorias(categoria) values('${categoria}')`)    //insere uma linha na tabela do bd, comado no formato template string
    //const vaga = 'Fullstack Develloper (Remoto)'
    //const descricao = 'Vaga para fullstack developer que fez o FullStack Lab no DevPleno'
    //const vaga = 'Marketing Digital (San Francisco)'
    //const descricao = 'Vaga para fullstack developer que fez o FullStack Lab no DevPleno'
    const vaga = 'Social Media (San Francisco)'
    const descricao = 'Vaga para fullstack developer que fez o FullStack Lab no DevPleno'
    //await db.run(`insert into vagas(categoria, titulo, descicao) values(2, '${vaga}', '${descricao}')`)    //insere uma linha na tabela do bd comado no formato template string
}
init()

//Abre na porta 3000 e verifica se tem algum erro
app.listen(3000, (erro) => {
    if(erro){
        console.log('Não foi possível iniciar o servidor Jobify.')
    }else{
        console.log('Servidor do Jobify rodando...')
    }
})