
var mainLayout = new Swiper("#container",{
	direction : "vertical",
	mousewheelControl : true,
	pagination : ".pager",
	paginationClickable : true,
    nextButton:".slidenext"
})

  lightbox.option({
  'resizeDuration': 180,
  'wrapAround': true,
  'disableScrolling':false,        
  'fitImagesInViewport':false 
}) 

var sliderCount = $(".mainSlider li").size()	
if(sliderCount>1){
$(".mainSlider ul").bxSlider({
        pager:false,               
        control:true,               
        autoControls:false,        
        autoControlsCombine:true,   
        auto:false,                           
        pause:1000,                    
        speed:1000,                 
        sideWidth:1100             
    })
}  