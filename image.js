
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  // 올라오는 용량을 제한합니다.
  app.use(express.limit('5mb'));
  // 기본 TEMP 폴더를 지정하기 위해 UPLOADDIR 을 지정합니다.
  app.use(express.bodyParser({uploadDir: '/tmp'}));
  // app.use(express.bodyParser({uploadDir: __dirname + '/tmp'}));
  // app.use(express.bodyParser());
  app.use(express.methodOverride());
  // 로그에 클라이언트의 FAVICON 요청을 무시하도록 해줍니다.
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

// 파일을 올리기 위한 FORM 페이지.
app.get('/upload', routes.uploadForm);
// 업로드된 파일을 받고 결과를 보여주기 위한 페이지.
app.post('/upload', routes.upload);
// 이미지 렌더링.
app.get('/:imageId', routes.renderImage);
// 썸네일 이미지 렌더링.
app.get('/:imageId/w/:width', routes.renderResizedByWidthImage);
app.get('/:imageId/h/:height', routes.renderResizedByHeightImage);

app.get('/:imageId/w/:width/h/:height', routes.renderResizedAndCropImage);

app.listen(8088);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
