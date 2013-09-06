var apiBase = "http://mottokrosh.local/IndirectPayments/wordpress/api/",
	options = {
	apiEndpoints: {
		posts: apiBase + "get_posts/",
		pages: apiBase + "get_page_index/"
	},
	debug: true
};

window.log = function () {
	log.history = log.history || [];
	log.history.push(arguments);
	if ( console && options.debug ) {
		console.log.apply(console, arguments);
	}
};

// Nano Templates (Tomasz Mazur, Jacek Becela, https://github.com/trix/nano)
function nano(template, data) {
	return template.replace(/\{([\w\.]*)\}/g, function(str, key) {
		var keys = key.split("."), v = data[keys.shift()];
		for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
		return (typeof v !== "undefined" && v !== null) ? v : "";
	});
}

function get_latest_content(type, successCallback) {
	$.ajax({
		url: options.apiEndpoints[type],
		cache: false,
		success: successCallback,
		error: function (xhr, textStatus, thrownError) {
			log("error", xhr, textStatus, thrownError);
		}
	});
}

function display_posts(posts) {
	if ( !posts ) {
		return;
	}

	// reset contents
	$("#container, #sideNav ul").html("");

	// parse if necessary
	if ( !$.isArray(posts) ) {
		posts = JSON.parse(posts);
	}

	// content
	$.each(posts, function (i, post) {
		$("#container").append(nano('<article><h2 id="{slug}">{title}</h2>{content}</article>', post));
		$("#sideNav ul").append(nano('<li><a href="#{slug}">{title}</a></li>', post));
	});
}

function display_pages(pages) {
	if ( !pages ) {
		return;
	}

	// reset contents
	$("#topNav ul").html("");

	// parse if necessary
	if ( !$.isArray(pages) ) {
		pages = JSON.parse(pages);
	}

	// content
	$.each(pages, function (i, page) {
		$("#topNav ul").append(nano('<li><a href="#{slug}">{title}</a></li>', page));
	});
}

// set up drawers
var snapper = new Snap({
	element: document.getElementById('content')
});

// smooth anchor scrolling
/*$("body").on("click", "a[href*='#']:not([href='#'])", function (evt) {
	if ( location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {
		var $target = $(this.hash), target = this.hash;
		log($target, target);

		$target = $target.length ? $target : $('[name=' + this.hash.slice(1) +']');

		if ($target.length) {
			evt.preventDefault();
			var offset = "-" + $target.offset().top + "px";
			log(offset);
			$("#contentWrapper").css({ "transition": "all 1s ease" });
			$("#contentWrapper").css({ "margin-top": offset });
			$("#contentWrapper").on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function () {
				//debugger;
				$("#contentWrapper").css("transition", "none");
				$("#contentWrapper").css({ "margin-top": "0" });
				$("#content").scrollTop($target.offset().top);
			});
		}
	}
});*/

// smooth anchor scrolling
$("body").on("click", "a[href*='#']:not([href='#'])", function (e) {
	if ( location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {
		var $target = $(this.hash),
			target = this.hash;
		$target = $target.length ? $target : $('[name=' + this.hash.slice(1) +']');
		if ( $target.length ) {
			e.preventDefault();
			var offset = $target.offset().top + $("#content").scrollTop(),
				velocity = 600.0,  // pixels per second
				duration = Math.abs( parseFloat($target.offset().top) / velocity );
			log(this.hash, offset, duration);
			$("#content").animate({ scrollTop: offset }, duration * 1000, function () {
				location.hash = target;
			});
		}
	}
});

// display locally stored content
display_posts(localStorage["posts"]);
display_pages(localStorage["pages"]);

// attempt to get latest content from remote
get_latest_content("posts", function (data) {
	log(data);

	// display it
	display_posts(data.posts);

	// store it
	localStorage["posts"] = JSON.stringify(data.posts);

	// get pages too
	get_latest_content("pages", function (data) {
		log(data);

		// display it
		display_pages(data.pages);

		// store it
		localStorage["pages"] = JSON.stringify(data.pages);
	});
});
