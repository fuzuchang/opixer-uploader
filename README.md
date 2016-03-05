# opixer.uploader.js
基于百度上传组件webuploader为基础进行的二次封装上传插件

需要引入三个文件：
<script type="text/javascript" src="../jquery-1.12.1.js"></script>
<script type="text/javascript" src="../webuploader/dist/webuploader.js"></script>
<script type="text/javascript" src="../opixer.uploader.js"></script>
如需要需要自定义样式
HTML结构：
<!-- 隐藏域，用来保存上传的保存地址或者文件编号 -->
<input type="hidden" id="fileids" name="fileids" />
<!-- 上传按钮 -->
<div id="picPicker">上传图片</div>
<!-- 定义上传文件的预览区域 -->
<div id="picPickerList"></div>

<!-- javascript调用 -->
<script type="text/javascript">
	//上传URI
	var sUploadURI = '';
	/**
	 * 图片上传
	 */
	$("#picPicker").OPXUploader({
		accept : {
			title : 'Images',
			extensions : 'gif,jpg,jpeg,bmp,png',
			mimeTypes : 'image/*'
		},
		fileNumLimit : 99, // 上传数量限制
		hiddenName : 'fileids', // 表单隐藏域id
		listName : 'picPickerList',
		fileSingleSizeLimit : 30 * 1024 * 1024,
		formData : {
			filename : 'file',
			filetype : 'image'
		}
	});
</script>
