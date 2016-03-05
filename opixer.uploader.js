/**
* 以百度上传组件为基础二次封装 插件
* @file  opixer.uploader
* @author fuzuchang <fuzuchang@hotmail.com>
* @time  2016-02-22 下午20:26:11
* @Copyright (c) 2015-2016 http://www.meicuntech.com All rights reserved.
*/


/***
 * 传递服务器参数
 * fileType 文件类型 'sys' 系统文件或 'space' 用户空间图片
 * objType sys类型文件存储的路径 'ad' 广告图片 'auth' 认证图片 'mark' 等级图片存放目录 'tools' 增值服务图片存放目录
 * filename 文件表单name
 * taskId 任务编号
 * workId 稿件编号
 * 服务器回调json数据
 * msg : {url : 文件存储路径, filename : 文件上传表单name, name : 文件名, field : 文件上传后数据表记录id值 }
 */


;(function($, w) {
	"use strict";
	var pluginName = 'OPXUploader';
	function Upload($fileInput, options) {
		this.options = $.extend({}, $.fn[pluginName].defaults, options);
		this.fileInput = $fileInput;
		this.BDUploader = undefined;
		this.baseUrl = w.sUploadURI !== undefined?w.sUploadURI:'';
		this.allowNum = this.options.fileNumLimit;//剩余上传的个数
	}
	//插件扩展方法
	$.extend(Upload.prototype, {

		absolutePath:function(){
			if(this.baseUrl !=''){
				this.options.server = this.baseUrl + '/' + this.options.server;
				this.options.delUrl = this.baseUrl + '/' + this.options.delUrl;
				this.options.swf 	= this.options.swf;
			}
		},
		/**
		 * 初始化上传组件，监听各种事件
		 */
		initUploader:function(){
			var self = this;
				self.absolutePath();
				self.BDUploader = WebUploader.create(self.options);
			
				for(var funcName in self.options.uploadEvents ){
					if(typeof self.options.uploadEvents[funcName] == 'function'){
						switch (funcName) {
							case 'dndAccept':		//阻止此事件可以拒绝某些类型的文件拖入进来。目前只有 chrome 提供这样的 API，且只能通过 mime-type 验证。
								self.BDUploader.on(funcName,function(items){
									self.options.uploadEvents[funcName](items);
								});
								break;
							case 'filesQueued':		//当一批文件添加进队列以后触发。
								self.BDUploader.on(funcName,function(files){
									self.options.uploadEvents[funcName](files);
								});	
								break;
							case 'reset':			//当 uploader 被重置的时候触发。
							case 'startUpload':		//当开始上传流程时触发。
							case 'stopUpload':		//当开始上传流程暂停时触发。
							case 'uploadFinished':	//当所有文件上传结束时触发。
								self.BDUploader.on(funcName,function(){
									self.options.uploadEvents[funcName]();
								});	
								break;
							case 'uploadBeforeSend'://当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次。
								self.BDUploader.on(funcName,function(object,data ,headers ){
									self.options.uploadEvents[funcName](object,data ,headers);
								});	
								break;
							case 'uploadAccept':	//当某个文件上传到服务端响应后，会派送此事件来询问服务端响应是否有效。如果此事件handler返回值为false, 则此文件将派送server类型的uploadError事件。
								self.BDUploader.on(funcName,function(object,ret){
									self.options.uploadEvents[funcName](object,ret);
								});	
								break;
							case 'uploadProgress':	//上传过程中触发，携带上传进度。
								self.BDUploader.on(funcName,function(file ,percentage){
									self.options.uploadEvents[funcName](file ,percentage);
								});	
								break;
							case 'uploadError':		//当文件上传出错时触发。
								self.BDUploader.on(funcName,function(file ,reason){
									self.options.uploadEvents[funcName](file ,reason);
								});	
								break;
							case 'uploadSuccess':	//当文件上传成功时触发。//用户自定义回调处理
								self.BDUploader.on(funcName,function(file ,response){
									self.options.uploadEvents[funcName](file,response);
								});	
								break;
							case 'error':			//当validate不通过时，会以派送错误事件的形式通知调用者。通过upload.on('error', handler)可以捕获到此类错误，目前有以下错误会在特定的情况下派送错来。
								self.BDUploader.on(funcName,function(type ){
									self.options.uploadEvents[funcName](type );
								});	
								break;
							case 'beforeFileQueued'://当文件被加入队列之前触发，此事件的handler返回值为false，则此文件不会被添加进入队列。
							case 'fileQueued':		//当一批文件添加进队列以后触发。
							case 'fileDequeued':	//当文件被移除队列后触发。
							case 'uploadStart':		//某个文件开始上传前触发，一个文件只会触发一次。
							case 'uploadComplete':	//不管成功或者失败，文件上传完成时触发。
							default:
								self.BDUploader.on(funcName,function(file){
									self.options.uploadEvents[funcName](file);
								});	
								break;
						}
					}
				}
			
				/**
				 * 默认上传添加队列处理
				 */
				if(!self.options.uploadEvents.fileQueued){
					self.BDUploader.on('fileQueued',function(file ){
						
						if(self.allowNum == 0 || self.canUploadNum() == 0 ){
							self.BDUploader.removeFile( file );
							alert('上传文件数量超出限制,'+'最多上传'+self.options.fileNumLimit+'个文件');
							return false;
						}
						
						var $picItem,   //上传项
							$picList 		=  $("#"+ self.options.listName),	//$picList为容器jQuery实例 上传列表
							thumbnailWidth 	= 80,	//缩略图宽
							thumbnailHeight = 80,	//缩略图高
							fileId 			= file.id,	//文件上传ID
							fileName 		= file.name,	//文件名
							fileSize 		= WebUploader.formatSize(file.size) 		//文件大小
							;
				       $picItem = $(
									    '<div id="' + fileId + '" class="uploader-item" title="' + fileName + '">'+
								    		'<div class="item-loader">' +
								    			'<div class="bar" style="width: 0%"></div>' +
								    		'</div>' +
											'<div class="item-img" style="background-image:url()"></div>' +
											'<div class="item-size"><span>' + fileSize  + '</span></div>' +
											'<div class="item-ctrl webuploader-pick-file-close" data-queueid="'+ fileId +'">&times;</div>' +
								    	'</div>'
							    		   
				            	   );
				 
					    if($picList.length){
					    	$picList.append( $picItem );
					    }
	
					    // 创建缩略图
					    // 如果为非图片文件，可以不用调用此方法。
					    // thumbnailWidth x thumbnailHeight 为 100 x 100
					    if(file){
						   var  $img = $picItem.find('.item-img');
						   self.BDUploader.makeThumb( file, function( error, src ) {
						        if ( error ) {
						            $img.replaceWith('<span>不能预览</span>');
						            return;
						        }
						        $img.css( 'background-image','url('+src+')' );
						    }, thumbnailWidth, thumbnailHeight );
					    }
						
					});
				}
				/**
				 * 默认上传进度处理
				 */
				if(!self.options.uploadEvents.uploadProgress){
					self.BDUploader.on('uploadProgress',function(file, percentage){
					    var $li = $( '#'+file.id ),
					        $percent = $li.find('.bar');
						    $percent.css( 'width', percentage * 100 + '%' );
						    if( percentage == 1){
						    	$li.addClass('complete');	    	
						    }
					});
				}
				/**
				 * 默认文件上传验证错误提示
				 */
				if(!self.options.uploadEvents.error){
					self.BDUploader.on('error',function(type){
						var title = '',msg = '',errtype = 'error';
						switch (type) {
							case 'Q_EXCEED_NUM_LIMIT':
								title = '上传文件数量超出限制';
								msg   = '最多上传'+self.options.fileNumLimit+'个文件';
								break;
							case 'F_EXCEED_SIZE':
								title = '单个文件大小超出限制';
								msg   = '最大上传'+WebUploader.formatSize(self.options.fileSingleSizeLimit);
								break;
							case 'Q_EXCEED_SIZE_LIMIT':
								title = '文件总大小超出限制';
								msg   = '最大上传'+WebUploader.formatSize(self.options.fileSizeLimit);
								break;
							case 'Q_TYPE_DENIED':
								title = '文件类型限制';
								msg   = self.options.accept.extensions;
								break;
							case 'F_DUPLICATE':
								title = '同名文件已存在';
								break;
							default:
								title = '未知类型上传错误'+type;
								break;
						}
						alert(title+msg);
					});
				}
				/**
				 * 默认文件上传出错时处理
				 */
				if(!self.options.uploadEvents.uploadError){
					self.BDUploader.on('uploadError',function(file ,reason){
						console.log(file);
						console.log(reason);
					});	
				}
				/**
				 * 默认文件上传成功处理
				 */
				if(!self.options.uploadEvents.uploadSuccess){
					self.BDUploader.on('uploadSuccess',function(file ,response){
						
						//客户端完成上传，服务端返回错误信息
						if(response.err){
							$('#'+file.id).remove();
							self.BDUploader.removeFile(file.id, true);
							alert(response.err);
							
							return false;
						}
						
						var fileVal =  self.getHiddenValue();
						var $fileItem = $("#"+file.id);
							$fileItem.find('.webuploader-pick-file-close').attr('data-fileid',response.msg.fileid).attr('data-filepath',response.msg.url);
						var responseVal = '';
							responseVal = self.options.hiddenValType == '1' ? response.msg.fileid : response.msg.url 
							fileVal  = fileVal != '' ? fileVal + self.options.separator + responseVal : responseVal;
							self.setHiddenValue(fileVal);
							self.allowNum --;
							
							$( '#'+file.id ).addClass('complete');
					});	
				}
				/**
				 * 默认文件上传完成时触发。不管成功或者失败
				 */
				if(!self.options.uploadEvents.uploadComplete){
					self.BDUploader.on('uploadComplete',function(file){
						$( '#'+file.id ).addClass('complete');
					});	
				}

		}

		,remove:function(){
			var self = this;
			var $list = $('#'+self.options.listName);
			if($list.length == 0){
				return false;
			}
			$list.on('click','.webuploader-pick-file-close',function(){
				var $closeElement = $(this);
				var fileId  = parseInt($closeElement.data('fileid'),10);//上传文件的保存编号
				var filePath = $.trim($closeElement.data('filepath'));	//上传文件的保存路径
				var queueId = $.trim($closeElement.data('queueid'));	//文件所在队列的变化以 WU_FILE开头
				if(fileId > 0){

					$.post(self.options.delUrl,{"id":fileId},function(json){
						if(json.status == 'SUCCESS'){
							if(self.options.hiddenValType == '1' ){
								self.resetHiddenVal(fileId);
							}else{
								self.resetHiddenVal(filePath);
							}
							$('#'+queueId).remove();
							
							if(queueId.substring(0,7) == 'WU_FILE'){
								self.BDUploader.removeFile(queueId, true);
							}
							self.allowNum ++;
						}else{
							alert(json.msg);
						}
					},'json');
				}
			});
			
		}
		//重置隐藏域的值
		,resetHiddenVal:function(val){
			var self = this;
			var hdnVal = self.getHiddenValue();
			var valArr = hdnVal.split(self.options.separator);
				valArr = self.returnNewArr(val,valArr);
				self.setHiddenValue(valArr.join(self.options.separator));
		}
		//删除数组中的指定的值
		,returnNewArr:function (value,arr){
			  var tmpArr = new Array();
			  for (var i = 0; i < arr.length; i++) {
			        if (arr[i] != value){
			     	    tmpArr.push(arr[i]);
			        }
			   }
			 return tmpArr;
		}
		//获取隐藏域中的值的个数
		,getHiddenValNum:function(){
			var self = this,existsVal = new Array() ;
			var hdnVal = self.getHiddenValue();
				if(hdnVal){
					existsVal = hdnVal.split(self.options.separator);
				}
				return existsVal.length;
		}
		//是否允许上传
		,canUploadNum:function(){
			return this.options.fileNumLimit - this.getHiddenValNum();
		}
		,getHiddenValue:function(){
			return $("#"+this.options.hiddenName).val();
		}
		,setHiddenValue:function(val){
			return $("#"+this.options.hiddenName).val(val);
		}
	});
	//插件入口
	$.fn[pluginName] = function(options) {
		var opts = $.extend({pick:'#'+this.attr("id")}, options);
		var o = new Upload(this, opts);
			o.initUploader();
			if(o.options.isDelete == true){
				o.remove();
			}
	}
	//插件默认参数
	$.fn[pluginName].defaults = {
		 dnd				:undefined,//指定Drag And Drop拖拽的容器，如果不指定，则不启动 
		 disableGlobalDnd	:false,//是否禁掉整个页面的拖拽功能，如果不禁用，图片拖进来的时候会默认被浏览器打开
		 paste				:undefined,//指定监听paste事件的容器，如果不指定，不启用此功能。此功能为通过粘贴来添加截屏的图片。建议设置为document.body.
		/** 
		  * pick				:undefined,//指定选择文件的按钮容器，不指定则不创建按钮。
		  * id {Seletor|dom} 指定选择文件的按钮容器，不指定则不创建按钮。注意 这里虽然写的是 id, 但是不是只支持 id, 还支持 class, 或者 dom 节点。
		  * label {String} 请采用 innerHTML 代替
		  * innerHTML {String} 指定按钮文字。不指定时优先从指定的容器中看是否自带文字。
		  * multiple {Boolean} 是否开起同时选择多个文件能力。
		  */
		 accept 			:null,//指定接受哪些类型的文件。 由于目前还有ext转mimeType表，所以这里需要分开指定。
		 /**
		  * 
		  * title {String} 文字描述
		  * extensions {String} 允许的文件后缀，不带点，多个用逗号分割。
		  * mimeTypes {String} 多个用逗号分割。
		  * 如：{
			    title: 'Images',
			    extensions: 'gif,jpg,jpeg,bmp,png',
			    mimeTypes: 'image/*'
			   }
		  */
		 
		 thumb				:{},//配置生成缩略图的选项。
			/**
			 * {
			    width: 110,
			    height: 110,
			
			    // 图片质量，只有type为`image/jpeg`的时候才有效。
			    quality: 70,
			
			    // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
			    allowMagnify: true,
			
			    // 是否允许裁剪。
			    crop: true,
			
			    // 为空的话则保留原有图片格式。
			    // 否则强制转换成指定的类型。
			    type: 'image/jpeg'
			}
			 */
		 compress 			:{},// {Object} [可选]		 配置压缩的图片的选项。如果此选项为false, 则图片在上传前不进行压缩。
			/**
				 * {
				    width: 1600,
				    height: 1600,
				
				    // 图片质量，只有type为`image/jpeg`的时候才有效。
				    quality: 90,
				
				    // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
				    allowMagnify: false,
				
				    // 是否允许裁剪。
				    crop: false,
				
				    // 是否保留头部meta信息。
				    preserveHeaders: true,
				
				    // 如果发现压缩后文件大小比原来还大，则使用原来图片
				    // 此属性可能会影响图片自动纠正功能
				    noCompressIfLarger: false,
				
				    // 单位字节，如果图片大小小于此值，不会采用压缩。
				    compressSize: 0
				}
			 */
		 auto			: true,//设置为 true 后，不需要手动调用上传，有文件选择即开始上传。
		 runtimeOrder	: 'html5,flash',//指定运行时启动顺序。默认会想尝试 html5 是否支持，如果支持则使用 html5, 否则则使用 flash.可以将此值设置成 flash，来强制使用 flash 运行时。
		 prepareNextFile: false,//是否允许在文件传输时提前把下一个文件准备好。 对于一个文件的准备工作比较耗时，比如图片压缩，md5序列化。 如果能提前在当前文件传输期处理，可以节省总体耗时。
		 chunked		: false,//是否要分片处理大文件上传。
		 chunkSize		: 5242880,//如果要分片，分多大一片？ 默认大小为5M.
		 chunkRetry		: 2,//如果某个分片由于网络问题出错，允许自动重传多少次？
		 threads		: 3,//上传并发数。允许同时最大上传进程数。
		 formData		: {},//文件上传请求的参数表，每次发送都会发送此对象中的参数。
		 fileVal		: 'file',//设置文件上传域的name。
		 method			: 'POST',//文件上传方式，POST或者GET。
		 sendAsBinary	: false,//是否已二进制的流的方式发送文件，这样整个上传内容php://input都为文件内容， 其他参数在$_GET数组中。
		 fileNumLimit	: undefined,//验证文件总数量, 超出则不允许加入队列。
		 fileSizeLimit	: undefined,//验证文件总大小是否超出限制, 超出则不允许加入队列。以字节为单位
		 fileSingleSizeLimit: undefined,//验证单个文件大小是否超出限制, 超出则不允许加入队列。以字节为单位
		 duplicate		: undefined,//去重， 根据文件名字、文件大小和最后修改时间来生成hash Key.
		 disableWidgets	: undefined,//默认所有 Uploader.register 了的 widget 都会被加载，如果禁用某一部分，请通过此 option 指定黑名单。 
		 swf			: 'js/uploader/webuploader/dist/Uploader.swf',
	     server			: 'file/upload',// 文件接收服务端。
	     /**
	      * ΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔΔ
	      * 以上参数是百度上传组件默认参数
	      * 以下参数是非百度上传组件参数（即本插件根据实际开发设置的参数）
	      * ∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨
	      */
	     uploadEvents   : {},  //上传事件
		 isDelete		: true,//文件删除是否开启，开启后上传文件显示列表有删除文件按钮，默认开启
		 hiddenName     : 'fileids',//文件上传隐藏域ID
		 hiddenValType  : '1',//文件上传隐藏域保存的值的类型   1=保存的是file表的文件编号ID，2=保存的是文件的实际路径
		 listName		: 'fileList', //文件上传完成显示列表区域id
		 editListName	: 'editfileList', //文件上传完成显示列表区域id
		 delUrl			: 'file/delete',
		 separator		: ',', //默认逗号
	}
	
})(jQuery,window);

