var apiBase = "http://mottokrosh.local/IndirectPayments/wordpress/api/",
	options = {
		apiEndpoints: {
			posts: apiBase + "get_posts/",
			pages: apiBase + "get_page_index/"
		},
		historyLimit: 10,
		viewportThreshold: 60,
		debug: true
	},
	lastPosition = [],
	navigationHeight = 60 + 15,
	cache = {
		contentViewport: $("#content").outerHeight(true),
		articlesInViewport: [],
		active: null
	};

//
// --- Functions ---
//

// IE safe console log, toggleable through options.debug
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

	cache.articles = $("#container h2");
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

function set_hash(target) {
	if ( !target.match(/^#/) ) {
		target = "#" + target;
	}

	if (history.pushState) {
		history.pushState(null, null, target);
	} else {
		location.hash = target;
	}
}

function save_position() {
	lastPosition.push({
		value: $("#content").scrollTop(),
		article: location.hash
	});

	// be sure the back button is enabled
	$("#back").attr("disabled", false);
}

function scroll_handler() {
	var inView = $("#container h2:in-viewport"),
		id = $(inView[0]).attr("id");
		$first = $("#sideNav a[href='#" + id + "']");

	if ( $first.length ) {
		$("#sideNav a").removeClass("active");
		$first.addClass("active");
		set_hash(id);
	}
}

$.extend($.expr[":"], {
	"in-viewport": function (element) {
		var offset = $(element).offset().top;
		return ( offset > options.viewportThreshold && offset < cache.contentViewport - options.viewportThreshold );
	}
});

//
// --- Listeners ---
//

// smooth anchor scrolling
$("body").on("click", "a[href*='#']:not([href='#'])", function (evt) {
	if ( location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {
		var $target = $(this.hash),
			target = this.hash;
		$target = $target.length ? $target : $('[name=' + this.hash.slice(1) +']');

		if ( $target.length ) {
			evt.preventDefault();
			var offset = $target.offset().top + $("#content").scrollTop() - navigationHeight,
				velocity = 600.0,  // pixels per second
				duration = Math.abs( parseFloat($target.offset().top - navigationHeight) / velocity );

			// save current position before moving on
			save_position();

			// scroll
			log(this.hash, offset, duration, lastPosition);
			$("#content").animate({ scrollTop: offset }, duration * 1000, function () {
				set_hash(target);
			});
		}
	}
});

// app's back button
$("body").on("click", "#back", function (evt) {
	evt.preventDefault();
	var last = lastPosition.pop();

	$("#content").animate({
		scrollTop: last.value
	}, 1000, function () {
		if ( lastPosition.length === 0) {
			$("#back").attr("disabled", true);
		}
		set_hash(last.article);
	});
});

// menu button
$("body").on("click", "#menu", function (evt) {
	evt.preventDefault();
	var data = snapper.state();
	if ( data.state === "closed" ) {
		snapper.open("left");
	} else {
		snapper.close();
	}
});

// listen to browser window resizes
$(window).resize(function () {
	cache.contentViewport = $("#content").outerHeight(true);
});

// listen to scrolling
$("#content").on("scroll", $.throttle( 250, scroll_handler ));

//
// --- Init ---
//

// set up drawers
var snapper = new Snap({
	element: document.getElementById('content')
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

	// if we opened the page with a hash fragment, make sure its target is
	// not hidden under the main navigation
	if ( location.hash ) {
		$("#content").scrollTop($("#content").scrollTop() - navigationHeight);
	}
});
