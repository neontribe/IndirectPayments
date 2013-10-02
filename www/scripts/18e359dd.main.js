function nano(a,b){return a.replace(/\{([\w\.]*)\}/g,function(a,c){for(var d=c.split("."),e=b[d.shift()],f=0,g=d.length;g>f;f++)e=e[d[f]];return"undefined"!=typeof e&&null!==e?e:""})}function get_latest_content(a){$.ajax({url:options.apiEndpoints.posts,cache:!1,success:a,error:function(a,b,c){log("error",a,b,c)}})}function glossary(a){var b=$("#"+a).parents("section").find("h3");b=_.sortBy(b,function(a){return $(a).text().length}).reverse(),$.each(b,function(a,b){var c=$(b).text(),d=$(b).nextUntil("h3").text(),e=new RegExp("("+c+")","gi"),f='<span class="term" role="button" tabindex="0" aria-haspopup="true">$1</span><span class="definition a11y-hide a11y-none" aria-hidden="true"> '+d+"</span>";$("#container section:not(.glossary) p, #container section:not(.glossary) strong").replaceText(e,f)})}function case_studies(a){var b=$("#"+a).parents("section").find("h3");$.each(b,function(a,b){var c=$(b).text(),d=a+1,e=all_html($(b).nextUntil("h3")),f=new RegExp('\\[case_study number="'+d+'"\\]',"gi");$("#container section:not(.case-studies) p").replaceText(f,"<details><summary>"+c+"</summary><div>"+e+"</div></details>")}),$("details").unwrap()}function all_html(a){var b=[];return a.each(function(){b.push($(this).clone().wrap("<p>").parent().html())}),b.join("")}function display_posts(a){a&&($("#container, #sideNav ul").html(""),$.isArray(a)||(a=JSON.parse(a)),$.each(a,function(a,b){b.classes=_.pluck(b.tags,"slug").join(" "),_.findWhere(b.tags,{slug:"app-prompt"})?$("#sticky").html(b.content):($("#container").append(nano('<section class="{classes}"><h2 id="{slug}">{title}</h2>{content}</section>',b)),$("#sideNav ul").append(nano('<li class="{classes}"><a href="#{slug}">{title}</a></li>',b)),_.findWhere(b.tags,{slug:"glossary"})&&glossary(b.slug),_.findWhere(b.tags,{slug:"case-studies"})&&case_studies(b.slug))}))}function set_hash(a){a.match(/^#/)||(a="#"+a),history.pushState&&history.pushState(null,null,a)}function save_position(){lastPosition.push({value:$("#content").scrollTop(),article:location.hash}),$("#back").attr("disabled",!1)}function scroll_handler(){var a=$("#container h2:in-viewport"),b=$(a[0]).attr("id");$first=$("#sideNav a[href='#"+b+"']"),$def=$("#definitions"),cards=[],$first.length&&($("#sideNav a").removeAttr("aria-selected"),$first.attr("aria-selected","true"),set_hash(b))}function init_drawers(){$(window).width()<=options.drawersThreshold?(log("Enabling Snap"),snapper.enable(),snapperEnabled=!0):(log("Disabling Snap"),snapper.disable(),snapperEnabled=!1)}function init_content(){localStorage.posts||$.ajax({dataType:"json",async:!1,url:"content/posts.json",success:function(a){localStorage.posts=JSON.stringify(a.posts)}})}function closePrint(){document.body.removeChild(this.__container__)}function printPage(a){var b=document.createElement("iframe");b.onload=function(){var b=a;return function(){this.contentWindow.__container__=this,this.contentWindow.onbeforeunload=closePrint,this.contentWindow.onafterprint=closePrint,$("#content",this.contentWindow.document).html(b.html()),this.contentWindow.print()}}(),b.style.visibility="hidden",b.style.position="fixed",b.style.right="0",b.style.bottom="0",b.src="print.html",document.body.appendChild(b)}var webHostName="indirectpayments.neontribe.co.uk",apiBase="http://"+webHostName+"/api/",scripts=document.getElementsByTagName("script"),lastScript=scripts[scripts.length-1],scriptName=lastScript.src.replace(/^.*\/(.+\.js)$/,"$1"),dev="main.js"===scriptName,options={apiEndpoints:{posts:apiBase+"get_posts/?count=100"},historyLimit:10,viewportThreshold:60,scrollTopPadding:20,drawersThreshold:800,scrollDuration:1e3,debug:dev},lastPosition=[],cache={contentViewport:$("#content").outerHeight(!0),active:null},webHosts=[webHostName,"mottokrosh.local"],isApp=-1===$.inArray(location.hostname,webHosts),snapperEnabled=!1;$.extend($.expr[":"],{"in-viewport":function(a){var b=$(a).offset().top;return b>options.viewportThreshold&&b<cache.contentViewport-options.viewportThreshold}}),window.log=function(){log.history=log.history||[],log.history.push(arguments),console&&options.debug&&"function"==typeof console.log&&console.log.apply(console,arguments)},$("body").on("click","a[href*='#']:not([href='#']):not(#menu)",function(a){if(location.pathname.replace(/^\//,"")===this.pathname.replace(/^\//,"")||location.hostname==this.hostname){var b=$(this.hash),c=this.hash;if(b=b.length?b:$("[name="+this.hash.slice(1)+"]"),b.length){a.preventDefault();var d=b.offset().top+$("#content").scrollTop()-(options.viewportThreshold+options.scrollTopPadding);save_position(),$("#content").animate({scrollTop:d},options.scrollDuration,function(){set_hash(c)}),"left"===snapper.state().state&&setTimeout(snapper.close,options.scrollDuration)}}}),$("body").on("click","#back",function(a){a.preventDefault();var b=lastPosition.pop();$("#content").animate({scrollTop:b.value},1e3,function(){0===lastPosition.length&&$("#back").attr("disabled",!0),set_hash(b.article)})}),$("body").on("click","#menu",function(a){if(a.preventDefault(),snapperEnabled){var b=snapper.state();"closed"===b.state?(snapper.open("left"),$("#sideNav").focus()):snapper.close()}else save_position(),$("#content").animate({scrollTop:0},options.scrollDuration,function(){$("#sideNav").focus(),setTimeout(function(){set_hash("")},0)})}),$("body").on("click","#home",function(a){a.preventDefault(),save_position(),$("#content").animate({scrollTop:0},options.scrollDuration,function(){$("#sideNav").focus(),setTimeout(function(){set_hash("")},0)})}),$("#container").on("click",".term",function(){$("#definitions dt, #definitions dd").removeClass("slideIn");var a=$(this),b=a.next("span"),c={title:a.text(),definition:b.text()},d=nano("<dl><dt><img src='images/icon_bulb.png' alt='' /> {title}</dt><dd>{definition}</dd></dl>",c);b.attr({"aria-hidden":!1,role:"alertdialog"}).removeClass("a11y-none"),$("#definitions").html(d),setTimeout(function(){$("#definitions dl").addClass("slideIn")},100),snapperEnabled&&"closed"===snapper.state().state&&snapper.open("right"),$("#definitions dl").one("click",function(){var a=$(this);$("html").hasClass("csstransitions")?a.removeClass("slideIn").on("webkitTransitionEnd oTransitionEnd transitionend msTransitionEnd",function(){a.remove(),b.attr({"aria-hidden":!0,role:null}).addClass("a11y-none"),snapperEnabled&&"right"===snapper.state().state&&snapper.close()}):(a.removeClass("slideIn").remove(),b.attr({"aria-hidden":!0,role:null}).addClass("a11y-none"),snapperEnabled&&"right"===snapper.state().state&&snapper.close())})}),$("body").on("click","section h2 button",function(a){a.preventDefault();var b=$(this).parents("section");printPage(b)}),$("body").on("click",".checklist button",function(a){a.preventDefault();var b=$(this).parent().next("div");b.is(":visible")?b.hide().attr("role",null):b.show().attr("role","alertdialog")}),$(window).resize(function(){cache.contentViewport=$("#content").outerHeight(!0),init_drawers()}),$("#content").on("scroll",_.throttle(scroll_handler,100)),FastClick.attach(document.body);var snapper=new Snap({element:document.getElementById("content"),touchToDrag:!1});init_drawers(),init_content(),display_posts(localStorage.posts),get_latest_content(function(a){log(a),display_posts(a.posts),localStorage.posts=JSON.stringify(a.posts),location.hash&&$("#content").scrollTop($("#content").scrollTop()-options.scrollTopPadding),$("details").details()});