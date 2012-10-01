var fs = require('fs');
var path = require('path');

var mime = require('mime');
var imagemagick = require('imagemagick');
var db = require('mongojs').connect('node', ['imgList']);


var imageFolder = './images/';

exports.index = function(req, res) {
	res.render('index');
};

exports.uploadForm = function(req, res) {
	res.render('uploadForm');
};

exports.upload = function(req, res) {
	var image = req.files.imgs;
	
	if (image.name === '') {
		res.json( {result: false} );
		return;
	}
	
	var fileSize = image.size | 0;
	var fileType = mime.lookup( image.name );
	var imageId = generateUuid();
	
	renameImg(image, imageId);
	
	var imageInfo = {
		imageId: imageId,
		fileName: image.name,
		fileSize: fileSize,
		fileType: fileType,
		dateCreated: new Date()
	};
	db.imgList.save( imageInfo );
	
	res.json( { result: true, imageInfo: imageInfo } );
};

// UUID generator.
generateUuid = function() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

renameImg = function(image, uuid) {
    var tmp_path = image.path;
    var target_path = imageFolder + uuid;
	
    //tmp_path -> target_path로 이동하면서 파일명을 바꿉니다.        
    fs.rename(tmp_path, target_path, function(err) {
        if(err) throw err;
    });
};

// 이미지 보여주기.
exports.renderImage = function(req, res) {
	var imageId = req.params.imageId;
	var imagePath = imageFolder + imageId;
	
	db.imgList.findOne({imageId: imageId}, function (err, imageInfo) {
		if (err || imageInfo === null) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(imageId + ' is not found.');
		}
		
		renderImage(imagePath, imageInfo.fileType, res);
	});
};

exports.renderResizedByWidthImage = function(req, res) {
	var imageId = req.params.imageId;
	var width = req.params.width;
	
	var imagePath = imageFolder + imageId;
	var resizedImagePath = imageFolder + imageId + "_w_" + width;
	
	db.imgList.findOne({imageId: imageId}, function (err, imageInfo) {
		if (err || imageInfo === null) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(imageId + ' is not found.');
		}
		
		path.exists(resizedImagePath, function (exists) {
			if (!exists) {
				resizeImage(imagePath, resizedImagePath, true, width, function (err) {
					if (err) {
						throw err;
					} else {
						renderImage(resizedImagePath, imageInfo.fileType, res);
					}
				});
			} else {
				renderImage(resizedImagePath, imageInfo.fileType, res);
			}
		});
	});
};

exports.renderResizedByHeightImage = function(req, res) {
	var imageId = req.params.imageId;
	var height = req.params.height;
	
	var imagePath = imageFolder + imageId;
	var resizedImagePath = imageFolder + imageId + "_h_" + height;
	
	db.imgList.findOne({imageId: imageId}, function (err, imageInfo) {
		if (err || imageInfo === null) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(imageId + ' is not found.');
		}
		
		path.exists(resizedImagePath, function (exists) {
			if (!exists) {
				resizeImage(imagePath, resizedImagePath, false, height, function (err) {
					if (err) {
						throw err;
					} else {
						renderImage(resizedImagePath, imageInfo.fileType, res);
					}
				});
			} else {
				renderImage(resizedImagePath, imageInfo.fileType, res);
			}
		});
	});
};

renderImage = function(imagePath, fileType, res) {
	fs.readFile(imagePath, "binary", function (err, file) {
		if (err) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(imageId + ' is not found.');
		} else {
			res.writeHead(200, {'Content-Type': fileType});
			res.write(file, "binary");
			res.end();
		}
	});
}

resizeImage = function(srcPath, dstPath, isWidth, size, callback) {
	imagemagick.convert( [ srcPath, '-thumbnail', (isWidth ? size : 'x' + size) + '>', dstPath ], function (err, metadata) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};

exports.renderResizedAndCropImage = function(req, res) {
	var imageId = req.params.imageId;
	var width = req.params.width;
	var height = req.params.height;
	
	var imagePath = imageFolder + imageId;
	var resizedImagePath = imageFolder + imageId + "_w_" + width + "_h_" + height;
	
	db.imgList.findOne({imageId: imageId}, function (err, imageInfo) {
		if (err || imageInfo === null) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end(imageId + ' is not found.');
		}
		
		path.exists(resizedImagePath, function (exists) {
			if (!exists) {
				resizeAndCropImage(imagePath, resizedImagePath, width, height, function (err) {
					if (err) {
						throw err;
					} else {
						renderImage(resizedImagePath, imageInfo.fileType, res);
					}
				});
			} else {
				renderImage(resizedImagePath, imageInfo.fileType, res);
			}
		});
	});
};

resizeAndCropImage = function(srcPath, dstPath, width, height, callback) {
	imagemagick.convert( [ srcPath, 
						'-resize', (width * 2) + 'x',
						'-resize', 'x' + (height * 2) + '<', 
						'-resize', '50%',
						'-gravity', 'center', 
						'-crop', width + 'x' + height + '+0+0',
						'+repage', 
						dstPath ], function (err, metadata) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};
